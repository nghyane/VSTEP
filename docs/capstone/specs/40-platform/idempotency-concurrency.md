# Idempotency & Concurrency

> **Phiên bản**: 2.0 · SP26SE145

## Purpose

Chốt quy tắc chống duplicate + xử lý race conditions cho toàn hệ thống (HTTP retries, review claim/release, grading worker dedup).

## Scope

- HTTP idempotency (Main App).
- Grading worker dedup (arq).
- DB constraints + locking strategy khi update submission state.
- Review claim/release concurrency.

## Decisions

### 1) At-least-once is default

- arq delivery là at-least-once: duplicate/out-of-order là bình thường.
- Grading worker phải idempotent — nếu submission đã completed, skip.

### 2) Idempotency keys

- HTTP: `Idempotency-Key` (UUID v4) cho các request tạo side-effect (optional).
- Grading worker: `submissionId` là natural idempotency key — worker checks submission status before processing.

### 3) State transition guard

Grading worker writes results directly to PostgreSQL. Guard rules:

- Worker checks `submission.status` before writing result:
  - If already `completed` or `failed` → skip (idempotent).
  - If `pending` or `processing` → write result, transition to `completed` or `review_pending`.
- State machine enforced at application layer (`submissionMachine.assertTransition`).

### 4) Review claim/release concurrency

- Redis distributed lock: `lock:review:{submissionId}` TTL 15 min.
- Claim: atomically set lock + update `submissions.claimedBy`.
- Release: delete lock + clear `submissions.claimedBy`.
- If already claimed → 409 CONFLICT with info about current claimer.
- Lock auto-expires after 15 min (prevents stale claims).

### 5) HTTP idempotency (POST /submissions)

- Natural dedup: `(userId, questionId, skill)` combination with `status IN ('pending', 'processing')` prevents duplicate in-flight submissions.
- No dedicated idempotency table needed for capstone scope.

## Contracts

- DB constraints:
  - `submissions.status` enforced by 5-value enum (pending/processing/completed/review_pending/failed)
  - State transitions enforced by `submissionMachine.assertTransition()` in application layer
  - Review lock: Redis key `lock:review:{submissionId}` with TTL

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Duplicate grading job (arq redelivery) | Worker checks submission status; if already completed → skip |
| Out-of-order worker completion | State machine rejects invalid transitions |
| Review claim race condition | Redis SETNX ensures only one claimer wins |
| Worker crash mid-grading | arq redelivers job after timeout; worker re-checks status |

## Acceptance criteria

- Duplicate arq job does not produce duplicate submission updates.
- Review claim is exclusive — second claimer gets 409.
- State machine rejects invalid transitions with 409.
- Stale review locks auto-expire after 15 min.

---

*Document version: 2.0 - Last updated: SP26SE145*
