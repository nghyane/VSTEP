# Modules

**7 modules** — Feature-based MVC. Each module: `index.ts` (routes) + `schema.ts` (TypeBox schemas) + `service.ts` (logic).

## MODULE MAP

| Module | Prefix | Files | Domain |
|--------|--------|-------|--------|
| `auth/` | /api/auth | index+schema+service | Login, register, JWT rotation, logout |
| `users/` | /api/users | index+schema+service | Admin CRUD, password changes, search |
| `questions/` | /api/questions | index+schema+service | Question bank, versioning, JSONB content types |
| `submissions/` | /api/submissions | index+schema+service | Answer submission, auto/human grading pipeline |
| `exams/` | /api/exams | index+schema+service | Exam sessions, answer tracking, scoring |
| `progress/` | /api/progress | index+schema+service | Adaptive learning, skill scores, streaks, goals |
| `health/` | / | index+schema+service | DB/Redis health (infra, not feature) |

## ROUTE FILE PATTERN

```typescript
export const moduleName = new Elysia({
  name: 'module:{name}',
  prefix: '/{name}',
  detail: { tags: ['TagName'] }
})
  .use(authPlugin())
  .get('/', handler, {
    auth: true,                    // require authentication
    query: QuerySchema,            // TypeBox validation
    response: { 200: ResponseSchema },
    detail: { summary: '...' }
  })
```

**Auth macros**: `{ auth: true }` = any authenticated · `{ role: 'instructor' }` = instructor+ · `{ role: 'admin' }` = admin only

## SERVICE PATTERN

Plain exported `async function`s — never classes. Import `db` from `@db/index`. Return typed results.

## SCHEMA PATTERN

Each module's `schema.ts` contains ALL TypeBox schemas — both request (Body/Query) and response (drizzle-derived row types). Response schemas appear first, request schemas below. No namespace wrapping.

## DEVIATIONS

| Module | Deviation | Reason |
|--------|-----------|--------|
| `questions/` | Extra files in `@db/types/` | JSONB content types (`question-content.ts`, `answers.ts`, `grading.ts`) shared across modules |

## DOMAIN NOTES

- **submissions**: Most complex — status machine (pending→queued→processing→graded→reviewed), review queue with `claimedBy`/`deadline`, dual grading modes (auto + human)
- **progress**: Adaptive scaffold levels adjust based on performance streaks (streak direction + count)
- **auth**: Refresh token rotation with reuse detection via `replacedByJti` chain
- **exams**: Compose questions into sessions, track per-skill scores independently

## WHERE TO ADD A NEW MODULE

1. Create `src/modules/{name}/` with `index.ts` + `schema.ts` + `service.ts`
2. Copy route pattern from `auth/index.ts`
3. Mount in `src/app.ts` → `api.use(moduleName)`
4. Add DB tables in `src/db/schema/{name}.ts` if needed
