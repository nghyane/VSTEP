# VSTEP -- Monorepo

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

## Project Structure

```
apps/
  backend/    # Bun + Elysia + Drizzle + PostgreSQL (REST API)
  frontend/   # React 19 + Vite 7 + TypeScript (SPA, skeleton)
  grading/    # Python + FastAPI + Celery + Redis (AI grading microservice, skeleton)
docs/         # Project documentation, specs, design docs
scripts/      # Utility scripts
docker-compose.yml  # Local dev services (PostgreSQL, Redis)
```

## Quick Reference

| App | Language | Run Dev | Run Tests | Lint/Format |
|-----|----------|---------|-----------|-------------|
| backend | TypeScript (Bun) | `bun run dev` | `bun test` | `bun run check` |
| frontend | TypeScript (Vite) | `bun run dev` | -- | -- |
| grading | Python (FastAPI) | `uvicorn app.main:app --reload` | `pytest` | -- |

## Global Rules

- **Bun, not Node** for all TypeScript apps. `bun run`, `bun install`, `bun test`.
- **No dotenv** -- Bun auto-loads `.env`, Vite uses `VITE_*` prefix, Python uses Pydantic Settings.
- **No secrets in code or logs.** Use `.env` files (git-ignored).
- **Structured JSON logging** in all services. Never `console.log` (backend) or `print()` (grading).
- **Throw errors, don't return them.** All apps use typed error hierarchies.
- **YAGNI** -- no speculative code. No consumer = no commit.

## Cross-App Communication

- Frontend calls Backend at `VITE_API_URL` (default `http://localhost:3000`) via REST.
- Backend communicates with Grading service via Celery tasks through Redis.
- Auth: JWT Bearer tokens (issued by backend, validated on each request).
- Shared types: Backend is source of truth. Frontend will sync via `bun run sync-types` (planned).
