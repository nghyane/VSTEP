# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSTEP adaptive learning & exam practice platform with AI grading. Capstone project (SP26SE145). Monorepo with three apps:

| App | Stack | Port | Entry |
|-----|-------|------|-------|
| **backend** | Bun + Elysia + Drizzle + PostgreSQL | 3000 | `apps/backend/src/index.ts` |
| **frontend** | React 19 + Vite 7 + TypeScript | 5173 | `apps/frontend/` (skeleton) |
| **grading** | Python + FastAPI + LiteLLM + Redis | 8001 | `apps/grading/app/main.py` |

## Commands

### Backend (`apps/backend/`)

```bash
bun install                   # Install deps
bun run dev                   # Start dev server (hot reload)
bun test                      # Run all tests
bun test src/                 # Unit tests only
bun test tests/               # Integration tests only
bun test tests/auth.test.ts   # Single test file
bun run check                 # Biome lint + format check (src, seed, tests)
bun run format                # Auto-format with Biome
bun run db:push               # Push schema to DB (dev mode)
bun run db:generate           # Generate migrations
bun run db:migrate            # Apply migrations
bun run db:studio             # Drizzle Studio web UI
bun run db:seed               # Seed database
```

### Frontend (`apps/frontend/`)

```bash
bun install
bun run dev                   # Vite dev server
bun run build                 # tsc + vite build
bun run sync-types            # Sync types from backend (planned)
```

### Grading (`apps/grading/`)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
pytest                        # Run tests
```

### Infrastructure

```bash
docker compose up -d          # Start PostgreSQL + Redis
```

## Architecture

### Backend Module Structure

Each domain feature follows this pattern in `src/modules/<feature>/`:

- `index.ts` — Elysia route definitions (the router)
- `schema.ts` — TypeBox validation schemas for request/response
- `service.ts` — Business logic and database queries
- Additional files for sub-concerns (e.g., `auto-grade.ts`, `session.ts`)

Modules: `auth`, `users`, `questions`, `submissions`, `exams`, `progress`, `knowledge-points`, `classes`, `health`

### Backend Key Directories

- `src/common/` — Shared: `env.ts` (t3-oss/env-core), `errors.ts` (AppError hierarchy), `logger.ts`, `schemas.ts`, `utils.ts`, `scoring.ts`, `state-machine.ts`
- `src/db/schema/` — Drizzle table definitions (one file per domain: `users.ts`, `questions.ts`, `submissions.ts`, `exams.ts`, `progress.ts`, `classes.ts`, `knowledge-points.ts`)
- `src/db/types/` — Complex JSONB type schemas: `question-content.ts`, `answers.ts`, `exam-blueprint.ts`, `grading.ts`
- `src/plugins/` — Elysia plugins: `error.ts` (global error handler + request ID), `auth.ts` (bearer token validation)
- `seed/` — Ordered seeders (`01-users.ts` through `08-knowledge-points.ts`) with JSON data in `seed/data/`

### Cross-App Communication

- Frontend → Backend: REST at `VITE_API_URL` (default `http://localhost:3000`)
- Backend → Grading: pushes Task JSON to Redis list `grading:tasks`
- Grading → Backend: writes results directly to PostgreSQL (submissions + submission_details)
- Auth: JWT Bearer tokens (HS256), refresh token rotation

### Grading Pipeline

The grading service is NOT Celery-based. It runs an async worker inside FastAPI using Redis BRPOP:
1. Worker polls `grading:tasks` Redis list
2. Routes to `writing.py` or `speaking.py` based on `task.skill`
3. Speaking: downloads audio → STT transcription (Groq Whisper) → LLM grading
4. Writing: text → LLM grading (Groq Llama 3.3 70B via LiteLLM)
5. Saves results to PostgreSQL; confidence-based routing: high → completed, medium/low → review_pending
6. Failed tasks go to dead letter queue `grading:dlq`

### Error Handling (Backend)

`AppError` subclasses: `BadRequestError` (400), `UnauthorizedError` (401), `TokenExpiredError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409). Always throw, never return errors.

### Database

PostgreSQL with Drizzle ORM. Enums: `skill` (listening/reading/writing/speaking), `question_level` (A2/B1/B2/C1), `vstep_band`, `user_role` (learner/instructor/admin), `submission_status`, `grading_mode`. JSONB fields for flexible content (questions, answers, exam blueprints). Currently using `db:push` for development; switch to `generate`+`migrate` when schema stabilizes.

### Testing (Backend)

Integration tests in `tests/` call the app directly via `app.handle()`. Test helpers in `tests/helpers.ts` provide factories: `createTestUser`, `loginTestUser`, `createTestQuestion`, `createTestExam`, `createTestClass`. Cleanup uses FK cascades. Unit tests live alongside source files (e.g., `scoring.test.ts`).

## Code Style (from CODE_STYLE.md)

**5 Rules:** Early Exit (guard clauses) · Parse Don't Validate (boundary parsing only) · Atomic Predictability · Fail Fast · Intentional Naming

**Function structure:** guard → compute → write. No interleaving.

**Naming:** Module = namespace (no noise words: `grade()` not `gradeSubmission()`). Files: kebab-case (TS), snake_case (Python). Types: PascalCase domain nouns without prefixes.

**Banned:** `any`/`as any`, `console.log`/`print` (use logger), direct env access (use `env.X`/`settings.x`), speculative code, trivial wrappers, generic names (`data`, `info`, `item`).

**Comments:** WHY only. No WHAT comments, no numbered steps, no section dividers.

**Files:** 1 file = 1 concern, split at ~200 lines or 2+ concerns.

## Global Rules

- **Bun, not Node** — `bun run`, `bun install`, `bun test` for all TypeScript apps.
- **No dotenv** — Bun auto-loads `.env`, Vite uses `VITE_*` prefix, Python uses Pydantic Settings.
- **Structured JSON logging** in all services.
- **Biome** for TS linting/formatting. Key rules: `noConsole: error`, `noImportCycles: error`, `useNamingConvention: error`, `noNonNullAssertion: error`.
- Parallel reads (`Promise.all`), atomic writes (transactions).
