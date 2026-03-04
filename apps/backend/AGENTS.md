# VSTEP Backend

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

- Demo-first: optimize for dev speed, fewer bugs, demo quality. Skip production-scale concerns.
- Use Bun, not Node. `bun run`, `bun test`, `Bun.password`, `jose` — never npm/yarn/jest/bcrypt/jsonwebtoken. Bun auto-loads `.env`.
- All commands run from `apps/backend/`.
- `bun run verify` must pass before considering work complete (lint fix + typecheck).

## Commands

- **Dev:** `bun run dev`
- **Verify (lint+fix+typecheck):** `bun run verify`
- **Tests:** `bun test` | `bun test src/` (unit) | `bun test tests/` (integration)
- **DB:** `db:push` | `db:migrate` | `db:generate` | `db:studio` | `db:seed`

## Stack

Bun 1.3+ · Elysia 1.4+ · TypeScript 5.9+ (strict) · PostgreSQL · Drizzle ORM 0.45+ · TypeBox (via `drizzle-typebox`) · Zod (env only) · jose + Bun.password (Argon2id) · Biome 2.3+ · bun:test

## Architecture

```
src/
  app.ts              # Root Elysia, mounts plugins + modules under /api
  index.ts            # Server entry, exports `app` and `App` type
  common/             # Shared: env, logger, errors, schemas, scoring, state-machine, utils, auth-types
  plugins/            # auth.ts (guards/role macros), error.ts (AppError + request IDs)
  modules/{name}/     # index.ts (routes), schema.ts (TypeBox), service.ts (logic)
  db/
    index.ts          # Drizzle client, exports db + table + helpers
    schema/           # Tables, enums, barrel re-export
    relations.ts      # Drizzle relations
    helpers.ts        # paginate(), omitColumns()
    types/            # Shared JSONB types (answers, grading, blueprints)
```

## Grading Architecture

- Backend pushes task to Redis queue, Python worker (arq) pops + grades + writes result to PostgreSQL.
- Instructor override is final. Store both `aiScore` and `humanScore`. Set `auditFlag` when diff > 0.5.

## Conventions

### Imports

- Aliases: `@/*` = `src/*`, `@db/*` = `src/db/*`, `@common/*` = `src/common/*`, `@plugins/*` = `src/plugins/*`
- No `.js` extensions. No barrel re-exports (exception: `src/db/schema/index.ts`). No import cycles.

### Naming

- **PascalCase:** types, interfaces, enums, Elysia instances
- **camelCase:** functions, variables, object properties, DB columns in TS
- **CONSTANT_CASE or camelCase:** constants

### Errors

- Throw `AppError` subclasses — never return error objects, never use plain `Error`.
- `assertExists(value, "Resource")` → returns value or throws NotFoundError.
- `assertAccess(resourceUserId, actor, msg)` → checks ownership or admin.

### Routes

```ts
export const moduleName = new Elysia({ name: "module:name", prefix: "/name", detail: { tags: ["Name"] } })
.use(authPlugin)
.post("/path", ({ body, user }) => serviceFunction(body, user), {
  auth: true,              // or: role: ROLES.ADMIN
  body: RequestSchema,
  response: { 200: ResponseSchema, ...AuthErrors },
  detail: { summary: "..." },
});
```

### Services

- Plain exported `async function`s — never classes.
- Import `db` and `table` from `@db/index`.
- Wrap multi-step mutations in `db.transaction(async (tx) => { ... })`.
- `paginate(qb.$dynamic(), count, opts)` for list endpoints.
- `and(condition1, condition2)` — `and()` ignores `undefined` args natively.

### Schemas (TypeBox)

- Import `t` from `"elysia"`. Response schemas first, request schemas below.
- Derive from Drizzle: `createSelectSchema(table)` then `t.Omit(...)` / `t.Pick(...)`.
- Export static types: `export type User = typeof User.static`.

### DB

- All tables use `...timestamps`. Hard delete with `ON DELETE CASCADE`. No soft delete.
- JSONB for flexible content. New table checklist: schema/ → relations.ts → schema/index.ts.

### Auth

- Actor type: `{ sub: string; role: Role; is(required: Role): boolean }`.
- Role hierarchy: learner (0) < instructor (1) < admin (2).
- Refresh token rotation with reuse detection. Max 3 active tokens per user.

### Testing

- `bun:test` — files as `*.test.ts`. Avoid mocks. Test boundary conditions and error paths.
- Unit tests next to source. Integration tests in `tests/`.

### Style

- No trivial wrappers. No speculative code (YAGNI).
- `env` from `@common/env` — never `Bun.env` directly. `logger` from `@common/logger` — never `console.log`.
- When 2+ modules share a concept, extract to `src/common/`.

## Memories
- VSTEP project: `bun run db:push` requires interactive confirmation (Enter), so don't run it automatically — let the user run it manually.
