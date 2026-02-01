# Deployment Plan

## Purpose

Tài liệu này chốt Docker Compose và environment variable cho local development để team chạy được cả Bun Main App và Python Grading Service cùng lúc.

## Docker Architecture

```mermaid
flowchart TB
    subgraph DockerCompose["Docker Compose Network"]
        subgraph Data["Data Layer"]
            PostgresMain["postgres-main:5432<br/>Main Database"]
            PostgresGrading["postgres-grading:5433<br/>Grading Database"]
            RedisService["redis:6379<br/>Cache + Rate Limit"]
        end

        subgraph MessageQueue["Message Queue"]
            RabbitMQ["rabbitmq:5672<br/>AMQP + Management:15672"]
        end

        subgraph Apps["Applications"]
            BunApp["bun-app:3000<br/>Main API"]
            CeleryWorker["python-celery-worker<br/>Background Workers"]
        end
    end

    subgraph External["External Services"]
        OpenAI["OpenAI API<br/>GPT-4, GPT-4o"]
        STT["STT API<br/>Whisper, Azure"]
    end

    BunApp -->|DATABASE_URL_MAIN| PostgresMain
    BunApp -->|REDIS_URL| RedisService
    BunApp -->|RABBITMQ_URL| RabbitMQ
    BunApp -->|read/write| PostgresMain

    CeleryWorker -->|consume| RabbitMQ
    CeleryWorker -->|DATABASE_URL_GRADING| PostgresGrading
    CeleryWorker -->|OPENAI_API_KEY| OpenAI
    CeleryWorker -->|STT_API_KEY| STT

    RabbitMQ -->|consume| CeleryWorker
    RabbitMQ -->|publish callback| BunApp

    classDef data fill:#37474f,stroke:#263238,color:#fff
    classDef queue fill:#ff8f00,stroke:#ff6f00,color:#fff
    classDef app fill:#e65100,stroke:#bf360c,color:#fff
    classDef external fill:#1976d2,stroke:#0d47a1,color:#fff

    class PostgresMain,PostgresGrading,RedisService data
    class RabbitMQ queue
    class BunApp,CeleryWorker app
    class OpenAI,STT external
```

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
| `python-celery-worker` | Celery workers |

Optional (dev): `prometheus`, `grafana`.

### Environment variables (required)

| Variable | Example | Notes |
|----------|---------|------|
| `NODE_ENV` | `development` | |
| `APP_PORT` | `3000` | |
| `DATABASE_URL_MAIN` | `postgresql://vstep:...@postgres-main:5432/vstep_main` | MainDB connection URL |
| `DATABASE_URL_GRADING` | `postgresql://vstep:...@postgres-grading:5432/vstep_grading` | GradingDB connection URL |
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
- Celery Worker: health check via `celery inspect ping` (best-effort).

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
