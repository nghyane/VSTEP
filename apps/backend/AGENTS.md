# VSTEP Backend

**Generated:** 2026-02-09 · **Commit:** 5f44823 · **Branch:** main

## OVERVIEW

VSTEP exam practice API — Bun + Elysia + Drizzle + PostgreSQL. JWT auth with role hierarchy, 6 feature modules, adaptive learning with event sourcing and transactional outbox.

## STRUCTURE

```
src/
├── index.ts          # Server start (env.PORT), exports App type
├── app.ts            # Root: errorPlugin → cors → /health → /api/*
├── common/           # Shared: env, logger, utils, enums, schemas, password
├── db/               # Drizzle client, helpers, relations
│   └── schema/       # 13 tables, 10 enums (see schema/AGENTS.md)
├── modules/          # 6 feature + 1 infra module (see modules/AGENTS.md)
│   ├── auth/         # Login, register, token rotation
│   ├── users/        # Admin CRUD, password changes
│   ├── questions/    # Question bank with versioning + JSONB content
│   ├── submissions/  # Submit answers, grading pipeline
│   ├── exams/        # Exam sessions, answer tracking, scoring
│   ├── progress/     # Adaptive learning, skill scores, streaks
│   └── health/       # Infrastructure check (special — no model/index)
└── plugins/
    ├── auth.ts       # JWT bearer + role macros ({auth:true}, {role:'admin'})
    └── error.ts      # AppError hierarchy + x-request-id tracing
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new module | `src/modules/{name}/` | Copy auth/ pattern: index.ts + model.ts + service.ts |
| Add DB table | `src/db/schema/{name}.ts` | Use `timestampsWithSoftDelete`, register in relations.ts |
| Add enum | `src/db/schema/enums.ts` | Re-export from `@common/enums` for API use |
| Modify auth flow | `src/plugins/auth.ts` | Role hierarchy: learner(1) < instructor(2) < admin(3) |
| Error handling | `src/plugins/error.ts` | Custom AppError subclasses |
| Shared utilities | `src/common/utils.ts` | assertExists, assertAccess, now, escapeLike |
| Pagination | `src/db/helpers.ts` | pagination() → {page, limit, offset, meta(total)} |
| Password hashing | `src/common/password.ts` | Wraps Bun.password (Argon2id) |
| JSONB question types | `src/modules/questions/content-schemas.ts` | Discriminated unions per format |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `app` | Elysia | app.ts | Root app (plugins + routes) |
| `api` | Elysia | app.ts | Sub-app at /api mounting modules |
| `authPlugin` | Plugin | plugins/auth.ts | JWT verify + role macros |
| `errorPlugin` | Plugin | plugins/error.ts | Error handling + request ID |
| `Actor` | Interface | plugins/auth.ts | Authenticated user context (.is() method) |
| `ROLE_LEVEL` | Const | plugins/auth.ts | {learner:1, instructor:2, admin:3} |
| `pagination()` | Function | db/helpers.ts | Offset pagination + meta builder |
| `notDeleted()` | Function | db/helpers.ts | Soft-delete WHERE filter |
| `assertExists()` | Function | common/utils.ts | Throws NotFoundError if null |
| `assertAccess()` | Function | common/utils.ts | Throws ForbiddenError on mismatch |
| `AppError` | Class | plugins/error.ts | Base error (NotFound, Forbidden, Validation, Conflict) |
| `env` | Object | common/env.ts | Zod-validated env (DATABASE_URL, JWT_SECRET, PORT...) |
| `logger` | Object | common/logger.ts | Structured logger (replaces console.log) |
| `db` | DrizzleClient | db/index.ts | `drizzle(env.DATABASE_URL, {schema})` + DbTransaction type |
| `hashPassword()` | Function | common/password.ts | Bun.password.hash (Argon2id) |
| `verifyPassword()` | Function | common/password.ts | Bun.password.verify |

## CONVENTIONS

- **Module route file**: `new Elysia({ name: 'module:{name}', prefix: '/{name}', detail: { tags: [...] } })`
- **Services**: Plain exported functions, never classes
- **Model schemas**: TypeBox (`t.Object(...)`) direct exports, not namespaces
- **Soft deletes everywhere**: `deletedAt` + `notDeleted()` filter, never hard delete
- **Path aliases**: `@/*` → src/, `@db/*` → src/db/, `@common/*` → src/common/, `@plugins/*` → src/plugins/
- **Biome strict**: noNonNullAssertion, noUnusedImports, noConsole, noImportCycles, useNamingConvention (all errors)
- **TS strict**: `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `allowImportingTsExtensions`
- **1 biome-ignore allowed**: submissions/service.ts:50 (DB enum snake_case justified)
- **Schema re-export**: db/schema/index.ts re-exports all — intentional exception to no-barrel rule

## ANTI-PATTERNS

| Forbidden | Use Instead |
|-----------|-------------|
| `console.log` | `logger` from `@common/logger` |
| `bcrypt`, `argon2` packages | `Bun.password` (via `@common/password`) |
| `jsonwebtoken` | `jose` |
| `dotenv` | Bun auto-loads `.env` |
| `pg`, `postgres.js` | `Bun.sql` (via Drizzle) |
| `jest`, `vitest` | `bun:test` |
| `as any`, `@ts-ignore` | Fix the types |
| `.js` in imports | TypeScript only, no extensions |
| Deep relative imports | Use `@common/`, `@db/`, `@plugins/`, `@/` aliases |
| Zod for API validation | TypeBox (`t.Object(...)`) — Zod only for env config |
| Class-based services | Plain exported functions |

## COMMANDS

```bash
bun run dev              # Hot-reload server
bun run check            # Biome lint (42 files, 0 errors)
bun run check --write    # Auto-fix lint
bun run format           # Biome format
bun test                 # bun:test (no tests yet)
bun run db:push          # Push schema to DB
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Drizzle Studio GUI
```

## NOTES

- **No real CI** — only .github/workflows/opencode.yml (AI trigger)
- **No Docker/Makefile** — dev runs directly via `bun run dev`
- **0 test files** exist despite bun:test setup and biome test overrides
- **health module** breaks pattern: only service.ts, routed directly in app.ts
- **questions module** has extra `content-schemas.ts` for JSONB discriminated unions
- **Token rotation**: refresh tokens use `replacedByJti` chain for reuse detection
- **Outbox pattern**: async events via outbox table (submissionId → aggregateType/messageType/payload)
- **Numeric scores**: `numeric(3,1)` — range 0.0-99.9, band-mapped
