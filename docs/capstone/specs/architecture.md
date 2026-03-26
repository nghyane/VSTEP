# System Architecture

## Overview

```
Client (Web/Mobile) → Backend API (PHP 8.4 + Laravel 13) → PostgreSQL
                                                          → Redis (queue + cache)
                                                          → Cloudflare R2 (S3-compatible storage)
                       ↳ Laravel Queue Jobs (Horizon)     → LLM (OpenAI GPT-5.4 via local proxy)
                                                          → Azure Speech API (pronunciation assessment)
```

AI grading runs inside Laravel queue jobs (no separate microservice). Queue jobs call LLM via `laravel/ai` SDK with tool calling, score against VSTEP rubric (27 criteria across B1/B2/C1), and write results directly to PostgreSQL.

Knowledge graph (57 nodes, 63 edges) drives adaptive learning path recommendations.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | PHP 8.4 | Backend runtime |
| **Framework** | Laravel 13 | REST API, queue management, service container |
| **ORM** | Eloquent | Active Record ORM, migrations |
| **Auth** | php-open-source-saver/jwt-auth | JWT (HS256) + bcrypt |
| **Database** | PostgreSQL 17 | Single shared database, JSONB |
| **Queue** | Laravel Horizon + Redis | Job dispatching, monitoring, retry, concurrency control |
| **Storage** | Cloudflare R2 (S3-compatible) | Audio files (Speaking), uploads via presigned URLs |
| **Grading** | Laravel AI Agent (`laravel/ai` SDK) | AI grading with tool calling, runs in queue jobs |
| **LLM** | OpenAI GPT-5.4 via local proxy | Primary model for grading and feedback generation |
| **STT/Pronunciation** | Azure Speech API (F0 free tier) | Pronunciation assessment for Speaking section |
| **Frontend** | React 19 + Vite 7 + TanStack Router | SPA |
| **Mobile** | React Native | Android-first (planned) |
| **Linting** | Laravel Pint | PHP code style (PSR-12) |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delete strategy | Hard delete + `ON DELETE CASCADE` | No soft delete, no `deleted_at` |
| Grading pipeline | Laravel queue jobs with `laravel/ai` SDK | AI agent with tool calling; direct DB access, no separate service |
| Task queue | Laravel Horizon + Redis (not Redis Streams) | Built-in monitoring, retry, rate limiting via Laravel |
| VSTEP rubric | 27 criteria in DB across B1/B2/C1 levels | Structured scoring, consistent grading |
| Knowledge graph | 57 nodes, 63 edges | Adaptive learning path recommendations |
| Submission states | 5-state: pending → processing → completed/review_pending/failed | Queue job handles retry internally |
| Score type | `numeric(3,1)` → 0.0–10.0, step 0.5 | Exact decimal for academic scores |
| Audio upload | Presigned URL to R2 | Client uploads directly to storage, no backend proxy |
| Speaking assessment | Azure Speech pronunciation API + AI agent | F0 free tier; pronunciation scores feed into AI grading |
| SSE | Planned (not yet implemented) | Real-time grading notifications |

## Deployment

### Docker Compose (local dev)

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL | postgres:17-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |

### Application Servers

| Service | Command | Port |
|---------|---------|------|
| Backend | `php artisan serve` | 8000 |
| Queue Worker | `php artisan horizon` | — (Redis queue consumer) |
| Frontend | `bun run dev` | 5173 |

### Required Environment Variables

| Variable | Example |
|----------|---------|
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `vstep` |
| `DB_USERNAME` | `vstep` |
| `DB_PASSWORD` | (database password) |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |
| `AWS_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `AWS_BUCKET` | `vstep` |
| `AWS_ACCESS_KEY_ID` | (R2 access key) |
| `AWS_SECRET_ACCESS_KEY` | (R2 secret key) |
| `JWT_SECRET` | (random string) |
| `OPENAI_API_BASE` | `http://localhost:...` (local proxy) |
| `OPENAI_API_KEY` | (API key) |
| `AZURE_SPEECH_KEY` | (Azure Speech F0 key) |
| `AZURE_SPEECH_REGION` | `southeastasia` |

---

*Reflects implemented system as of March 2026.*
