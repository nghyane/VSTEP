# Reliability & Error Handling

## Purpose

Chốt các quy tắc reliability để hệ thống chấm chạy ổn định: không mất job, chống duplicate, có retry/DLQ, và xử lý timeout/late-result nhất quán.

## Reliability Flow (tóm tắt)

- Main App tạo submission và đảm bảo publish `grading.request` là reliable (outbox pattern).
- Grading Service consume request, dedup theo `requestId`, xử lý và phát callback `grading.callback` (progress + final).
- Main App consume callback, dedup theo `eventId`, cập nhật submission và ghi event log.
- Retry/backoff có giới hạn; quá giới hạn hoặc non-retryable → DLQ.
- Timeout SLA chỉ áp dụng cho pha AI (xem `../20-domain/submission-lifecycle.md`).

```mermaid
flowchart TB
  A[Create submission] --> B[Outbox entry]
  B --> C[Relay publish grading.request]
  C --> D[(RabbitMQ)]
  D --> E[Consume request]
  E --> F{Dedup requestId}
  F -->|new| G[Grade + retry/backoff]
  F -->|dup| H[Return cached result/best-effort]
  G --> I[Publish grading.callback]
  I --> D
  D --> J[Consume callback]
  J --> K{Dedup eventId}
  K -->|new| L[Update MainDB + append event log + SSE]
  K -->|dup| M[Skip]
  G --> N[DLQ on non-retryable/max retry]
```

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
| Outbox relay | chạy định kỳ; interval/batch configurable |
| Retry | max retries = 3 |
| Backoff | exponential + jitter, cap 300s, honor `Retry-After` for 429 |
| DLQ | `grading.dlq` for non-retryable or max retry |
| SLA | writing 20m, speaking 60m |
| Late callback | keep `FAILED(TIMEOUT)`, store result with `isLate=true` |
| **Soft Timeout State** | `DELAYED` (queue backlog exceeds threshold) |
| Circuit breaker | open when failure rate > 50% over 20 requests, cooldown 30s, trial 3 requests |
| Timeout check | chạy định kỳ; interval configurable |

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
- Relay pulls `pending` theo FIFO (`created_at`).
- Publish sang RabbitMQ và mark `published` khi thành công.
- Nếu publish fail: retry với bounded backoff; không được block các writes mới.
- Monitoring: cảnh báo nếu outbox record bị "kẹt" quá lâu.

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

- Main App computes `deadline = createdAt + SLA(skill)` at attempt creation.
- When `now > deadline` and attempt not `completed`: set `failed` with `failureReason=TIMEOUT`.
- When callback arrives after timeout:
  - Store grading result with `isLate=true` (audit).
  - Do not change attempt status.
  - Do not update progress/analytics automatically.

### Soft Timeout State (Queue Backpressure)

Khi hệ thống quá tải (hàng đợi RabbitMQ > threshold), thay vì Fail ngay lập tức:

- **Trigger**: Queue depth > 1000 messages hoặc avg wait time > SLA * 0.8.
- **Action**: Set submission status = `DELAYED`.
- **User Notification**: Gửi SSE notification cho learner: "Hệ thống đang bận, kết quả sẽ có muộn hơn dự kiến. Cảm ơn bạn đã kiên nhẫn."
- **Behavior**:
  - Submission vẫn tiếp tục được xử lý khi queue giảm.
  - Không bị mark `FAILED` ngay cả khi vượt SLA.
- **Recovery**: Khi hoàn thành, chuyển `DELAYED` -> `COMPLETED` và thông báo kết quả.

### Timeout Scheduler

Proactive timeout detection via periodic scheduler:

| Parameter | Value | Env Variable |
|-----------|-------|--------------|
| Check interval | 60s | TIMEOUT_CHECK_INTERVAL_MS=60000 |
| Query | `status IN ('pending','queued','processing','error','retrying') AND deadline < NOW()` | - |
| Action | `UPDATE status='failed'` + SSE notification | - |

Implementation options:
- Bun App: `setInterval` (simple, single instance recommended)
- Multiple instances: use Redis lock to prevent duplicate processing
- Production: `pg_cron` for higher reliability

## Circuit breaker behavior

When circuit OPEN:
- Worker does not call LLM/STT API.
- Publish callback with `status=error`, `error.code=CIRCUIT_OPEN`.
- Message is requeued with delay (backoff) for retry after cooldown.

## Failure modes

| Failure | Expected behavior |
|---------|-------------------|
| Outbox relay down | submissions still saved; relay catches up when restarted |
| Duplicate request | grading dedup by `requestId`, no double-charge |
| Provider outage | retry/backoff; then DLQ; circuit breaker prevents cascading |
| Callback lost | bounded retry publish; alert if persist |
| Timeout near-deadline race | deterministic compare using `deadline` and callback received time |
| Circuit breaker open | requests queued with error, retry after cooldown |

## Acceptance criteria

- Kill grading worker mid-job: job is redelivered but does not produce duplicate final result.
- Broker restart: outbox ensures requests are eventually published.
- Provider returns 429: backoff respects Retry-After and stays within cap.
- Timeout happens: attempt becomes `FAILED(TIMEOUT)` and does not flip to COMPLETED after late callback.
- DLQ receives poison message and does not auto-loop.
- Circuit breaker opens at >50% failure, closes after successful trial requests.

---

*Document version: 1.2 - Last updated: SP26SE145*
