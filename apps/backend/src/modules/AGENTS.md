# Modules

Each module has `index.ts` (routes) + `schema.ts` (TypeBox) + `service.ts` (logic). Extra files are allowed when a concern grows beyond ~200 lines (e.g., `auto-grade.ts`, `session.ts`).

## Conventions

- **Routes (`index.ts`):** Thin — validate input, call service, return response. No DB queries or business logic here.
- **Services (`service.ts`):** Plain exported `async function`s — never classes. Import `db` from `@db/index`.
- **Schemas (`schema.ts`):** Response schemas (drizzle-derived) first, request schemas below. No namespace wrapping.
- **Auth guards:** `{ auth: true }` = any authenticated. `{ role: 'instructor' }` = instructor+. `{ role: 'admin' }` = admin only.
- **Export naming:** Module Elysia instance uses lowercase domain name (`export const users = new Elysia(...)`).

## Adding a Module

1. Create `src/modules/{name}/` with `index.ts` + `schema.ts` + `service.ts`
2. Mount in `src/app.ts` via `api.use(moduleName)`
3. Add DB tables in `src/db/schema/` if needed

## Gotchas

- `health/` mounts at `/health`, not under `/api`. All other modules mount under `/api/{name}`.
- Inter-module service calls are allowed (e.g., progress service is called from submissions, exams). Import the function directly — no event bus.
- Test files (`*.test.ts`) live next to the source file they test, inside the module directory.
