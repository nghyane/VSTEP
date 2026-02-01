# Queue Contracts (RabbitMQ)

## Purpose

Chốt hợp đồng message giữa Bun Main App và Python Grading Service qua RabbitMQ để 2 bên implement độc lập nhưng không vênh.

## Scope

- RabbitMQ topology: exchange/queues cho `grading.request`, `grading.callback`, `grading.dlq`.
- Message payload encoding: JSON UTF-8.
- Schema + validation rules + versioning.
- Idempotency rule theo `requestId`.

## Decisions

| Item | Decision |
|------|----------|
| Exchange | `vstep.exchange` (direct, durable) |
| Request queue | `grading.request` (durable) |
| Callback queue | `grading.callback` (durable) |
| DLQ | `grading.dlq` (durable) |
| Content type | `application/json; charset=utf-8` |
| Delivery semantics | at-least-once (duplicate possible) |
| Schema versioning | `schemaVersion` integer, bump on breaking change |

## Contracts

### Topology

| Routing key / queue | Producer | Consumer | Notes |
|---------------------|----------|----------|------|
| `grading.request` | Bun | Celery worker | Tạo job chấm |
| `grading.callback` | Python | Bun | Trả kết quả |
| `grading.dlq` | Broker | Manual tooling | Poison payload / max retry |

### Message: `grading.request`

Required fields:

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `schemaVersion` | int | Yes | version of contract |
| `requestId` | string | Yes | UUID v4, idempotency key |
| `submissionId` | string | Yes | MainDB id |
| `userId` | string | Yes | owner |
| `skill` | enum | Yes | `writing`/`speaking` |
| `attempt` | int | Yes | 1-indexed |
| `deadlineAt` | string | Yes | ISO 8601 UTC (SLA-based) |
| `payload` | object | Yes | content to grade |
| `metadata.traceId` | string | Yes | observability |
| `metadata.timestamp` | string | Yes | ISO 8601 UTC |

Payload requirements (baseline):

| Skill | Required payload |
|------|-------------------|
| writing | `text`, `taskType` |
| speaking | `audioUri`, `durationSeconds` |

### Message: `grading.callback`

Required fields:

| Field | Type | Required | Notes |
|-------|------|----------|------|
| `schemaVersion` | int | Yes | version of contract |
| `requestId` | string | Yes | join key |
| `submissionId` | string | Yes | join key |
| `status` | enum | Yes | `completed`/`error` |
| `result` | object | Conditional | required when `completed` |
| `error` | object | Conditional | required when `error` |
| `metadata.traceId` | string | Yes | observability |
| `metadata.completedAt` | string | Yes | ISO 8601 UTC |

Timeout semantics:
- Bun sets `deadlineAt` from business rules (writing 20m, speaking 60m).
- Late-result handling is defined in `docs/capstone/specs/reliability.vi.md`.

### Idempotency

- Producer (Bun) must generate stable `requestId` per attempt.
- Consumer (Python) must dedup by `requestId`:
  - If already `completed`: publish callback with cached result, do not re-grade.
  - If already `processing`: treat as duplicate (ignore/reject).

## Failure modes

| Failure | Expected behavior |
|--------|-------------------|
| Duplicate delivery | handled by idempotency (no double-charge) |
| Poison payload | route to DLQ, mark attempt failed |
| Worker crash mid-task | message redelivered; dedup prevents double grading |
| Callback publish fails | bounded retry + alert; avoid infinite loops |

## Acceptance criteria

- Two services can be deployed independently and still interoperate.
- Schema validation rejects invalid payloads deterministically.
- Duplicate `grading.request` does not create duplicate grading results.

---

*Document version: 1.1 - Last updated: SP26SE145*
