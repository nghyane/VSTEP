# Deployment Plan

## Purpose

Tài liệu này chốt Docker Compose và environment variable cho local development để team chạy được cả Bun Main App và Python Grading Service cùng lúc.

## Docker Architecture

- Services: Main App, Grading worker(s), RabbitMQ, MainDB, GradingDB, Redis.
- External dependencies (keys required): LLM provider, STT provider.

## Scope

- Local/dev deployment via Docker Compose.
- Required env vars (no secrets committed).
- Ports and health endpoints requirements.

## Decisions

| Area | Decision |
|------|----------|
| DB | Postgres main + grading split |
| Queue | RabbitMQ (AMQP) |
| Cache/rate limit | Redis |
| Auth | JWT access/refresh |
| Realtime | SSE (Bun) |

## Contracts

### Services (baseline)

| Service | Purpose |
|---------|---------|
| `postgres-main` | MainDB (users, submissions, outbox, progress) |
| `postgres-grading` | GradingDB (jobs, results, diagnostics) |
| `redis` | rate-limiting + cache (required) |
| `rabbitmq` | `grading.request` / `grading.callback` / `grading.dlq` |
| `bun-app` | Main API (Bun + Elysia) |
| `python-celery-worker` | Grading workers |

Optional (dev): `prometheus`, `grafana`.

### Environment variables (required)

| Variable | Example | Notes |
|----------|---------|------|
| `NODE_ENV` | `development` | |
| `APP_PORT` | `3000` | |
| `DATABASE_URL_MAIN` | `postgresql://vstep:...@postgres-main:5432/vstep_main` | MainDB connection URL |
| `DATABASE_URL_GRADING` | `postgresql://vstep:...@postgres-grading:5433/vstep_grading` | GradingDB connection URL |
| `REDIS_URL` | `redis://redis:6379` | cache/rate limit |
| `RABBITMQ_URL` | `amqp://vstep:...@rabbitmq:5672` | broker |
| `OPENAI_API_KEY` | `...` | do not commit |
| `STT_API_KEY` | `...` | do not commit |

App-level settings (backend owns exact keys):
- Auth settings (JWT secrets, TTLs, refresh rotation)
- Business rules knobs (SLA, retry/backoff caps)

Rule: capstone specs define the business rules; app-level docs define config key names and defaults.

### Ports

| Service | Port | Purpose |
|---------|------|---------|
| Bun App | 3000 | Main API |
| PostgreSQL (Main) | 5432 | MainDB |
| PostgreSQL (Grading) | 5433 | GradingDB |
| Redis | 6379 | cache/rate limit |
| RabbitMQ (AMQP) | 5672 | broker |
| RabbitMQ (UI) | 15672 | management |

### Health endpoints

- Bun App: `GET /health` checks Postgres/Redis/RabbitMQ connectivity.
- Grading workers: best-effort liveness check (không bắt buộc trong health gate).

## Failure modes

| Failure | Symptom | Mitigation |
|--------|---------|------------|
| Missing JWT secrets | auth fails | fail-fast on startup |
| RabbitMQ down | cannot grade | health check + restart broker |
| Provider key missing | grading fails | fail-fast or route to DLQ |

## Acceptance criteria

- `docker compose up -d` brings up required services and health endpoints become OK.
- Bun can publish request and consume callback.
- Python worker consumes request and publishes callback.

---

*Document version: 1.2 - Last updated: SP26SE145*
