# Domain Logic

## 1. Submission Lifecycle

### State Machine (5 states)

```
pending → processing → completed
                    → review_pending → completed
                    → failed
pending → failed
```

- **pending**: Created, not yet graded
- **processing**: L/R auto-grading in progress, or W/S dispatched to Redis queue
- **completed**: Final score available
- **review_pending**: AI graded but low/medium confidence → needs instructor review
- **failed**: Grading error after max retries

### Skill Routing

| Skill | Grading Method | Flow |
|-------|---------------|------|
| Listening | Auto-grade (answer key comparison) | Instant → completed |
| Reading | Auto-grade (answer key comparison) | Instant → completed |
| Writing | AI grading via LLM | Redis queue → Grading Worker → completed/review_pending |
| Speaking | STT + AI grading | Redis queue → Grading Worker → completed/review_pending |

### Grading Queue (Redis)

```
Backend: XADD "grading:tasks" { submissionId, questionId, skill, answer, dispatchedAt }
Worker:  XREADGROUP "grading:tasks" → grade via LLM → XADD "grading:results" { submissionId, score, ... }
Backend: consumes "grading:results" → UPDATE submissions/submission_details in PostgreSQL
```

Worker has **no direct DB access**. Results flow back via Redis Streams.
Worker failure: max 3 retries with exponential backoff. After exhaustion → failure marker to results stream.

## 2. Grading Pipeline

### AI Grading (Writing)

1. Worker receives task from Redis Streams (XREADGROUP)
2. Call LLM (primary: configurable OpenAI-compatible, fallback: Cloudflare Workers AI)
3. Parse structured response: criteria scores (`taskFulfillment`, `organization`, `vocabulary`, `grammar`)
4. Calculate overall score (arithmetic mean → snap to nearest 0.5)
5. LLM self-reports confidence: `high` / `medium` / `low`
6. XADD result to `grading:results` stream

### AI Grading (Speaking)

1. Worker receives task from Redis Streams
2. Download audio → Transcribe via Cloudflare Workers AI (default: Deepgram Nova 3)
3. STT results cached in Redis (key: `stt:{sha256}`, TTL: 24h)
4. Grade transcript via LLM (same primary/fallback as Writing)
5. Parse criteria scores (`fluencyOrganization`, `pronunciation`, `vocabulary`, `grammar`)
6. XADD result to `grading:results` stream

### Confidence Routing

| Confidence | Action |
|-----------|--------|
| `high` | → `completed` |
| `medium` | → `review_pending` (priority: medium) |
| `low` | → `review_pending` (priority: high) |

### Human Review

When instructor submits review:
- Final score = human score (snapped to 0.5), `gradingMode = "human"`
- `auditFlag = true` when `abs(ai.score - human.score) > 0.5`
- No weighted/hybrid merge — human review is authoritative

## 3. Progress Tracking

### Sliding Window

Per skill, last 10 completed submissions:
- `windowAvg`: average score
- `windowStdDev`: standard deviation
- Minimum 3 attempts required; else `insufficient_data`

### Trend Classification

`delta = avg(last 3) - avg(previous 3)`

| Condition | Trend |
|-----------|-------|
| `stdDev ≥ 1.5` | inconsistent |
| `delta ≥ +0.5` | improving |
| `delta ≤ -0.5` | declining |
| else | stable |

### Overall Band

- Per-skill band from latest grading result
- `overallBand = min(4 skill bands)`
- Missing data → `low_confidence`

### ETA Heuristic

- Requires goal (targetBand) + ≥6 attempts per skill
- `rate` = weekly change in windowAvg
- `totalETA = max(ETA per skill)` — slowest skill determines

## 4. Adaptive Scaffolding

### Levels

Integer scaffold level (1–5) stored in `user_progress.scaffold_level`.

### Progression Rules

- Level up: `avg > 8.0` AND streak direction `up` AND streak count ≥ 2 → `min(current + 1, 5)`
- Level down: `avg < 5.0` AND streak direction `down` AND streak count ≥ 2 → `max(current - 1, 1)`
- Otherwise: unchanged
- Minimum 3 recent scores required for evaluation; else keep current level

## 5. Real-time Notifications

> **Note:** SSE (Server-Sent Events) for real-time grading status is planned but not yet implemented. Currently, clients poll submission status via `GET /api/submissions/:id`.

## 6. Exam Session Flow

1. Learner starts session → status: `in_progress`
2. Client auto-saves answers every 30s
3. Learner submits → L/R auto-graded instantly, W/S dispatched to queue
4. Session status: `submitted`
5. When all 4 skills scored → `completed`, overall score = avg(4 skills)
6. Timeout without submit → `abandoned`

## 7. Authentication

- Access token: 15 min, HS256 JWT (`sub`, `role`, `iat`, `exp`)
- Refresh token: 7 days, stored as SHA-256 hash
- Max 3 active refresh tokens per user (FIFO)
- Reuse detection: rotated token reused → revoke ALL user tokens
- Password: Argon2id via `Bun.password`

---

*Reflects implemented logic as of March 2026.*
