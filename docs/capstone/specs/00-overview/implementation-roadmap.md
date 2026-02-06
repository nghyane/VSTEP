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
| **Auth** | Login, register, refresh rotation, logout, /me, macros | Max 3 tokens/user, reuse detection, jti claim, device tracking |
| **Users** | Full CRUD, soft-delete, ownership checks | — |
| **Questions** | CRUD, versioning, restore, soft-delete | Content JSONB validation theo question-content-schemas |
| **Submissions** | CRUD, grade, auto-grade (exact match), events table, `real` scores, `vstep_band` enum | State machine enforcement, skill routing (MCQ auto vs queue), deadline, outbox relay, confidence routing |
| **Progress** | Basic CRUD (create/update/list), `real` scores, `vstep_band` targetBand | Sliding window, trend, spider chart, ETA, overall band, update triggers |
| **Exams** | CRUD, sessions, answers, complete, `real` scores, `submitted` status | Score calculation, exam→submission linking, section management |
| **Goals** | Table exists | Toàn bộ API (CRUD) |
| **SSE** | — | Toàn bộ |
| **Queue** | Outbox table exists | Relay worker, RabbitMQ publish/consume, callback consumer |
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
GET /health → { status: "ok", services: { db: "ok", redis: "ok" | "unavailable", rabbitmq: "ok" | "unavailable" } }
```
- Check PostgreSQL connection
- Check Redis (graceful — trả unavailable nếu chưa cài)
- Check RabbitMQ (graceful — trả unavailable nếu chưa cài)

#### 1.3 Error code standardization
- Thêm `TOKEN_EXPIRED` error code (tách khỏi `UNAUTHORIZED`) — spec yêu cầu riêng
- `error.code` field trong response phải là stable string (`VALIDATION_ERROR`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`)
- `requestId` trong mọi error response (spec `errors.md`)

#### 1.4 Auth enhancements
- **Max 3 active refresh tokens per user**: Khi login, count active tokens; nếu >= 3, revoke cũ nhất (FIFO)
- **Reuse detection**: Khi refresh token đã bị rotate mà vẫn dùng lại → revoke **toàn bộ tokens của user** (token family revoke)
- **jti claim** trong access token (spec yêu cầu: `sub`, `role`, `jti`, `iat`, `exp`)

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
- **Writing/Speaking**: tạo submission `pending` → ghi outbox entry → return submission + deadline + SSE URL

#### 2.2 Auto-grade listening/reading
- Lookup `questions.answerKey` cho questionId
- So sánh answer với answerKey
- Tính `accuracy%` → map sang `score 0-10` (configurable mapping, monotone increasing)
- Band derivation từ score
- Set status = `completed`, ghi result vào `submissionDetails`
- Ghi `submissionEvents` record (kind = `completed`)

#### 2.3 Deadline computation
- `deadline = createdAt + SLA(skill)`
  - Writing: 20 phút
  - Speaking: 60 phút
  - Listening/Reading: N/A (instant)
- Lưu vào `submissions.deadline` khi tạo writing/speaking submission

#### 2.4 State machine enforcement
- Service method `transitionStatus(submissionId, fromStatus, toStatus)` với allowed transitions:
  ```
  pending → queued
  queued → processing
  processing → completed | review_pending | error
  review_pending → completed
  error → retrying
  retrying → processing
  pending|queued|processing|error|retrying → failed
  ```
- Reject invalid transitions with 409 CONFLICT

#### 2.5 Outbox entry creation
- Khi tạo writing/speaking submission, **trong cùng transaction**:
  1. INSERT submission (status = pending)
  2. INSERT submissionDetails
  3. INSERT outbox (messageType = `grading.request`, payload = queue contract)
- Outbox payload theo `queue-contracts.md`:
  ```json
  { "requestId": "...", "submissionId": "...", "skill": "writing", "answer": {...}, "questionId": "...", "deadline": "..." }
  ```

#### 2.6 GET /api/submissions/:id/status
- Polling fallback endpoint (khi SSE không khả dụng)
- Return: `{ status, progress (nếu processing), result (nếu completed) }`

### Dependencies
- Phase 1 (API prefix, requestId)

### Acceptance criteria
- POST submission listening/reading → instant completed + score + result
- POST submission writing → pending + outbox entry created + deadline set
- Invalid status transitions bị reject
- Outbox entry created atomically với submission

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
- Per skill: query 10 attempts gần nhất (`status = completed`, không `is_late`)
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
- Add `@elysiajs/redis` hoặc `ioredis` dependency
- Redis connection config từ `REDIS_URL` env var
- Graceful fallback nếu Redis unavailable (log warning, skip rate limiting)

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

#### 7.1 SSE endpoint
```
GET /api/sse/submissions/:id?token=<jwt>
```
- Auth via query param `token` (JWT access token)
- Verify ownership (submission.userId === token.sub)
- Return `text/event-stream` response

#### 7.2 Event types
```
event: progress
data: { "step": "transcribing", "percent": 30 }

event: completed
data: { "score": 7.5, "band": "B2" }

event: review_pending
data: { "message": "Đang chờ chấm thủ công" }

event: failed
data: { "reason": "TIMEOUT" }

event: ping
data: { "ts": 1234567890 }
```

#### 7.3 Last-Event-ID replay
- Client gửi `Last-Event-ID` header khi reconnect
- Server replay missed events từ `submissionEvents` table

#### 7.4 Heartbeat
- Gửi `ping` event mỗi 30 giây
- Close stream khi submission ở terminal state (completed/failed) + 5s grace

#### 7.5 SSE manager
- In-memory Map: `submissionId → Set<WritableStream>`
- Method `broadcast(submissionId, event)` — gọi khi cập nhật submission status
- Cleanup on disconnect

### Dependencies
- Phase 2 (submission status tracking)

### Acceptance criteria
- SSE stream nhận events khi submission status thay đổi
- Last-Event-ID replay hoạt động
- Heartbeat mỗi 30s
- Stream close sau terminal state
- Chỉ owner xem được stream

---

## Phase 8: RabbitMQ Integration

**Mục tiêu**: Reliable async grading pipeline.

**Spec refs**: `queue-contracts.md`, `reliability.md`

### Deliverables

#### 8.1 RabbitMQ connection
- `amqplib` dependency
- Connection từ `RABBITMQ_URL` env var
- Graceful retry on connection failure

#### 8.2 Queue topology setup
```
Exchange: vstep.exchange (topic)
Queues:
  - grading.request (binding: grading.request)
  - grading.callback (binding: grading.callback)
  - grading.dlq (binding: grading.dlq)
```
- `assertExchange` + `assertQueue` + `bindQueue` on startup

#### 8.3 Outbox relay worker
- `setInterval` (configurable, default 1s)
- Query: `SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at LIMIT 10`
- For each: publish to `vstep.exchange` with routing key `grading.request`
- On success: mark `status = 'published'`, set `sent_at`
- On failure: increment `attempts`, set `error_message`; if attempts >= 5 → `status = 'failed'`
- Lock mechanism: `locked_at + locked_by` to prevent duplicate relay in multi-instance

#### 8.4 Callback consumer
- Consume from `grading.callback` queue
- Dedup by `eventId` → check `processedCallbacks` table
- Parse callback `kind`:
  - **progress**: update submission events, broadcast SSE
  - **completed**: update submission status + result, broadcast SSE, trigger progress recompute
  - **error**: update submission status, retry logic

#### 8.5 Late callback handling
- Nếu submission đã `failed` (timeout) khi callback đến:
  - Store result với `is_late = true`
  - Giữ nguyên status `failed`
  - Không tính vào progress

#### 8.6 Idempotency
- `processedCallbacks.eventId` (UNIQUE) — dedup callbacks
- `outbox` relay — check `status != 'published'` trước khi publish
- `submissions.requestId` — dedup grading requests

### Dependencies
- Phase 2 (outbox entries, submission lifecycle)
- Phase 7 (SSE broadcasting — nếu muốn push realtime)

### Acceptance criteria
- Outbox relay publish tất cả pending entries
- Callback consumer dedup theo eventId
- Late callback stored nhưng không thay đổi FAILED status
- Queue topology tự tạo on startup

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
- Sort: `reviewPriority` (critical > high > medium > low), then FIFO
- Pagination
- Include: submission info + AI result + question + confidence

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

## Phase 10: Timeout & Reliability

**Mục tiêu**: Phát hiện timeout, xử lý DLQ, circuit breaker.

**Spec refs**: `reliability.md`, `submission-lifecycle.md` §4.4

### Deliverables

#### 10.1 Timeout scheduler
- `setInterval` mỗi 60 giây (configurable via `TIMEOUT_CHECK_INTERVAL_MS`)
- Query: `status IN ('pending','queued','processing','error','retrying') AND deadline < NOW()`
- Action: update `status = 'failed'`, log event, broadcast SSE `failed` + reason `TIMEOUT`
- Redis lock nếu multi-instance (`lock:timeout-scheduler`)

#### 10.2 DELAYED state (soft timeout)
- Khi queue depth > threshold (configurable, default 1000):
  - Không fail submission
  - SSE notification: "Hệ thống đang bận, kết quả sẽ có muộn hơn dự kiến"
  - Khi hoàn thành: DELAYED → COMPLETED bình thường

#### 10.3 DLQ monitoring
- Consume `grading.dlq` queue
- Log DLQ entries vào DB hoặc alert
- Admin endpoint: `GET /api/admin/dlq` — list failed jobs

#### 10.4 Circuit breaker state (informational)
- Store circuit breaker state in Redis (cho Grading Service đọc)
- Admin endpoint: `GET /api/admin/circuit-breaker` — xem trạng thái

### Dependencies
- Phase 8 (RabbitMQ)
- Phase 6 (Redis)

### Acceptance criteria
- Submissions quá deadline → FAILED(TIMEOUT)
- Late callback sau timeout → stored is_late, status giữ FAILED
- DLQ entries viewable by admin
- Timeout scheduler chạy đúng interval

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
- Phase 8 (queue — for writing/speaking grading)

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
GET  /api/admin/dlq                        — Phase 10
GET  /api/admin/circuit-breaker            — Phase 10
```

#### 12.2 Structured logging
- JSON format: `{ timestamp, level, service, requestId, traceId, userId, submissionId, message, ...extra }`
- Replace current logger với structured output
- Log levels: debug/info/warn/error

#### 12.3 Correlation ID propagation
- `requestId` (HTTP) → inject vào outbox payload → `traceId` trong queue messages
- Callback consumer: extract `traceId` và attach to processing context
- Logs trong callback processing include `traceId`

#### 12.4 Metrics endpoints (optional)
```
GET /api/admin/metrics
```
- HTTP latency p50/p95
- Error rate
- Outbox backlog count
- Active SSE connections
- Review queue size

### Dependencies
- Phase 1 (requestId)
- Phase 8 (queue — for traceId propagation)

### Acceptance criteria
- All logs JSON structured với requestId
- Correlation từ HTTP → queue → callback logs
- Admin role required cho tất cả /admin endpoints

---

## Phase 13: Data Retention & Cleanup

**Mục tiêu**: TTL cleanup, data privacy.

**Spec refs**: `data-retention-privacy.md`

### Deliverables

#### 13.1 Scheduled cleanup jobs
- `setInterval` hoặc `pg_cron`:
  - `processedCallbacks`: delete WHERE `processedAt < NOW() - 7 days`
  - `submissionEvents`: delete WHERE `occurredAt < NOW() - 7 days`
  - `outbox`: delete WHERE `status = 'published' AND sentAt < NOW() - 3 days`

#### 13.2 Refresh token cleanup
- Delete expired + revoked tokens older than 30 days
- Already somewhat handled by rotation, but periodic cleanup prevents table bloat

#### 13.3 User deletion (anonymization)
- Khi admin soft-delete user:
  - Revoke all refresh tokens
  - Anonymize PII: email → hash, fullName → null
- `DELETE /api/users/:id` đã có soft-delete; thêm anonymization

### Dependencies
- Phase 1

### Acceptance criteria
- Cleanup jobs chạy đúng schedule
- Expired data bị xóa theo retention rules
- User deletion anonymizes PII

---

## Phase Order & Dependencies

```
Phase 1 (Foundation)
├── Phase 2 (Submission lifecycle) ← Phase 1
│   ├── Phase 4 (Progress engine) ← Phase 2, Phase 3
│   │   └── Phase 5 (Scaffolding) ← Phase 4
│   ├── Phase 7 (SSE) ← Phase 2
│   ├── Phase 8 (RabbitMQ) ← Phase 2, Phase 7
│   │   ├── Phase 9 (Review) ← Phase 6, Phase 7, Phase 8
│   │   ├── Phase 10 (Timeout) ← Phase 6, Phase 8
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

## Question Content Validation (cross-phase)

Áp dụng dần xuyên suốt phases, không phải phase riêng:

**Phase 2**: Validate submission answer format theo skill
**Phase 11**: Validate exam question blueprint structure

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
| `queue-contracts.md` | 8 |
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
| `idempotency-concurrency.md` | 8 |
