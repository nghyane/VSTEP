# Queue Contract (Redis)

> **Version**: 2.0 · SP26SE145

## 1. Overview

The backend and Python grading worker communicate through a Redis list. The backend pushes grading tasks; the worker pops them, grades via AI, and writes results directly to the shared PostgreSQL database. No HTTP callbacks, no message broker, no separate grading database.

```
┌──────────┐    LPUSH     ┌─────────────────┐    BRPOP    ┌──────────────┐
│  Backend  │ ──────────> │  grading:tasks  │ ─────────> │ Python Worker │
│  (Bun)    │             │  (Redis list)   │            │  (arq)        │
└──────────┘              └─────────────────┘            └──────┬───────┘
                                                                │
                                                   UPDATE/INSERT│
                                                                v
                                                        ┌──────────────┐
                                                        │  PostgreSQL  │
                                                        │  (shared DB) │
                                                        └──────────────┘
```

**Key design decisions:**
- Shared-DB architecture. Worker writes directly to `submissions` and `submissionDetails`.
- Redis via `import { redis } from "bun"` (Bun built-in client). No ioredis, no RabbitMQ.
- No callback queue, no DLQ, no outbox table, no dedup table.

---

## 2. Queue

| Property | Value |
|----------|-------|
| Queue name | `grading:tasks` |
| Data structure | Redis List (FIFO via LPUSH/BRPOP) |
| Encoding | JSON UTF-8 |
| Delivery | At-most-once per pop (BRPOP is atomic) |

---

## 3. Task Payload

Backend pushes this JSON to `grading:tasks`:

```typescript
type GradingTask = {
  submissionId: string;   // UUID, primary key in submissions table
  questionId: string;     // UUID, reference to questions table
  skill: "writing" | "speaking";
  answer: WritingAnswer | SpeakingAnswer;
  dispatchedAt: string;   // ISO 8601 UTC
};

type WritingAnswer = {
  text: string;
  wordCount: number;
  taskType: "email" | "essay";
};

type SpeakingAnswer = {
  audioUrl: string;
  durationSeconds: number;
  partNumber: 1 | 2 | 3;
};
```

Only Writing and Speaking go through the queue. Listening/Reading are auto-graded synchronously in the backend.

---

## 4. Worker Behavior

The Python worker uses **arq** (async Redis queue framework).

| Setting | Value |
|---------|-------|
| `max_tries` | 3 |
| `job_timeout` | 60s |
| Retry backoff | Exponential (arq default) |

### 4.1 Processing Flow

1. Worker pops task from `grading:tasks` via BRPOP.
2. Runs AI pipeline:
   - **Writing**: Gemini (content rubric) + grammar model → merge results
   - **Speaking**: Whisper (STT) → Gemini (rubric grading) → merge results
3. Writes result to PostgreSQL in a single transaction:
   - `UPDATE submissions SET status, overallScore, band, gradingMode, ...`
   - `INSERT INTO submissionDetails (criteriaScores, feedback, confidence, ...)`
4. Status is set based on confidence:
   - `high` → `completed`
   - `medium` → `review_pending` (priority: medium)
   - `low` → `review_pending` (priority: high)

### 4.2 Failure Handling

- arq retries automatically up to `max_tries=3` with exponential backoff.
- The backend never sees intermediate retries. No `error` or `retrying` states.
- After 3 failures, the worker sets `status = 'failed'` on the submission.
- Worker logs the error details (Gemini timeout, Whisper failure, etc.) for debugging.

---

## 5. Backend Dispatch

When a Writing/Speaking submission is created:

```typescript
// Pseudocode — actual implementation in submission service
await db.update(submissions)
  .set({ status: "processing" })
  .where(eq(submissions.id, submissionId));

await redis.lpush("grading:tasks", JSON.stringify({
  submissionId,
  questionId,
  skill,
  answer,
  dispatchedAt: new Date().toISOString(),
}));
```

Status is set to `processing` before pushing to Redis. If the Redis push fails, the submission remains in `processing` and can be detected by monitoring.

---

## 6. Monitoring

| What | How |
|------|-----|
| Queue depth | `LLEN grading:tasks` |
| Stuck submissions | Query `submissions WHERE status = 'processing' AND updatedAt < now() - interval '5 min'` |
| Worker health | arq worker logs + process monitoring |
| Error rate | Count `submissions WHERE status = 'failed'` over time window |

No dead-letter queue. Failed submissions are visible directly in the database with `status = 'failed'`.

---

## 7. Cross-references

| Topic | Document |
|-------|----------|
| Submission lifecycle & states | `../20-domain/submission-lifecycle.md` |
| Grading pipeline & confidence | `../20-domain/hybrid-grading.md` |
| Review workflow | `../20-domain/review-workflow.md` |
