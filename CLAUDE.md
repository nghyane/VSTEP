# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSTEP adaptive learning & exam practice platform with AI grading. Capstone project (SP26SE145). Monorepo:

| App | Stack | Port | Entry |
|-----|-------|------|-------|
| **backend-v2** | PHP 8.4 · Laravel 13 · PostgreSQL · Redis | 8000 | `apps/backend-v2/` |
| **frontend** | React 19 + Vite 7 + TypeScript | 5173 | `apps/frontend/` |

## Commands

### Backend (`apps/backend-v2/`)

```bash
php artisan serve             # Start dev server
php artisan test              # Run tests
php artisan horizon           # Queue worker
php artisan migrate           # Run migrations
php artisan db:seed           # Seed database
./vendor/bin/pint             # Lint + format
```

### Frontend (`apps/frontend/`)

```bash
bun install
bun run dev                   # Vite dev server
bun run build                 # tsc + vite build
```

### Infrastructure

```bash
docker compose up -d          # Start PostgreSQL + Redis
```

## Architecture

See `apps/backend-v2/AGENTS.md` for full Laravel conventions.

### AI Grading Agent

Writing/Speaking grading runs inside Laravel Queue Jobs using `laravel/ai` SDK:

1. `GradeSubmission` job dispatched when student submits writing/speaking
2. Job loads rubric (DB) + knowledge scope (graph) + question content
3. Agent (WritingGrader/SpeakingGrader) calls LLM via tool calling (`SubmitWritingGrade`/`SubmitSpeakingGrade`)
4. Speaking: Azure Speech API for pronunciation assessment before agent grading
5. Code calculates overall score (VstepScoring), enriches result with criteria names + knowledge graph paths
6. Submission updated with scores, feedback, knowledge gaps

Key files:
- `app/Ai/Agents/` — WritingGrader, SpeakingGrader (laravel/ai Agent + HasTools)
- `app/Ai/Tools/` — SubmitWritingGrade, SubmitSpeakingGrade (tool calling)
- `app/Jobs/GradeSubmission.php` — Queue job orchestrator
- `app/Services/AzureSpeechService.php` — Azure pronunciation assessment
- `resources/views/grading/` — System prompt blade templates
- `database/seeders/GradingRubricSeeder.php` — VSTEP rubric data (27 criteria)
- `database/seeders/KnowledgeGraphSeeder.php` — Knowledge graph (57 nodes, 63 edges)

### Cross-App Communication

- Frontend → Backend: REST at `VITE_API_URL` (default `http://localhost:3000`)
- AI Grading: Laravel Queue Jobs (Redis), no separate service
- Speaking audio: presigned URL upload to R2 → Azure Speech API → Agent grading
- Auth: JWT Bearer tokens (php-open-source-saver/jwt-auth)

### Database

PostgreSQL with Eloquent ORM. Key tables:
- `grading_rubrics` + `grading_criteria` — VSTEP rubric per skill/level
- `knowledge_points` + `knowledge_point_edges` — Knowledge graph
- `submissions` — Grading results with enriched criteria + knowledge gaps
- See `apps/backend-v2/AGENTS.md` for full model/service conventions.

## Code Style

See `apps/backend-v2/AGENTS.md` for Laravel-specific patterns:
- `declare(strict_types=1)` in all PHP files
- Models extend BaseModel (UUIDs, ISO dates)
- Enums for all fixed values
- Thin controllers, services for business logic
- `./vendor/bin/pint` must pass before commit
