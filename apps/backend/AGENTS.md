# VSTEP Backend

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- Prefer automation: execute actions without confirmation unless blocked by missing info or safety concerns.
- Use Bun, not Node. `bun run`, `bun test`, `bun install`, `Bun.password`, `jose` -- never npm/yarn/jest/vitest/bcrypt/jsonwebtoken/dotenv.
- Bun auto-loads `.env` -- never use `dotenv`.
- All commands run from `apps/backend/`.
- `bun run check` must pass before considering work complete.

## Commands

- **Install:** `bun install`
- **Dev server:** `bun run dev` (hot-reload via `bun --hot`)
- **Lint+format check:** `bun run check` (fix: `bun run check --write`)
- **All tests:** `bun test`
- **Unit tests only:** `bun test src/`
- **Integration tests only:** `bun test tests/`
- **Single test:** `bun test src/path/to/file.test.ts`
- **DB push:** `bun run db:push`
- **DB migrate:** `bun run db:migrate`
- **DB generate:** `bun run db:generate`
- **DB studio:** `bun run db:studio`
- **DB seed:** `bun run db:seed`

## Stack

Bun 1.3+ . Elysia 1.4+ . TypeScript 5.9+ (strict) . PostgreSQL . Drizzle ORM 0.45+ . TypeBox (via `drizzle-typebox`) + Zod (env only) . jose + Bun.password (Argon2id) . Biome 2.3+ . bun:test

## Architecture

```
src/
  app.ts              # Root Elysia app, mounts plugins + modules under /api
  index.ts            # Server entry, exports `app` and `App` type
  common/             # Shared utilities: env, logger, errors, scoring, state-machine, utils, auth-types
  plugins/            # auth.ts (guards/role macros), error.ts (AppError + request IDs)
  modules/{name}/     # index.ts (routes), schema.ts (TypeBox), service.ts (logic)
  db/
    index.ts          # Drizzle client, exports db + table + helpers
    schema/           # Table definitions, enums, helpers, barrel re-export
    relations.ts      # Drizzle relations
    helpers.ts        # paginate(), omitColumns()
    types/            # Shared JSONB type definitions (answers, grading, blueprints)
```

**Modules:** auth, users, questions, submissions, exams, progress, classes, health

**Mount pattern (app.ts):**
```ts
const api = new Elysia({ prefix: "/api" })
  .use(openapi({ ... }))
  .use(auth).use(users).use(submissions)
  .use(questions).use(progress).use(exams).use(classes);
```

## Imports

- **Aliases:** `@/*` = `src/*`, `@db/*` = `src/db/*`, `@common/*` = `src/common/*`, `@plugins/*` = `src/plugins/*`
- No `.js` extensions. No barrel re-exports (exception: `src/db/schema/index.ts`). No import cycles (Biome enforced).
- Example: `import { db, table } from "@db/index"`, `import { logger } from "@common/logger"`

## Naming

- **PascalCase:** types, interfaces, enums, Elysia instances
- **camelCase:** functions, variables, object properties
- **CONSTANT_CASE or camelCase:** constants (both allowed by Biome)
- **Enum members:** PascalCase or CONSTANT_CASE
- DB columns: camelCase in TS, Drizzle auto-maps to snake_case

## Error Handling

- Throw `AppError` subclasses -- never return error objects, never use plain `Error`.
- Subclasses: `BadRequestError` (400), `UnauthorizedError` (401), `TokenExpiredError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409).
- `assertExists(value, "Resource")` returns value or throws NotFoundError.
- `assertAccess(resourceUserId, actor, msg)` checks ownership or admin, throws ForbiddenError.
- Error plugin adds `x-request-id` header (UUID) to every response, logs 5xx with stack traces.

## Route Patterns

```ts
export const moduleName = new Elysia({
  name: "module:name",
  prefix: "/name",
  detail: { tags: ["Name"] },
})
.use(authPlugin)
.post("/path", ({ body, user }) => serviceFunction(body, user), {
  auth: true,              // Any authenticated user
  // role: ROLES.ADMIN,    // Or: requires admin+
  body: RequestSchema,
  response: { 200: ResponseSchema, ...AuthErrors },
  detail: { summary: "...", description: "..." },
});
```

## Service Patterns

- Plain exported `async function`s -- never classes.
- Import `db` and `table` from `@db/index`.
- Wrap multi-step mutations in `db.transaction(async (tx) => { ... })`.
- Use `paginate(qb.$dynamic(), count, opts)` for list endpoints: applies limit/offset, returns `{ data, meta }`.
- Dynamic where clauses: `and(condition1, condition2)` -- `and()` ignores `undefined` args natively.
- Password: `Bun.password.hash(pw, "argon2id")` / `Bun.password.verify(pw, hash)`.
- State transitions: `submissionMachine.assertTransition(from, to)` -- states: pending/processing/completed/review_pending/failed.

## Schema Patterns (TypeBox)

- Import `t` from `"elysia"` (re-exports TypeBox).
- Response schemas first, request schemas below. No namespace wrapping.
- Derive from Drizzle: `createSelectSchema(table)` then `t.Omit(...)` to exclude internal fields.
- Export column subsets: `const { passwordHash: _, ...columns } = getTableColumns(users)`.
- Export static types: `export type User = typeof User.static`.
- Zod is used ONLY in `src/common/env.ts` for env validation via `@t3-oss/env-core`.

## DB Patterns

- All tables use `...timestamps` (createdAt, updatedAt). Hard delete with `ON DELETE CASCADE`.
- No soft delete. Delete operations use `db.delete(table.X).where(...)`.
- JSONB for flexible content: questions, exams, submissions.
- Type exports: `type User = typeof users.$inferSelect`, `type NewUser = typeof users.$inferInsert`.
- New table checklist: add in `schema/`, add relations in `relations.ts`, re-export from `schema/index.ts`.

## Logging

- `import { logger } from "@common/logger"` -- never `console.log` (Biome enforces `noConsole: error`).
- API: `logger.info(msg, meta?)`, `logger.error(msg, meta?)`, `logger.warn(msg, meta?)`, `logger.debug(msg, meta?)`.
- JSON output to stdout/stderr. Respects `LOG_LEVEL` env var.

## Auth

- JWT via `jose` (`jwtVerify`, `SignJWT`). Secret from `env.JWT_SECRET` (min 32 chars).
- Actor type: `{ sub: string; role: Role; is(required: Role): boolean }`.
- Role hierarchy: learner (0) < instructor (1) < admin (2). `actor.is("instructor")` checks level >= 1.
- Refresh token rotation with reuse detection (`replacedByJti` chain). Max 3 active tokens per user.

## Biome Config

- 2-space indent, ES2022 modules.
- `noNonNullAssertion: error`, `noUnusedImports: error`, `noUnusedVariables: error`, `noConsole: error`.
- `noImportCycles: error`.
- Test file overrides: `noExplicitAny: off`, `useNamingConvention: off`.
- Seed files: `noConsole: off`.

## TypeScript Config

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- `module: "Preserve"`, `moduleResolution: "bundler"`, `verbatimModuleSyntax: true`.
- `noEmit: true` (Bun handles runtime, TS for type checking only).
- Types: `bun-types`.

## Testing

- `bun:test` -- files as `*.test.ts` or in `__tests__/`.
- Avoid mocks -- test actual implementation.
- Do not duplicate logic into tests.
- Test boundary conditions, null handling, error paths.
- Unit tests live next to source: `src/modules/auth/helpers.test.ts`.
- Integration tests in `tests/` directory.

## Style Rules

- No trivial wrappers: inline `new Date().toISOString()`, `.trim().toLowerCase()`, `Math.round()`.
- Wrapper only when it adds domain logic (validation, throw, orchestration).
- No speculative code. No consumer = no commit (YAGNI).
- When 2+ modules share a business concept, extract to `src/common/` immediately.
- Know your libs before wrapping them.
- `env` from `@common/env` -- never access `Bun.env` directly (except in env.ts itself).

## Common Utilities

- `normalizeEmail(email)` -- trim + lowercase.
- `escapeLike(str)` -- escape SQL LIKE special chars.
- `generateInviteCode()` -- crypto-random base64url.
- `calculateScore(correct, total)` -- returns 0-10 score with 0.5 steps, null if total=0.
- `scoreToBand(score)` -- maps score to VSTEP band (C1/B2/B1/null).
- `createStateMachine(transitions)` -- type-safe state transition validation.
