# Queue Contracts (RabbitMQ)

> **Phiên bản**: 2 · SP26SE145

## 1. Mục đích

Chốt **hợp đồng message** giữa Bun Main App và Python Grading Service qua RabbitMQ để 2 bên triển khai độc lập nhưng không vênh.

Tài liệu này là **contract-first**: tập trung vào topology, message shapes, idempotency, và failure semantics.

---

## 2. Phạm vi

- Topology: exchange/queues cho `grading.request`, `grading.callback`, `grading.dlq`.
- Encoding: JSON UTF-8.
- Không yêu cầu versioning trong payload (capstone deploy đồng bộ 2 service).
- Delivery semantics: at-least-once (duplicate/out-of-order possible).
- Progress events và final result events trên `grading.callback`.

Không bao gồm: schema DB, SSE endpoint, UI flows.

---

## 3. Topology

| Item | Value |
|------|-------|
| Exchange | `vstep.exchange` (direct, durable) |
| Request queue | `grading.request` (durable) |
| Callback queue | `grading.callback` (durable) |
| DLQ | `grading.dlq` (durable) |
| Content type | `application/json; charset=utf-8` |

Routing keys (direct exchange):

| Routing key | Producer | Consumer | Notes |
|------------|----------|----------|------|
| `grading.request` | Main App | Grading Service | Tạo job chấm |
| `grading.callback` | Grading Service | Main App | Progress + kết quả |
| `grading.dlq` | Broker | Manual tooling | Poison payload / non-retryable / max retry |

---

## 4. Delivery & Ordering Semantics

- **At-least-once**: consumer phải handle duplicate deliveries.
- **Ordering không đảm bảo**: progress events có thể đến muộn/đảo thứ tự.
- **Final event là authoritative**: callback `kind=completed|error` kết thúc job.

---

## 5. Common Message Metadata (Optional)

Khuyến nghị messages có các trường chung sau để debug/trace dễ hơn. Nếu thiếu metadata, consumer vẫn xử lý được miễn payload phần 6/7 hợp lệ.

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `messageType` | string | No | `grading.request` hoặc `grading.callback` |
| `messageId` | string | No | UUID v4, unique per message |
| `createdAt` | string | No | ISO 8601 UTC |
| `trace` | object | No | observability |
| `trace.traceId` | string | No | distributed trace id |
| `producer` | object | No | service identity |
| `producer.service` | string | No | `main-app` / `grading-service` |
| `producer.version` | string | No | semantic version/commit id |

---

## 6. Contract: `grading.request`

### 6.1 Required fields

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `requestId` | string | Yes | UUID v4, idempotency key per submission attempt |
| `submissionId` | string | Yes | MainDB submission id |
| `userId` | string | Yes | owner |
| `skill` | enum | Yes | `writing` / `speaking` |
| `attempt` | int | Yes | 1-indexed |
| `deadlineAt` | string | Yes | ISO 8601 UTC (SLA-based) |
| `payload` | object | Yes | content to grade |

### 6.2 Payload (Writing)

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `text` | string | Yes | bài viết |
| `taskType` | enum | Yes | `email` / `essay` |
| `questionId` | string | Yes | question reference |

### 6.3 Payload (Speaking)

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `audioUrl` | string | Yes | URL tải audio |
| `durationSeconds` | int | Yes | độ dài audio |
| `questionId` | string | Yes | question reference |
| `part` | int | No | speaking part (1/2/3) |

### 6.4 Validation rules

- `requestId` phải ổn định cho cùng submission attempt (resend không đổi).
- `deadlineAt` do Main App tính theo SLA (writing 20m, speaking 60m).
- Nếu payload thiếu fields bắt buộc hoặc type không hợp lệ: Grading Service phải phát `grading.callback(kind=error)` với `error.type=INVALID_INPUT`, `retryable=false`, sau đó message phải vào DLQ.

---

## 7. Contract: `grading.callback`

Callback queue dùng cho **progress updates** và **final result/error**.

### 7.1 Required fields

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `requestId` | string | Yes | join key |
| `submissionId` | string | Yes | join key |
| `eventId` | string | Yes | UUID v4, unique per callback message (dedup key) |
| `kind` | enum | Yes | `progress` / `completed` / `error` |
| `eventAt` | string | Yes | ISO 8601 UTC |
| `data` | object | Yes | payload theo `kind` |

### 7.2 `kind=progress`

`data` tối thiểu:

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `status` | enum | Yes | `PROCESSING` / `ANALYZING` / `GRADING` |
| `progress` | number | No | 0..1 (best-effort) |
| `message` | string | No | text ngắn cho UI |

Progress events **best-effort**: có thể bị drop; client không nên phụ thuộc để quyết định business logic.

### 7.3 `kind=completed`

`data` tối thiểu:

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `result` | object | Yes | AI grading result |
| `result.overallScore` | number | Yes | 0-10 |
| `result.band` | enum | Yes | A1/A2/B1/B2/C1 |
| `result.confidenceScore` | int | Yes | 0-100 |
| `result.reviewRequired` | boolean | Yes | `confidenceScore < 85` |
| `result.reviewPriority` | enum | Conditional | Low/Medium/High/Critical khi reviewRequired=true |
| `result.auditFlag` | boolean | Yes | true nếu 85-89 hoặc có signals |

`kind=completed` nghĩa là **AI grading đã kết thúc** (không đồng nghĩa learner có final result ngay). Main App quyết định:

- `reviewRequired=false` → set submission status `COMPLETED`
- `reviewRequired=true` → set submission status `REVIEW_REQUIRED` và đưa vào hàng chờ instructor

Chi tiết rubric/feedback shape: tham chiếu `../20-domain/hybrid-grading.md`.

### 7.4 `kind=error`

`data` tối thiểu:

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `error` | object | Yes | error details |
| `error.type` | string | Yes | e.g. LLM_TIMEOUT, STT_FAIL, INVALID_INPUT, CIRCUIT_OPEN |
| `error.code` | string | Yes | stable code for client/UI |
| `error.message` | string | Yes | human readable (for logs/admin) |
| `error.retryable` | boolean | Yes | retryable hay không |

---

## 8. Idempotency Requirements

### 8.1 Request dedup (Grading Service)

- Dedup theo `requestId`.
- Nếu nhận duplicate `grading.request`:
  - Nếu đã có final result: publish lại `grading.callback(kind=completed)` với cached result.
  - Nếu đang processing: có thể ignore hoặc publish progress hiện tại (best-effort).

### 8.2 Callback dedup (Main App)

- Dedup theo `eventId` (unique per callback message).
- Final result idempotency theo `requestId`:
  - duplicate completed callbacks không được tạo duplicate result/submission updates.

---

## 9. DLQ Requirements

Message bị route DLQ khi:

- Invalid schema / missing required fields
- Non-retryable processing errors
- Max retries exceeded

DLQ payload phải giữ tối thiểu:

- Original message (hoặc reference)
- `requestId`, `submissionId`
- `failureReason`, `attemptsMade`, `timestamp`, `lastError`

---

## 10. Acceptance Criteria

- Hai service triển khai độc lập vẫn interoperate đúng contract.
- Duplicate `grading.request` không tạo duplicate grading job/final result.
- Callback progress có thể đến nhiều lần và được dedup bằng eventId.
- Callback final (completed/error) là authoritative và có thể replay mà không gây side effects.
