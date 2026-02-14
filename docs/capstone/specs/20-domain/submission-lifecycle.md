# Submission Lifecycle

> **Version**: 2.0 · SP26SE145

## 1. Overview

A submission tracks a learner's answer from creation to final score. Listening/Reading are auto-graded synchronously. Writing/Speaking are dispatched to a Python grading worker via Redis and graded asynchronously by Gemini.

---

## 2. State Machine (5 states)

```
                         ┌─────────────────────────────────────────┐
                         │           validation error              │
                         v                                         │
                    ┌─────────┐                               ┌────┴───┐
  user submits ───>│ PENDING  │                               │ FAILED │
                    └────┬────┘                               └────────┘
                         │                                         ^
          ┌──────────────┼──────────────┐                          │
          │ L/R: auto-grade             │ W/S: LPUSH Redis         │
          │ sync                        │                          │
          v                             v                          │
   ┌───────────┐                 ┌────────────┐   retries          │
   │ COMPLETED │                 │ PROCESSING │   exhausted        │
   └───────────┘                 └──────┬─────┘────────────────────┘
          ^                             │
          │              ┌──────────────┼──────────────┐
          │              │ confidence                   │ confidence
          │              │ high                         │ medium/low
          │              v                              v
          │       ┌───────────┐                ┌────────────────┐
          │       │ COMPLETED │                │ REVIEW_PENDING │
          │       └───────────┘                └───────┬────────┘
          │                                            │
          │                     instructor reviews     │
          └────────────────────────────────────────────┘
```

---

## 3. State Definitions

| State | Owner | Meaning |
|-------|-------|---------|
| `pending` | Backend | Submission created, not yet graded or dispatched |
| `processing` | Worker | Grading in progress (W/S only) |
| `completed` | Backend | Final score available to learner |
| `review_pending` | Backend | AI graded but confidence too low; awaiting instructor |
| `failed` | Backend | Unrecoverable error (validation failure or retries exhausted) |

No `queued`, `error`, or `retrying` states. The arq worker handles retry internally (max 3 attempts with backoff). The backend only observes the final outcome.

---

## 4. Transitions

### 4.1 Listening / Reading (synchronous)

```
pending → completed
```

1. Learner submits answers (map of questionId → selected answer).
2. Backend compares against answer key, computes score via `calculateScore()`.
3. Status set to `completed` in the same request. No Redis, no worker.

### 4.2 Writing / Speaking (asynchronous)

```
pending → processing → completed
pending → processing → review_pending → completed
pending → processing → failed
pending → failed
```

1. Learner submits (text for writing, audio URL for speaking).
2. Backend validates input. On validation error → `failed`.
3. Backend sets status to `processing` and pushes task to Redis list `grading:tasks` via `LPUSH`.
4. Python worker pops task (`BRPOP`), runs AI pipeline (Gemini + grammar model for writing, Whisper + Gemini for speaking).
5. Worker writes result directly to PostgreSQL (`submissions` + `submissionDetails`).
6. Based on AI confidence:
   - **High** → status = `completed`. Learner sees score immediately.
   - **Medium/Low** → status = `review_pending`. Queued for instructor review.
7. If all 3 retries fail → status = `failed`.

### 4.3 Review Resolution

```
review_pending → completed
```

Instructor claims submission, reviews AI result, submits final score. Backend sets status to `completed` with `gradingMode = 'human'`.

---

## 5. Grading by Skill

| Skill | Method | Uses Redis | Grading Pipeline |
|-------|--------|------------|------------------|
| Listening | Auto-grade (answer key comparison) | No | Sync in backend |
| Reading | Auto-grade (answer key comparison) | No | Sync in backend |
| Writing | Gemini (content) + grammar model | Yes | Async via worker |
| Speaking | Whisper (STT) + Gemini (assessment) | Yes | Async via worker |

---

## 6. Submission Content by Skill

**Writing**: text content, word count, task type (email/essay), questionId. Graded on 4 VSTEP criteria: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.

**Speaking**: audio URL, duration, part number (1/2/3), questionId. Pipeline: Whisper transcription → Gemini grading on Fluency, Pronunciation, Content, Vocabulary.

**Listening/Reading**: answer map (`questionId → selectedAnswer`). Backend compares with stored answer key. Score on 0-10 scale with 0.5 steps.

---

## 7. Result Schema

All graded submissions store:

- `overallScore`: 0-10 (0.5 steps)
- `band`: B1 / B2 / C1 (derived via `scoreToBand()`)
- `gradingMode`: `auto` | `human`

Writing/Speaking additionally store in `submissionDetails`:

- `criteriaScores`: per-criterion scores with feedback
- `feedback`: strengths, weaknesses, suggestions
- `confidence`: `high` | `medium` | `low`
- `grammarErrors`: array (writing only)
- `aiScore` + `humanScore`: preserved for audit
- `auditFlag`: true when `|aiScore - humanScore| > 0.5`

---

## 8. Data Lifecycle

Hard delete with `ON DELETE CASCADE`. No soft delete. When a submission is deleted, all related `submissionDetails` rows cascade-delete.

---

## 9. Cross-references

| Topic | Document |
|-------|----------|
| Grading pipeline & confidence | `hybrid-grading.md` |
| Instructor review flow | `review-workflow.md` |
| Redis task contract | `../10-contracts/queue-contracts.md` |
