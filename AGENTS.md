# VSTEP -- Monorepo

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

## Project Structure

```
apps/
  backend-v2/   # PHP 8.4 · Laravel 13 · PostgreSQL · Redis (REST API + AI Grading Agent)
  frontend/     # React 19 + Vite 7 + TypeScript (SPA)
  mobile/       # Mobile app
  _deprecated/  # Old backend-v1 (Bun+Elysia) and grading-python (FastAPI) — replaced
docs/           # Project documentation, specs, design docs
scripts/        # Utility scripts
docker-compose.yml  # Local dev services (PostgreSQL, Redis)
```

## Quick Reference

| App | Language | Run Dev | Run Tests | Lint/Format |
|-----|----------|---------|-----------|-------------|
| backend-v2 | PHP 8.4 (Laravel 13) | `php artisan serve` | `php artisan test` | `./vendor/bin/pint` |
| frontend | TypeScript (Vite) | `bun run dev` | -- | -- |

## Global Rules

- **No secrets in code or logs.** Use `.env` files (git-ignored).
- **Structured JSON logging** in all services. Use `Log` facade, never `console.log` or `print()`.
- **Throw errors, don't return them.** All apps use typed error hierarchies.
- **YAGNI** -- no speculative code. No consumer = no commit.

## Cross-App Communication

- Frontend calls Backend at `VITE_API_URL` (default `http://localhost:3000`) via REST.
- AI Grading runs inside Laravel Queue Jobs (no separate service). Uses `laravel/ai` SDK with tool calling.
- Speaking pronunciation assessment via Azure Speech API (F0 free tier).
- Audio upload via presigned URL to R2 (S3-compatible storage).
- Auth: JWT Bearer tokens (issued by backend, validated on each request).

## Git Rules

- **Never rebase without asking.** Use `git pull --no-rebase` (merge) by default. Only rebase if explicitly requested.
- **Never force push** (`git push --force` / `--force-with-lease`) without explicit approval.
- **Never `git reset --hard`** or `git checkout -- .`** unless specifically requested.
- Stage only files related to the current change. Do not commit unrelated modified files.

## Memories
- VSTEP project: GitHub issues tạo theo feature, không theo screen. Issue chỉ cần đọc xong biết làm gì, xong khi nào — không cần template cứng. Team 4 người đều dùng AI agent, issue để team communicate chứ không phải prompt cho agent.
