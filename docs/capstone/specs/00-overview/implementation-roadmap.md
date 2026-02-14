# Implementation Roadmap — Backend (Bun Main App)

> **Phiên bản**: 1.0 · SP26SE145
> **Mục tiêu**: Triển khai toàn diện theo spec, chia phase rõ ràng, mỗi phase độc lập deploy được.

---

## Tổng quan

Tài liệu này phân tích **gap** giữa 22 spec files và code hiện tại, rồi chia thành **13 phases** triển khai dần.

Mỗi phase có:
- **Mục tiêu** — tại sao phase này cần làm
- **Spec refs** — tài liệu spec liên quan
- **Deliverables** — danh sách cụ thể cần triển khai (files + logic)
- **Dependencies** — phases phải hoàn thành trước
- **Acceptance criteria** — tiêu chí đạt

---

## Status hiện tại (Baseline)

| Module | Đã có | Thiếu so với spec |
|--------|-------|-------------------|
| **Auth** | Login, register, refresh rotation, logout, /me, macros | Max 3 tokens/user, reuse detection, jti claim, device tracking, `device_info` column |
| **Users** | Full CRUD, hard delete, ownership checks | — |
| **Questions** | CRUD, versioning, hard delete | Content JSONB validation, `search_vector` + functional indexes |
| **Submissions** | CRUD, grade, auto-grade (exact match), `numeric` scores, `vstep_band` enum, 5-state machine | Skill routing (MCQ auto vs Redis queue), Redis enqueue for writing/speaking |
| **Progress** | Basic CRUD (create/update/list), `numeric` scores, `vstep_band` targetBand | Sliding window, trend, spider chart, ETA, overall band, update triggers |
| **Exams** | CRUD, sessions, answers, complete, `numeric` scores, `submitted` status | Score calculation, exam→submission linking, section management |
| **Goals** | Table exists | Toàn bộ API (CRUD) |
| **SSE** | — | Toàn bộ |
| **Queue** | — | Redis queue (arq), enqueue grading jobs, worker writes results to DB |
| **Review** | — | Review queue, claim/release, merge rules |
| **Rate limit** | Error class exists | Redis middleware, tier-based limits |
| **Infra** | Error plugin, logger, env validation | /api prefix, health check, correlation IDs, structured logs |

---

## Phase 1: Foundation Hardening

**Mục tiêu**: Chuẩn hóa nền tảng API trước khi build tính năng mới.

**Spec refs**: `api-conventions.md`, `errors.md`, `authentication.md`

### Deliverables

#### 1.1 API prefix `/api`
- Mount tất cả modules dưới `/api` (spec yêu cầu: "Tất cả paths relative tới base `/api`")
- Health check ở root: `GET /health` (ngoài `/api`)
- Swagger docs tại `/api/docs`

#### 1.2 Health check endpoint
```
GET /health → { status: "ok", services: { db: "ok", redis: "ok" | "unavailable" } }
```
- Check PostgreSQL connection
- Check Redis (graceful — trả unavailable nếu chưa cài)

#### 1.3 Error code standardization
- Thêm `TOKEN_EXPIRED` error code (tách khỏi `UNAUTHORIZED`) — spec yêu cầu riêng
- `error.code` field trong response phải là stable string (`VALIDATION_ERROR`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`)
- `requestId` trong mọi error response (spec `errors.md`)

#### 1.4 Auth enhancements
- **Max 3 active refresh tokens per user**: Khi login, count active tokens; nếu >= 3, revoke cũ nhất (FIFO)
- **Reuse detection**: Khi refresh token đã bị rotate mà vẫn dùng lại → revoke **toàn bộ tokens của user** (token family revoke)
- **jti claim** trong access token (spec yêu cầu: `sub`, `role`, `jti`, `iat`, `exp`)
- **device_info column**: Thêm `deviceInfo` (TEXT, nullable) vào `refreshTokens` schema — lưu User-Agent/IP cho device management UI

#### 1.5 Correlation ID
- Plugin tạo `requestId` (UUID) cho mỗi request
- Đọc `X-Request-Id` header nếu có, otherwise generate
- Inject vào context, log, error response
- Forward vào queue messages sau này

### Dependencies
- Không

### Acceptance criteria
- Tất cả routes dưới `/api/*`, health ở `/health`
- Error response có `requestId` field
- Token expired trả `TOKEN_EXPIRED` (không phải generic `UNAUTHORIZED`)
- Login lần thứ 4 tự revoke token cũ nhất
- Refresh token reuse → revoke all user tokens → 401

---

## Phase 2: Submission Lifecycle & Auto-grading

**Mục tiêu**: Submission hoạt động đúng state machine, listening/reading được auto-grade ngay.

**Spec refs**: `submission-lifecycle.md`, `api-endpoints.md` §2.2

### Deliverables

#### 2.1 Skill-based routing khi tạo submission
```
POST /api/submissions { questionId, skill, answer }
```
- **Listening/Reading**: auto-grade ngay (so answer_key) → status = `completed` → return result
- **Writing/Speaking**: tạo submission `pending` → enqueue Redis job (arq) → return submission + SSE URL

#### 2.2 Auto-grade listening/reading
- Lookup `questions.answerKey` cho questionId
- So sánh answer với answerKey
- Tính `accuracy%` → map sang `score 0-10` (configurable mapping, monotone increasing)
- Band derivation từ score
- Set status = `completed`, ghi result vào `submissionDetails`
- Ghi `submissionEvents` record (kind = `completed`)

#### 2.3 State machine enforcement
- Service method `transitionStatus(submissionId, fromStatus, toStatus)` với allowed transitions:
  ```
  pending → processing
  processing → completed | review_pending | failed
  review_pending → completed
  pending → failed
  ```
- Reject invalid transitions with 409 CONFLICT

#### 2.4 Redis queue enqueue
- Khi tạo writing/speaking submission:
  1. INSERT submission (status = pending) + INSERT submissionDetails (in transaction)
  2. Enqueue job vào Redis list (arq protocol) with `{ submissionId, skill, questionId }`
  3. arq worker picks up job, calls LLM/STT, writes result directly to PostgreSQL

#### 2.5 GET /api/submissions/:id/status
- Polling fallback endpoint (khi SSE không khả dụng)
- Return: `{ status, progress (nếu processing), result (nếu completed) }`

#### 2.6 Schema alignment
- Unified `skill` enum across all tables (shared from `enums.ts`)
- No `deleted_at` columns (hard delete + ON DELETE CASCADE)

### Dependencies
- Phase 1 (API prefix, requestId)

### Acceptance criteria
- POST submission listening/reading → instant completed + score + result
- POST submission writing → pending + Redis job enqueued
- Invalid status transitions bị reject

---

## Phase 3: Goals Module

**Mục tiêu**: Learner thiết lập mục tiêu học tập.

**Spec refs**: `api-endpoints.md` §2.5, `database-schema.md` (user_goals)

### Deliverables

#### 3.1 GoalService
- `getByUser(userId)` — goal hiện tại (latest active)
- `create(userId, { targetBand, deadline?, dailyStudyTimeMinutes? })`
- `update(goalId, userId, body)` — chỉ owner
- `list(userId)` — history

#### 3.2 Goal routes
```
GET    /api/goals         — goal hiện tại + trạng thái đạt/chưa
POST   /api/goals         — tạo goal mới
PATCH  /api/goals/:id     — update goal (owner only)
```

#### 3.3 Goal status computation
- `achieved`: true nếu `currentEstimatedBand >= targetBand`
- `onTrack`: true nếu ETA <= deadline (Phase 4 sẽ tính ETA, ở đây stub `null`)
- `daysRemaining`: deadline - now

### Dependencies
- Phase 1

### Acceptance criteria
- CRUD goals hoạt động
- Chỉ owner update được goal
- Response có trạng thái achieved/onTrack/daysRemaining

---

## Phase 4: Progress Computation Engine

**Mục tiêu**: Tính toán progress đúng spec (sliding window, trends, spider chart, ETA).

**Spec refs**: `progress-tracking.md`, `api-endpoints.md` §2.4

### Deliverables

#### 4.1 Sliding window computation
- Per skill: query 10 attempts gần nhất (`status = completed`)
- Compute: `windowAvg`, `windowStdDev`
- Nếu < 3 attempts: return `insufficient_data`

#### 4.2 Trend classification
- `delta = avg(last 3) - avg(previous 3)`
- Rules:
  - `inconsistent` nếu `windowStdDev >= 1.5`
  - `improving` nếu `delta >= +0.5`
  - `declining` nếu `delta <= -0.5`
  - `stable` còn lại

#### 4.3 Overall band derivation
- Per-skill band: từ grading result gần nhất (writing/speaking) hoặc score→band mapping (listening/reading)
- `overallBand = min(band_per_skill)` — skill nào thiếu data → low_confidence

#### 4.4 Spider chart endpoint
```
GET /api/progress/spider-chart
```
Response:
```json
{
  "skills": ["listening", "reading", "writing", "speaking"],
  "current": [75, 82, 60, 55],
  "previous": [70, 80, 58, 50],
  "target": [80, 80, 70, 70],
  "trend": ["improving", "stable", "improving", "declining"],
  "confidence": ["high", "medium", "low", "low"]
}
```

#### 4.5 ETA heuristic
- Cần goal (targetBand) + >= 6 attempts per skill
- `rate` = thay đổi windowAvg theo tuần
- ETA per skill = gap / rate (weeks)
- `totalETA = max(ETA per skill)` — skill chậm nhất quyết định
- Return `unknown` nếu không đủ data

#### 4.6 Progress by skill endpoint
```
GET /api/progress/:skill
```
- Return: windowAvg, windowStdDev, trend, scores[], scaffoldLevel, bandEstimate, attemptCount

#### 4.7 Update triggers
- **Event-driven**: khi submission → COMPLETED, recompute affected skill's window + trend + userProgress record
- Ghi `userSkillScores` record cho mỗi completed submission

### Dependencies
- Phase 2 (submission lifecycle — need valid completed submissions with scores)
- Phase 3 (goals — for ETA computation)

### Acceptance criteria
- Trend classification đúng rule delta/stddev
- Spider chart có đủ fields: current/previous/target/trend/confidence
- Overall band = min(4 skills)
- ETA = unknown khi < 6 attempts; skill chậm nhất khi đủ data
- Progress auto-update on submission completed

---

## Phase 5: Adaptive Scaffolding

**Mục tiêu**: Điều chỉnh mức hỗ trợ (scaffold level) theo performance.

**Spec refs**: `adaptive-scaffolding.md`

### Deliverables

#### 5.1 Stage progression engine
- Input: 3 attempts gần nhất per skill, current scaffoldLevel
- Output: new scaffoldLevel (1/2/3)

**Writing rules** (`scorePct = score * 10`):
| Current stage | Level up | Level down |
|--------------|----------|------------|
| 1 (Template) | avg3 >= 80 → stage 2 | Không |
| 2 (Keywords) | avg3 >= 75 → stage 3 | avg3 < 60 (2 liên tiếp) → stage 1 |
| 3 (Free) | Giữ | avg3 < 65 (2 liên tiếp) → stage 2 |

**Listening rules** (`accuracyPct`):
- Level up: avg3 >= 80 (tăng 1 bậc)
- Level down: avg3 < 50 (2 liên tiếp, giảm 1 bậc)
- Giữ stage: avg3 trong [50, 80)

#### 5.2 Initial stage assignment
- A1-A2 → Stage 1
- B1 → Stage 2
- B2-C1 → Stage 3

#### 5.3 Micro-hints tracking
- Log hint usage per attempt
- Rule: nếu hint usage > 50% attempts trong window 3 bài → block level up

#### 5.4 Integration with submission completion
- Khi submission COMPLETED → recompute scaffoldLevel cho skill tương ứng
- Update `userProgress.scaffoldLevel`

#### 5.5 Schema alignment: scaffolding_type enum
- Tạo `scaffoldingTypeEnum = pgEnum("scaffolding_type", ["template", "keywords", "free"])`
- Đổi `userSkillScores.scaffoldingType` từ `varchar(20)` → `scaffoldingTypeEnum` — enforce valid values ở DB level

### Dependencies
- Phase 4 (progress engine — scoring history needed)

### Acceptance criteria
- Initial stage đúng theo level mapping
- Stage progression đúng threshold
- Level down yêu cầu 2 attempts liên tiếp dưới ngưỡng
- Hint usage > 50% blocks level up

---

## Phase 6: Rate Limiting

**Mục tiêu**: Bảo vệ API khỏi abuse.

**Spec refs**: `rate-limiting.md`

### Deliverables

#### 6.1 Redis connection
- Dùng `import { redis, RedisClient } from 'bun'` (native, built-in Bun 1.3+) — không cần thêm dependency
- Redis connection config từ `REDIS_URL` env var (auto-read bởi default singleton)
- Atomic token bucket: dùng `redis.send("EVAL", [...])` (**chưa documented chính thức** — nếu gặp vấn đề, fallback sang multi-command `INCR` + `EXPIRE` hoặc dùng `ioredis` cho Lua)
- Graceful fallback nếu Redis unavailable (log warning, skip rate limiting)
- **Yêu cầu**: Redis server 7.2+ (Bun.redis dùng RESP3 protocol)

#### 6.2 Token bucket middleware (Elysia plugin)
- Implement sliding window hoặc token bucket algorithm
- Redis key pattern: `rl:{tier}:{identifier}:{window}`

| Tier | Limit | Burst | Identifier |
|------|-------|-------|------------|
| Anonymous | 30/min | 5 | IP |
| Learner | 100/min | 20 | userId |
| Instructor | 500/min | 100 | userId |
| Admin | 500/min | 100 | userId |

#### 6.3 Auth-specific rate limits
- `POST /api/auth/login`: 5/min per IP
- `POST /api/auth/register`: 5/min per IP

#### 6.4 Response headers
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 response kèm `Retry-After` header

#### 6.5 Health check exempt
- `GET /health` không bị rate limiting

### Dependencies
- Phase 1 (API prefix, auth context for tier detection)

### Acceptance criteria
- Vượt limit → 429 với Retry-After
- Headers có trong mọi response
- Auth endpoints có rate limit riêng
- Health check exempt

---

## Phase 7: SSE Real-time Notifications

**Mục tiêu**: Push realtime grading status cho learner.

**Spec refs**: `sse.md`, `api-endpoints.md` §2.7

### Deliverables

#### 7.1 SSE endpoint (Elysia built-in)
```
GET /api/sse/submissions/:id?token=<jwt>
```
- Dùng Elysia built-in `sse()` + `async function*` generator pattern
- Auth via query param `token` (EventSource API không hỗ trợ custom headers)
- Verify ownership (submission.userId === token.sub)
- Elysia tự set `Content-Type: text/event-stream` — **KHÔNG** set thủ công
- Set `Cache-Control`, `Connection`, `X-Accel-Buffering` headers **TRƯỚC** first `yield`

#### 7.2 Event types
```typescript
yield sse({ id: "1", event: "grading.progress", retry: 5000,
  data: { submissionId, step: "transcribing", percent: 30 } });

yield sse({ id: "2", event: "grading.completed",
  data: { submissionId, score: 7.5, band: "B2" } });

yield sse({ id: "3", event: "grading.review_pending",
  data: { submissionId, message: "Đang chờ chấm thủ công" } });

yield sse({ id: "4", event: "grading.failed",
  data: { submissionId, reason: "TIMEOUT" } });

yield sse({ id: "5", event: "ping",
  data: { timestamp: new Date().toISOString() } });
```

#### 7.3 Last-Event-ID replay
- Client gửi `Last-Event-ID` header tự động khi reconnect
- Server đọc từ `request.headers.get("Last-Event-ID")`
- Replay missed events từ `submissionEvents` table

#### 7.4 Heartbeat + lifecycle
- Gửi `ping` event mỗi 30 giây (via `setInterval` + flag)
- Max lifetime: 30 phút → close stream
- Close stream khi submission ở terminal state (completed/failed) + 5s grace
- `request.signal` abort detection → cleanup tự động qua `finally` block

#### 7.5 SSE Hub (in-memory pub/sub)
- Singleton `SSEHub` class: `Map<submissionId, Set<Subscriber>>`
- `subscribe(submissionId)` → `{ iterator, unsubscribe }` — bounded buffer (100 events), backpressure drop oldest
- `publish(submissionId, event)` — fan-out khi grading worker updates submission status in DB
- `closeChannel(submissionId)` — cleanup khi grading kết thúc
- Subscriber tự unsubscribe khi `request.signal` aborted
- Map entry tự xóa khi last subscriber disconnect → ngăn memory leak

### Dependencies
- Phase 2 (submission status tracking)

### Acceptance criteria
- SSE stream nhận events khi submission status thay đổi
- Last-Event-ID replay hoạt động
- Heartbeat mỗi 30s
- Stream close sau terminal state
- Chỉ owner xem được stream

---

## Phase 8: Redis Queue + Grading Worker Integration

**Mục tiêu**: Reliable async grading pipeline via Redis + arq.

**Spec refs**: `reliability.md`

### Deliverables

#### 8.1 Redis queue (arq protocol)
- Main App enqueues grading jobs vào Redis list using arq-compatible format
- Redis connection via `import { redis } from "bun"` (built-in, no extra deps)
- Requires Redis 7.2+ (RESP3 protocol)

#### 8.2 Grading worker (Python/arq)
- arq worker consumes jobs from Redis list
- Calls LLM/STT API with retry/backoff (arq handles internally, max 3 retries)
- Writes results directly to PostgreSQL (shared-DB):
  - UPDATE `submissions` set status/score/band/gradingMode
  - UPDATE `submission_details` set result/feedback
- No callback queue needed — shared-DB eliminates the need

#### 8.3 SSE notification on completion
- Main App polls or uses Redis pub/sub to detect submission status changes
- Broadcast SSE event to connected clients when grading completes

#### 8.4 Worker failure handling
- arq handles retry internally (max 3 retries, exponential backoff)
- After max retries exhausted: submission status set to `failed`
- No DLQ — failed jobs logged by arq, admin can query `submissions WHERE status = 'failed'`

### Dependencies
- Phase 2 (submission lifecycle)
- Phase 7 (SSE broadcasting)

### Acceptance criteria
- Grading job enqueued in Redis when writing/speaking submission created
- arq worker processes job and writes result to PostgreSQL
- Submission status updates to completed/failed after grading
- SSE notification sent on completion

---

## Phase 9: Human Review Workflow

**Mục tiêu**: Instructor review cho submissions confidence thấp.

**Spec refs**: `review-workflow.md`, `hybrid-grading.md`, `api-endpoints.md` §2.8

### Deliverables

#### 9.1 Review queue endpoint
```
GET /api/admin/submissions/pending-review
```
- Filter: `status = 'review_pending'`
- Sort: `reviewPriority` (high > medium > low), then FIFO
- Pagination
- Include: submission info + AI result + question

#### 9.2 Claim mechanism
```
POST /api/admin/submissions/:id/claim
```
- Redis distributed lock: `lock:review:{submissionId}` TTL 15 min
- Nếu đã claimed → 409 CONFLICT với thông tin instructor đang claim
- Set `submissions.reviewerId` = current instructor

#### 9.3 Release mechanism
```
POST /api/admin/submissions/:id/release
```
- Delete Redis lock
- Clear `submissions.reviewerId`

#### 9.4 Submit review
```
PUT /api/admin/submissions/:id/review
```
Body: `{ overallScore, band, criteriaScores?, feedback?, reviewComment? }`

**Merge rules** (từ `hybrid-grading.md`):
- `scoreDiff = abs(ai.overallScore - human.overallScore)`
- `bandStepDiff = abs(bandIndex(ai.band) - bandIndex(human.band))`
- Nếu `scoreDiff <= 0.5` AND `bandStepDiff <= 1`:
  - `final.overallScore = ai*0.4 + human*0.6`
  - `gradingMode = hybrid`
- Ngược lại:
  - `final = human` (override)
  - `gradingMode = human`, `auditFlag = true`

Update:
- Lưu AI result + human result + final result vào `submissionDetails.result`
- Set `submission.status = 'completed'`
- Ghi `submissionEvents` (kind = `reviewed`)
- Release Redis lock
- Broadcast SSE `completed` event
- Trigger progress recompute

#### 9.5 Audit trail
- `submissionDetails.result` lưu structure: `{ ai: {...}, human: {...}, final: {...} }`
- `submissionEvents` ghi mọi state change

### Dependencies
- Phase 2 (submission state machine)
- Phase 6 (Redis — for claim locks)
- Phase 7 (SSE — for broadcast)

### Acceptance criteria
- Review queue sorted by priority then FIFO
- Claim prevents duplicate review
- Lock auto-expire 15 min
- Merge rules follow agree/override spec
- Audit trail lưu đủ ai/human/final

---

## Phase 10: Reliability & Circuit Breaker

**Mục tiêu**: Circuit breaker cho LLM/STT providers, failed job monitoring.

**Spec refs**: `reliability.md`

### Deliverables

#### 10.1 Circuit breaker (grading worker)
- Store circuit breaker state in Redis
- Open when failure rate > 50% over 20 requests, cooldown 30s, trial 3 requests
- When open: worker skips LLM/STT calls, marks job for retry after cooldown

#### 10.2 Failed job monitoring
- Admin endpoint: `GET /api/admin/submissions?status=failed` — list failed grading jobs
- arq handles retry internally (max 3 retries, exponential backoff)
- After max retries: submission status = `failed`, logged for admin review

#### 10.3 Circuit breaker admin endpoint
- `GET /api/admin/circuit-breaker` — view current state (open/closed/half-open)

### Dependencies
- Phase 8 (Redis queue + grading worker)
- Phase 6 (Redis)

### Acceptance criteria
- Circuit breaker opens at >50% failure rate
- Failed submissions queryable by admin
- arq retry exhaustion results in `failed` status

---

## Phase 11: Exam Scoring & Session Flow

**Mục tiêu**: Exam session chấm điểm đầy đủ 4 skills.

**Spec refs**: `vstep-exam-format.md`, `api-endpoints.md` §2.6

### Deliverables

#### 11.1 Submit exam session (chấm điểm)
```
POST /api/exams/sessions/:id/submit
```
- **Listening/Reading answers**: auto-grade bằng answer_key → tính score per section
- **Writing/Speaking answers**: tạo submissions (status pending) → link qua `examSubmissions` table
- Score per skill:
  - Listening: `correct/total * 10`
  - Reading: `correct/total * 10`
  - Writing: pending (sẽ update khi submission completed)
  - Speaking: pending (sẽ update khi submission completed)

#### 11.2 Score aggregation
- Khi writing/speaking submission COMPLETED → update `examSessions` score per skill
- `overallScore = average(4 skill scores)` — chỉ khi tất cả 4 skills đã có score
- `skillScores` JSON: `{ listening: { score, band }, reading: {...}, ... }`
- Session status: `in_progress` → `completed` khi tất cả scores available

#### 11.3 Auto-save (PUT /api/exams/sessions/:id)
- Update answers JSON (client gửi full snapshot mỗi 30s)
- Không ghi đè nếu session đã submitted

#### 11.4 Exam detail endpoint enhancement
```
GET /api/exams/:id
```
- Return: level, sections (4 skills), question count per section, time limits, blueprint

### Dependencies
- Phase 2 (auto-grading, submission lifecycle)
- Phase 8 (Redis queue — for writing/speaking grading)

### Acceptance criteria
- Submit exam → listening/reading scored instantly
- Writing/speaking submissions created và linked qua examSubmissions
- When all 4 skills completed → overall score calculated
- Auto-save works without overwriting submitted session

---

## Phase 12: Admin & Observability

**Mục tiêu**: Admin tooling và structured logging.

**Spec refs**: `api-endpoints.md` §2.8, `observability.md`

### Deliverables

#### 12.1 Admin endpoints
```
GET  /api/admin/users                      — list users (đã có qua /api/users, unify)
PUT  /api/admin/users/:id/role             — change role
GET  /api/admin/submissions/pending-review  — Phase 9
GET  /api/admin/submissions/stats          — submission distribution, avg grading time
GET  /api/admin/circuit-breaker            — Phase 10
```

#### 12.2 Structured logging
- JSON format: `{ timestamp, level, service, requestId, traceId, userId, submissionId, message, ...extra }`
- Replace current logger với structured output
- Log levels: debug/info/warn/error

#### 12.3 Correlation ID propagation
- `requestId` (HTTP) → inject vào grading job metadata
- Grading worker logs include `requestId` for tracing

#### 12.4 Metrics endpoints (optional)
```
GET /api/admin/metrics
```
- HTTP latency p50/p95
- Error rate
- Active SSE connections
- Review queue size
- Redis queue depth

### Dependencies
- Phase 1 (requestId)
- Phase 8 (queue — for traceId propagation)

### Acceptance criteria
- All logs JSON structured với requestId
- Correlation từ HTTP → Redis queue → grading worker logs
- Admin role required cho tất cả /admin endpoints

---

## Phase 13: Data Retention & Cleanup

**Mục tiêu**: TTL cleanup, data privacy.

**Spec refs**: `data-retention-privacy.md`

### Deliverables

#### 13.1 Refresh token cleanup
- Delete expired + revoked tokens older than 30 days
- Already somewhat handled by rotation, but periodic cleanup prevents table bloat

#### 13.2 User deletion
- Hard delete user (ON DELETE CASCADE removes all related data)
- Revoke all refresh tokens before delete
- `DELETE /api/users/:id` performs hard delete

### Dependencies
- Phase 1

### Acceptance criteria
- Expired refresh tokens cleaned up periodically
- User deletion cascades to all related data

---

## Phase Order & Dependencies

```
Phase 1 (Foundation)
├── Phase 2 (Submission lifecycle) ← Phase 1
│   ├── Phase 4 (Progress engine) ← Phase 2, Phase 3
│   │   └── Phase 5 (Scaffolding) ← Phase 4
│   ├── Phase 7 (SSE) ← Phase 2
│   ├── Phase 8 (Redis queue + arq) ← Phase 2, Phase 7
│   │   ├── Phase 9 (Review) ← Phase 6, Phase 7, Phase 8
│   │   ├── Phase 10 (Reliability) ← Phase 6, Phase 8
│   │   └── Phase 11 (Exam scoring) ← Phase 2, Phase 8
│   └── Phase 12 (Admin) ← Phase 1, Phase 8
├── Phase 3 (Goals) ← Phase 1
├── Phase 6 (Rate limiting) ← Phase 1
└── Phase 13 (Retention) ← Phase 1
```

**Recommended order** (critical path):
```
1 → 2 → 3 → 4 → 5      (core learning features)
    ↓
    6 → 7 → 8 → 9 → 10  (infrastructure + async grading)
              ↓
              11          (exam scoring)
    ↓
    12 → 13               (admin + cleanup)
```

**Parallelizable**:
- Phase 3 (Goals) có thể song song với Phase 2
- Phase 6 (Rate limiting) có thể song song với Phase 2-5
- Phase 13 (Retention) có thể song song với Phase 8-11

---

## Question Content Validation & Search (cross-phase)

Áp dụng dần xuyên suốt phases, không phải phase riêng:

**Phase 2**: Validate submission answer format theo skill
**Phase 5**: Thêm functional indexes cho scaffolding queries:
  - `idx_questions_has_template ON (skill, level) WHERE (content->'scaffolding'->>'template') IS NOT NULL`
  - `idx_questions_has_keywords ON (skill, level) WHERE (content->'scaffolding'->>'keywords') IS NOT NULL`
**Phase 11**: Validate exam question blueprint structure
**Phase 12** (hoặc riêng): Full-text search infrastructure:
  - Thêm `search_vector` (tsvector, generated stored) column vào `questions`
  - Thêm GIN index `idx_questions_search ON questions USING GIN(search_vector)`
  - Custom SQL migration (Drizzle không generate tsvector automatically)

Schema reference: `question-content-schemas.md`

| Skill | Content shape | Answer shape |
|-------|--------------|--------------|
| Writing | `{ taskNumber, prompt, instructions, minWords }` | `{ text, wordCount }` |
| Speaking | `{ partNumber, prompt, preparationSeconds }` | `{ audioUrl, durationSeconds }` |
| Reading | `{ passage, items: [...] }` | `{ questionId: answer }` map |
| Listening | `{ audioUrl, items: [...] }` | `{ questionId: answer }` map |

---

## Cross-references

| Spec file | Phases liên quan |
|-----------|-----------------|
| `api-conventions.md` | 1, all |
| `api-endpoints.md` | 1-12 |
| `errors.md` | 1 |
| `authentication.md` | 1 |
| `submission-lifecycle.md` | 2, 8, 10 |
| ~~`queue-contracts.md`~~ | ~~8~~ (replaced by Redis queue) |
| `sse.md` | 7 |
| `hybrid-grading.md` | 8, 9 |
| `review-workflow.md` | 9 |
| `progress-tracking.md` | 4 |
| `adaptive-scaffolding.md` | 5 |
| `rate-limiting.md` | 6 |
| `reliability.md` | 8, 10 |
| `vstep-exam-format.md` | 11 |
| `question-content-schemas.md` | 2, 11 |
| `database-schema.md` | all |
| `observability.md` | 12 |
| `data-retention-privacy.md` | 13 |
| `deployment.md` | all (Docker, env vars) |
| `idempotency-concurrency.md` | 8, 9 |
