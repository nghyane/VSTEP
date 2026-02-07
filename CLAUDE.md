# VSTEP Adaptive Learning System

Vietnamese Standardized Test of English Proficiency (VSTEP) exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

## Repository Structure

```
VSTEP/
├── apps/
│   ├── backend/        # Bun + Elysia API server (active development)
│   ├── frontend/       # Bun + Vite + React (placeholder, not implemented)
│   └── grading/        # Python + FastAPI + Celery AI grading (placeholder, not implemented)
├── docs/               # VSTEP exam documentation, capstone specs, sample data
│   ├── 00-overview/    # Exam structure & scoring system
│   ├── 01-format/      # Test format overview
│   ├── 02-writing/     # Writing skills deep-dive
│   ├── 03-reading/     # Reading format & strategies
│   ├── 04-listening/   # Listening format & strategies
│   ├── 05-speaking/    # Speaking format & prompts
│   ├── 06-scoring/     # Band descriptors & rubrics
│   ├── capstone/       # Project specs, diagrams, reports
│   ├── designs/        # UI/UX assets
│   └── sample/         # Sample exam data (JSON fixtures)
└── scripts/            # Build & setup scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun 1.3+ |
| API Framework | Elysia 1.4+ |
| Language | TypeScript 5.9+ (strict mode) |
| Database | PostgreSQL |
| ORM | Drizzle ORM 0.45+ |
| Validation | TypeBox (Elysia native) + Zod (env only) |
| Auth | jose (JWT), Bun.password (Argon2id) |
| Linter/Formatter | Biome 2.3+ |
| Testing | bun:test |

## Development Commands

All commands run from `apps/backend/`:

```bash
bun install              # Install dependencies
bun run dev              # Start dev server with hot reload
bun run check            # Lint with Biome
bun run check --write    # Auto-fix lint issues
bun run format           # Format code
bun test                 # Run tests

bun run db:push          # Push schema to DB (development)
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio GUI
```

## Critical Rules

### Use Bun, Not Node

- `bun run` not `npm run` / `yarn` / `pnpm`
- `bun test` not `jest` / `vitest`
- `bun install` not `npm install`
- `Bun.password` not `bcrypt` / `argon2`
- `jose` not `jsonwebtoken`
- Bun auto-loads `.env` — never use `dotenv`

### Code Quality

- **No `console.log`** — use `logger` from `@common/logger`
- **No unused imports/variables** — Biome enforces this as error
- **No import cycles** — Biome enforces `noImportCycles`
- **No `.js` extensions** in import paths
- **No barrel re-exports** (`export * from`) in schema files
- Always run `bun run check` before considering work complete

### Naming Conventions (Biome-enforced)

- Classes, types, interfaces, enums: `PascalCase`
- Enum members: `PascalCase` or `CONSTANT_CASE`
- Functions, variables: `camelCase`
- Constants: `camelCase` or `CONSTANT_CASE`

### Import Aliases

Use path aliases for cross-module imports (never deep relative paths):

```typescript
import { logger } from "@common/logger";
import { env } from "@common/env";
import { db } from "@db/index";
import { users } from "@db/schema/users";
import { authPlugin } from "@plugins/auth";
import { auth } from "@/modules/auth";
```

| Alias | Maps to |
|-------|---------|
| `@/*` | `./src/*` |
| `@db/*` | `./src/db/*` |
| `@common/*` | `./src/common/*` |
| `@plugins/*` | `./src/plugins/*` |

## Backend Architecture

### Module Pattern

Each feature module under `src/modules/{name}/` follows:

| File | Purpose |
|------|---------|
| `index.ts` | Elysia routes with auth guards and OpenAPI docs |
| `model.ts` | TypeBox request/response schemas (namespace pattern) |
| `service.ts` | Business logic as static methods on a class |

### Modules (6 total)

| Module | Routes Prefix | Key Functionality |
|--------|--------------|-------------------|
| `auth` | `/api/auth` | Login, register, refresh token, logout, current user |
| `users` | `/api/users` | CRUD user management (admin), password changes |
| `questions` | `/api/questions` | Question bank with versioning (instructor+) |
| `submissions` | `/api/submissions` | Submit answers, auto/human grading |
| `exams` | `/api/exams` | Exam sessions, answer tracking, score calculation |
| `progress` | `/api/progress` | Learning analytics, skill scores, trends |

### Application Entry Points

- `src/index.ts` — Exports the Elysia app
- `src/app.ts` — App setup: plugins, CORS, health check, module mounting
- `GET /health` — Health check (PostgreSQL, Redis, RabbitMQ status)
- All feature routes under `/api/` prefix

### Database Schema (13 tables)

Located in `src/db/schema/`:

| File | Tables |
|------|--------|
| `users.ts` | `users`, `refreshTokens` |
| `questions.ts` | `questions`, `questionVersions` |
| `submissions.ts` | `submissions`, `submissionDetails`, `submissionEvents` |
| `exams.ts` | `exams`, `examSessions`, `examAnswers`, `examSubmissions` |
| `progress.ts` | `userProgress`, `userSkillScores`, `userGoals` |
| `outbox.ts` | `outbox`, `processedCallbacks` |

Key patterns:
- Soft deletes via `deletedAt` column with partial indexes
- `createdAt`/`updatedAt` timestamps on all tables
- JSONB columns for flexible content (questions, blueprints)
- 10 PostgreSQL enums for type safety

### Authentication & Authorization

- JWT access tokens (15m) + refresh tokens (7d) with rotation
- Refresh token reuse detection (compromised tokens revoke all)
- Three roles with hierarchy: `learner` < `instructor` < `admin`
- Auth plugin provides `{ auth: true }` and `{ role: "admin" }` macros

### Error Handling

Custom `AppError` hierarchy with structured JSON responses:

```json
{
  "requestId": "uuid-v4",
  "error": { "code": "NOT_FOUND", "message": "User not found" }
}
```

Every request gets a `x-request-id` header for tracing.

### API Response Format

```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

## Key Source Files

| Purpose | Path |
|---------|------|
| App setup | `apps/backend/src/app.ts` |
| Env config | `apps/backend/src/common/env.ts` |
| Logger | `apps/backend/src/common/logger.ts` |
| Shared schemas | `apps/backend/src/common/schemas.ts` |
| Utilities | `apps/backend/src/common/utils.ts` |
| DB client | `apps/backend/src/db/index.ts` |
| DB relations | `apps/backend/src/db/relations.ts` |
| DB helpers | `apps/backend/src/db/helpers.ts` |
| Auth plugin | `apps/backend/src/plugins/auth.ts` |
| Error plugin | `apps/backend/src/plugins/error.ts` |
| Biome config | `apps/backend/biome.json` |
| TS config | `apps/backend/tsconfig.json` |
| Drizzle config | `apps/backend/drizzle.config.ts` |

## Existing Utilities (Use, Don't Recreate)

| Utility | Import | Purpose |
|---------|--------|---------|
| `logger` | `@common/logger` | Structured logging (never use `console.log`) |
| `env` | `@common/env` | Type-safe env vars via `@t3-oss/env-core` |
| `db` | `@db/index` | Drizzle PostgreSQL client |
| `authPlugin` | `@plugins/auth` | JWT auth + role-based access macros |
| `errorPlugin` | `@/plugins/error` | Error handling + request ID tracing |
| `pagination()` | `@db/helpers` | Pagination with limit/offset + meta builder |
| `notDeleted()` | `@db/helpers` | Soft-delete filter for queries |
| `now()` | `@common/utils` | Current timestamp helper |
| `assertExists()` | `@common/utils` | Throws NotFoundError if null |
| `assertAccess()` | `@common/utils` | Throws ForbiddenError on ownership mismatch |
| `escapeLike()` | `@common/utils` | Escape LIKE wildcards for search queries |
| `Bun.password` | Built-in | Argon2id password hashing/verification |

## Testing

Tests use `bun:test`. Place test files alongside source as `*.test.ts` or in `__tests__/` directories.

```typescript
import { describe, test, expect } from "bun:test";

describe("feature", () => {
  test("should work", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Current coverage is minimal — only `src/plugins/__tests__/auth-final.test.ts` exists (~30 test cases).

## Environment Setup

Copy `apps/backend/.env.example` to `.env` and configure:

```
DATABASE_URL=postgres://user:password@localhost:5432/vstep
PORT=3000
NODE_ENV=development
JWT_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=<optional>
RABBITMQ_URL=<optional>
```

Bun auto-loads `.env` files — no dotenv needed.

## Verification Checklist

Before completing any task:

- [ ] `bun run check` passes (no lint errors)
- [ ] `bun test` passes (no test failures)
- [ ] No `console.log` statements (use `logger`)
- [ ] Cross-module imports use aliases (`@common`, `@db`, `@plugins`, `@/`)
- [ ] No `.js` extensions in imports
- [ ] No unused imports or variables
- [ ] New schemas follow the namespace pattern in `model.ts`
- [ ] New routes have OpenAPI `detail` tags and response schemas
