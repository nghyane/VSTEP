# Technical Specifications Index

Tài liệu kỹ thuật (contract-oriented) cho VSTEP Adaptive Learning System.

Writing rule: specs tập trung vào quyết định, contracts, và business rules; code chi tiết nằm ở codebase.

Template rule (áp dụng cho tất cả specs): Purpose / Scope / Decisions / Contracts / Failure modes / Acceptance criteria.

## Reading Guide (for agents)

- Bắt đầu với: `00-overview/solution-decisions.md`
- Khi map format đề → data model: đọc `20-domain/vstep-exam-format.md` + `30-data/question-content-schemas.md`
- Khi làm HTTP API: đọc `10-contracts/api-conventions.md` + `10-contracts/errors.md`
- Khi làm integration Main App ↔ Grading Service: đọc `10-contracts/queue-contracts.md` + `40-platform/reliability.md`
- Khi làm real-time: đọc `10-contracts/sse.md` + `30-data/database-schema.md`
- Khi làm auth/rate limit: đọc `40-platform/authentication.md` + `40-platform/rate-limiting.md`
- Khi làm business rules: đọc `20-domain/submission-lifecycle.md` + `20-domain/hybrid-grading.md`
- Khi debug duplicate/race: đọc `40-platform/idempotency-concurrency.md`

## Specs Map

### 00-overview

- [solution-decisions.md](./00-overview/solution-decisions.md) - Decisions, scope boundaries, architecture overview

### 10-contracts

- [api-conventions.md](./10-contracts/api-conventions.md) - HTTP conventions (pagination, idempotency, OpenAPI)
- [errors.md](./10-contracts/errors.md) - Error envelope + stable error codes
- [api-endpoints.md](./10-contracts/api-endpoints.md) - REST resource catalog (surface overview)
- [queue-contracts.md](./10-contracts/queue-contracts.md) - RabbitMQ topology + message schemas + idempotency at service boundary
- [sse.md](./10-contracts/sse.md) - SSE events + reconnection/replay semantics

### 20-domain

- [vstep-exam-format.md](./20-domain/vstep-exam-format.md) - VSTEP format mapping → domain model granularity
- [submission-lifecycle.md](./20-domain/submission-lifecycle.md) - Submission state machine + SLA timeout + late callback rule
- [hybrid-grading.md](./20-domain/hybrid-grading.md) - Hybrid grading (AI+Human) + confidence routing
- [review-workflow.md](./20-domain/review-workflow.md) - Human review queue + finalization rules
- [progress-tracking.md](./20-domain/progress-tracking.md) - Progress metrics + learning path rules
- [adaptive-scaffolding.md](./20-domain/adaptive-scaffolding.md) - Scaffolding stages + progression rules

### 30-data

- [database-schema.md](./30-data/database-schema.md) - MainDB/GradingDB/Redis entities + ownership rules
- [question-content-schemas.md](./30-data/question-content-schemas.md) - Canonical JSON schemas for questions/submissions

### 40-platform

- [authentication.md](./40-platform/authentication.md) - JWT access/refresh + rotation + device limits
- [idempotency-concurrency.md](./40-platform/idempotency-concurrency.md) - Dedup + race condition rules (HTTP/AMQP/DB)
- [rate-limiting.md](./40-platform/rate-limiting.md) - Rate limit tiers + Redis keys
- [reliability.md](./40-platform/reliability.md) - Outbox + retry/DLQ + circuit breaker + timeout scheduler

### 50-ops

- [deployment.md](./50-ops/deployment.md) - Docker Compose + env vars + run commands
- [observability.md](./50-ops/observability.md) - Logs/metrics/correlation for async grading
- [data-retention-privacy.md](./50-ops/data-retention-privacy.md) - Retention baselines + privacy rules
- [migrations-backup-dr.md](./50-ops/migrations-backup-dr.md) - Migrations + backup/restore runbook baseline

## Related Documentation

- Flow diagrams (VI): `../diagrams/flow-diagrams.vi.md`
- Flow diagrams (EN): `../diagrams/flow-diagrams.md`
- Reports: `../reports/VI/report1-project-introduction.md`

---

*Document version: 1.5 - Last updated: SP26SE145*
