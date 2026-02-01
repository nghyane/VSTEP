# Reliability & Error Handling

## Purpose

Chốt các quy tắc reliability để hệ thống chấm (Bun <-> RabbitMQ <-> Python/Celery) chạy ổn định: không mất job, chống duplicate, có retry/DLQ, và xử lý timeout/late-result nhất quán.

## Scope

- Outbox pattern ở MainDB (publish `grading.request` reliable).
- Retry/backoff policy ở grading worker.
- DLQ policy và manual recovery.
- Timeout + late callback rule (business rule).
- Circuit breaker note cho LLM/STT.

## Decisions

| Area | Decision |
|------|----------|
| Delivery | at-least-once (duplicate possible) |
| Publish reliability | Outbox + relay worker (Main App side) |
| Retry | `max_retries = 3` (Celery) |
| Backoff | exponential + jitter, cap 300s, honor `Retry-After` for 429 |
| DLQ | `grading.dlq` for non-retryable or max retry |
| SLA | writing 20m, speaking 60m |
| Late callback | keep `FAILED(TIMEOUT)`, store result with `isLate=true` |
| Circuit breaker | open when failure rate > 50%, cooldown 30s |

## Contracts

### Outbox (MainDB) requirements

Outbox record can be stored in MainDB with minimum fields:

| Field | Purpose |
|------|---------|
| `id` | identifier |
| `aggregate_id` | `submissionId` |
| `message_type` | `grading.request` |
| `payload` | JSON body |
| `status` | `pending` -> `published` / `failed` |
| `created_at` / `processed_at` | FIFO + audit |
| `retry_count` / `error_message` | relay retry + debug |

Relay behavior:
- Relay pulls `pending` by `created_at`.
- Publish to RabbitMQ.
- Mark `published` on success.
- On publish fail: retry with bounded backoff; do not block new writes.

### Retry classification

| Failure type | Retry? | Notes |
|--------------|--------|------|
| 429 / 5xx from provider | Yes | honor `Retry-After` if present |
| Network timeout | Yes | bounded retries |
| Worker lost / crash | Yes | message redelivery may occur |
| Invalid schema | No | DLQ immediately |
| Audio decode error | No | DLQ + mark attempt failed |

### DLQ payload requirements

DLQ record must retain at least:

| Field | Required |
|------|----------|
| `requestId` | Yes |
| `submissionId` | Yes |
| `failureReason` | Yes |
| `attemptsMade` | Yes |
| `lastError` | Yes |
| `timestamp` | Yes |

### Timeout & late-result rule (business)

- Main App computes `deadlineAt = createdAt + SLA(skill)` at attempt creation.
- When `now > deadlineAt` and attempt not `COMPLETED`: set `FAILED` with `failureReason=TIMEOUT`.
- When callback arrives after timeout:
  - Store grading result with `isLate=true` (audit).
  - Do not change attempt status.
  - Do not update progress/analytics automatically.

## Failure modes

| Failure | Expected behavior |
|--------|-------------------|
| Outbox relay down | submissions still saved; relay catches up when restarted |
| Duplicate request | grading dedup by `requestId`, no double-charge |
| Provider outage | retry/backoff; then DLQ |
| Callback lost | bounded retry publish; alert if persist |
| Timeout near-deadline race | deterministic compare using `deadlineAt` and callback received time |

## Acceptance criteria

- Kill grading worker mid-job: job is redelivered but does not produce duplicate final result.
- Broker restart: outbox ensures requests are eventually published.
- Provider returns 429: backoff respects Retry-After and stays within cap.
- Timeout happens: attempt becomes `FAILED(TIMEOUT)` and does not flip to COMPLETED after late callback.
- DLQ receives poison message and does not auto-loop.

---

*Document version: 1.1 - Last updated: SP26SE145*
