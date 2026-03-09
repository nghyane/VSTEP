# System Architecture

## Overview

```
Client (Web/Mobile) → Backend API (Bun + Elysia) → PostgreSQL
                                                  → Redis (queue + cache)
                                                  → MinIO (S3 object storage)
                    → Grading Worker (Python)      → Redis Streams (XREADGROUP consumer)
                                                  → LLM (Cloudflare Workers AI + OpenAI-compatible)
                                                  → STT (Cloudflare Workers AI)
```

Worker kết quả push ngược về Redis stream `grading:results`, backend đọc và ghi PostgreSQL. Worker không truy cập DB trực tiếp.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Bun | JS/TS runtime cho backend |
| **Framework** | Elysia | Type-safe REST API + OpenAPI |
| **ORM** | Drizzle ORM | SQL query builder, schema-first migrations |
| **Auth** | Jose + Bun.password | JWT (HS256) + Argon2id |
| **Database** | PostgreSQL 17 | Single shared database, JSONB |
| **Queue** | Redis 7.2+ (Streams) | XADD/XREADGROUP task queue, distributed locks, pub/sub |
| **Storage** | MinIO (S3-compatible) | Audio files (Speaking), uploads |
| **Grading** | Python + FastAPI + httpx + Cloudflare SDK | AI grading microservice |
| **LLM** | Cloudflare Workers AI + OpenAI-compatible | Primary: configurable (default GPT-4o), Fallback: Cloudflare Llama 3.3 70B |
| **STT** | Cloudflare Workers AI | Default: Deepgram Nova 3, cached in Redis (24h TTL) |
| **Frontend** | React 19 + Vite 7 + TanStack Router | SPA |
| **Mobile** | React Native | Android-first |
| **Linting** | Biome | Format + lint |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delete strategy | Hard delete + `ON DELETE CASCADE` | No soft delete, no `deleted_at` |
| Grading pipeline | Redis Streams (worker → results stream → backend writes DB) | Worker has no DB access |
| Task queue | Redis Streams XADD/XREADGROUP (not RabbitMQ) | Consumer groups, automatic ack, retry |
| Submission states | 5-state: pending → processing → completed/review_pending/failed | Worker handles retry internally |
| Score type | `numeric(3,1)` → 0.0–10.0, step 0.5 | Exact decimal for academic scores |
| Password hashing | Argon2id via `Bun.password` | Built-in, more secure than bcrypt |
| SSE | Planned (not yet implemented) | Real-time grading notifications |

## Deployment

### Docker Compose (local dev)

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL | postgres:17-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |
| MinIO | minio/minio | 9000 (API), 9001 (Console) |

### Application Servers

| Service | Command | Port |
|---------|---------|------|
| Backend | `bun run dev` | 3001 |
| Frontend | `bun run dev` | 5173 |
| Grading Worker | `python -m app.worker` | — (Redis Streams consumer) |
| Grading API | `uvicorn app.main:app` | 8000 |

### Required Environment Variables

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://vstep:password@localhost:5432/vstep` |
| `REDIS_URL` | `redis://localhost:6379` |
| `S3_ENDPOINT` | `http://localhost:9000` |
| `S3_BUCKET` | `vstep` |
| `S3_ACCESS_KEY` | (MinIO access key) |
| `S3_SECRET_KEY` | (MinIO secret key) |
| `JWT_ACCESS_SECRET` | (random string) |
| `JWT_REFRESH_SECRET` | (random string) |

---

*Reflects implemented system as of March 2026.*
