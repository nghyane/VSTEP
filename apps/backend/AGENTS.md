# AGENTS.md – VSTEP Backend

## Commands (run from `apps/backend/`)
- **Install:** `bun install`
- **Dev server:** `bun run dev`
- **Lint:** `bun run check` (fix: `bun run check --write`)
- **Format:** `bun run format`
- **All tests:** `bun test`
- **Single test:** `bun test src/path/to/file.test.ts`
- **DB:** `bun run db:push` | `db:generate` | `db:migrate` | `db:studio`

## Architecture
Bun + Elysia API. Modules in `src/modules/{name}/` each have `index.ts` (routes), `model.ts` (TypeBox schemas, namespace pattern), `service.ts` (static methods). DB: PostgreSQL via Drizzle ORM (`src/db/schema/`). Auth: JWT (jose) + Argon2id (`Bun.password`). Plugins: `src/plugins/auth.ts` (guards/role macros), `src/plugins/error.ts` (AppError + request IDs). Config: `src/common/env.ts` (t3-env, Bun auto-loads `.env`). Shared utils: `src/common/utils.ts`.

## Code Style
- **Imports:** use aliases `@/*`, `@db/*`, `@common/*`, `@plugins/*` — no `.js` extensions, no barrel re-exports in schemas, no import cycles.
- **Naming:** PascalCase for types/classes/enums; camelCase for functions/vars; camelCase or CONSTANT_CASE for constants.
- **Logging:** use `logger` from `@common/logger` — never `console.log`.
- **Errors:** throw `AppError` subclasses (`NotFoundError`, `ForbiddenError`, etc.); responses are `{ requestId, error: { code, message } }`.
- **Validation:** TypeBox for request/response schemas; Zod only for env vars.
- **Tests:** `bun:test`, files as `*.test.ts` or in `__tests__/`.
- **Before committing:** `bun run check` must pass, no unused imports/vars.
