# VSTEP Backend

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- Prefer automation: execute actions without confirmation unless blocked by missing info or safety concerns.
- Use Bun, not Node. `bun run`, `bun test`, `bun install`, `Bun.password`, `jose` — never npm/yarn/jest/vitest/bcrypt/jsonwebtoken/dotenv.
- Bun auto-loads `.env` — never use `dotenv`.
- All commands run from `apps/backend/`.
- `bun run check` must pass before considering work complete.

## Commands

- **Install:** `bun install`
- **Dev server:** `bun run dev`
- **Lint:** `bun run check` (fix: `bun run check --write`)
- **All tests:** `bun test`
- **Single test:** `bun test src/path/to/file.test.ts`
- **DB:** `bun run db:push` | `db:generate` | `db:migrate` | `db:studio`

## Stack

Bun 1.3+ · Elysia 1.4+ · TypeScript 5.9+ (strict) · PostgreSQL · Drizzle ORM 0.45+ · TypeBox + Zod (env only) · jose + Bun.password (Argon2id) · Biome 2.3+ · bun:test

## Architecture

Modules in `src/modules/{name}/` each have `index.ts` (routes), `schema.ts` (TypeBox schemas), `service.ts` (exported functions). DB: PostgreSQL via Drizzle ORM (`src/db/schema/`). Auth: JWT (jose) + Argon2id (`Bun.password`). Plugins: `src/plugins/auth.ts` (guards/role macros), `src/plugins/error.ts` (AppError + request IDs). Config: `src/common/env.ts` (t3-env). Shared scoring: `src/common/scoring.ts`.

## Style

- Imports: aliases `@/*`, `@db/*`, `@common/*`, `@plugins/*` — no `.js` extensions, no barrel re-exports, no import cycles.
- PascalCase types/enums; camelCase functions/vars; CONSTANT_CASE or camelCase constants.
- `logger` from `@common/logger` — never `console.log`.
- Throw `AppError` subclasses — never return error objects.
- TypeBox for schemas; Zod only for env vars.
- No trivial wrappers: inline `new Date().toISOString()`, `.trim().toLowerCase()`, `Math.round()`. Wrapper only when it adds domain logic (validation, throw, orchestration).
- No speculative code. No consumer → no commit (YAGNI).
- When 2+ modules share a business concept, extract to `src/common/` immediately.
- Know your libs before wrapping them.

## Testing

- `bun:test`, files as `*.test.ts` or in `__tests__/`
- Avoid mocks — test actual implementation
- Do not duplicate logic into tests
