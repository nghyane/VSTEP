# Idempotency & Concurrency

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt quy tắc chống duplicate + xử lý race conditions cho toàn hệ thống (HTTP retries, outbox publish, RabbitMQ at-least-once, callback out-of-order).

## Scope

- HTTP idempotency (Main App).
- AMQP request/callback dedup.
- DB constraints + locking strategy khi update submission state.

## Decisions

### 1) At-least-once is default

- RabbitMQ delivery là at-least-once: duplicate/out-of-order là bình thường.
- Mọi consumer phải idempotent.

### 2) Idempotency keys

- HTTP: `Idempotency-Key` (UUID v4) cho các request tạo side-effect.
- Queue:
  - `requestId` (UUID v4) là idempotency key cho `grading.request`.
  - `eventId` (UUID v4) là dedup key cho từng message `grading.callback`.

### 3) Main App: callback dedup + state transition guard

Baseline tables (xem `../30-data/database-schema.md`):

- `processed_callbacks(event_id PK, request_id, submission_id, processed_at, ...)`
- `submission_events(event_id PK, submission_id, kind, data, ...)`

Update rule khi consume callback:

- Insert `processed_callbacks.event_id` trước hoặc trong cùng transaction để đảm bảo exactly-once effects.
- Update submission bằng “guarded update”:
  - Nếu `deadlineAt < now` và submission đã FAILED(TIMEOUT) → chỉ lưu `is_late=true`, không flip state.
  - Nếu nhận progress sau khi đã terminal (COMPLETED/FAILED) → ignore.

### 4) Grading Service: request dedup

- Persist `grading_jobs` với unique constraint theo `request_id`.
- Nếu nhận duplicate `grading.request`:
  - Nếu đã có final result → publish lại `grading.callback(kind=completed)` (replay).
  - Nếu đang chạy → best-effort publish progress hoặc ignore.

### 5) HTTP idempotency (POST /submissions)

- Persist mapping `(user_id, idempotency_key) -> submission_id`.
- Reuse key với payload khác → 409.

## Contracts

- DB unique constraints (khuyến nghị tối thiểu):
  - MainDB: `processed_callbacks(event_id)` unique
  - GradingDB: `grading_jobs(request_id)` unique
  - MainDB: `submissions(request_id)` unique (chỉ cho writing/speaking)

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Duplicate callback deliveries | Bị chặn bởi `processed_callbacks(event_id)` |
| Out-of-order progress/completed | Completed là authoritative; progress sau completed bị ignore |
| Late completed sau FAILED(TIMEOUT) | Lưu result `is_late=true`, không update progress |

## Acceptance criteria

- Duplicate `grading.request` không tạo duplicate grading job.
- Duplicate `grading.callback` không tạo duplicate submission updates.
- Out-of-order callbacks không làm regression state.
