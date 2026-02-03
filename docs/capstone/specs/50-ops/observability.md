# Observability

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt tối thiểu về logging/metrics để debug nhanh (đặc biệt với async grading qua queue).

## Scope

- Main App (Bun/Elysia)
- Grading Service (Python/Celery)
- RabbitMQ/Postgres/Redis monitoring signals

## Decisions

### 1) Structured logs (JSON)

Fields tối thiểu (mỗi log line):

- `timestamp`, `level`, `service`, `message`
- `requestId` (HTTP), `traceId` (distributed)
- `userId`, `submissionId`, `gradingRequestId` (=`requestId` trong queue contract), `eventId`

### 2) Correlation propagation

- HTTP `X-Request-Id` → được map vào `trace.traceId` trong message envelope của `grading.request`.
- `grading.callback` phải giữ nguyên `trace.traceId`.

### 3) Metrics (minimum)

- HTTP latency (p50/p95), error rate theo `error.code`.
- Outbox backlog: số bản ghi `pending`, age max.
- Queue lag: số message pending ở `grading.request`/`grading.callback`.
- Grading latency: `createdAt` → `completedAt`.
- Retry rate + DLQ count.
- SSE: số connections mở, reconnect rate.
- Review queue backlog: count `REVIEW_REQUIRED`.

## Contracts

- Mỗi request/queue message có thể trace end-to-end bằng `traceId`.

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Không có traceId | Debug async rất khó; coi như bug |
| Outbox backlog tăng | Alert + investigate RabbitMQ connectivity |

## Acceptance criteria

- Từ một `submissionId` có thể tìm ra full trace qua logs (HTTP → request → callback → DB update).
- Có dashboard tối thiểu cho backlog/latency/errors.
