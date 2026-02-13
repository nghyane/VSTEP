# Modules

**7 modules** — each has `index.ts` (routes) + `schema.ts` (TypeBox schemas) + `service.ts` (logic).

## Module Map

| Module | Prefix | Extra files | Domain |
|--------|--------|-------------|--------|
| `auth/` | /api/auth | `helpers.ts` | Login, register, JWT rotation, logout |
| `users/` | /api/users | — | Admin CRUD, password changes, search |
| `questions/` | /api/questions | `version.ts` | Question bank, versioning, JSONB content |
| `submissions/` | /api/submissions | `auto-grade.ts` | Answer submission, auto/human grading pipeline |
| `exams/` | /api/exams | `session.ts`, `grading.ts` | Exam sessions, answer tracking, scoring |
| `progress/` | /api/progress | `trends.ts`, `constants.ts` | Adaptive learning, skill scores, streaks |
| `health/` | /health | — | DB/Redis health check |

## Patterns

**Routes:** `{ auth: true }` = any authenticated · `{ role: 'instructor' }` = instructor+ · `{ role: 'admin' }` = admin only

**Services:** Plain exported `async function`s — never classes. Import `db` from `@db/index`.

**Schemas:** Each `schema.ts` has response schemas (drizzle-derived) first, request schemas below. No namespace wrapping.

## Adding a Module

1. Create `src/modules/{name}/` with `index.ts` + `schema.ts` + `service.ts`
2. Mount in `src/app.ts` → `api.use(moduleName)`
3. Add DB tables in `src/db/schema/{name}.ts` if needed
