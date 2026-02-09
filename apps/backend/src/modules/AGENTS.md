# Modules

**7 modules** — Feature-based MVC. Each module: `index.ts` (routes) + `model.ts` (schemas) + `service.ts` (logic).

## MODULE MAP

| Module | Prefix | Files | Domain |
|--------|--------|-------|--------|
| `auth/` | /api/auth | index+model+service | Login, register, JWT rotation, logout |
| `users/` | /api/users | index+model+service | Admin CRUD, password changes, search |
| `questions/` | /api/questions | index+model+service+**content-schemas** | Question bank, versioning, JSONB content types |
| `submissions/` | /api/submissions | index+model+service | Answer submission, auto/human grading pipeline |
| `exams/` | /api/exams | index+model+service | Exam sessions, answer tracking, scoring |
| `progress/` | /api/progress | index+model+service | Adaptive learning, skill scores, streaks, goals |
| `health/` | / | **service.ts only** | DB/Redis/RabbitMQ health (infra, not feature) |

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

## MODEL PATTERN

TypeBox `t.Object(...)` schemas exported directly — no namespace wrapping. Separate request (Query/Body) and response schemas.

## DEVIATIONS

| Module | Deviation | Reason |
|--------|-----------|--------|
| `health/` | No index.ts or model.ts | Infrastructure concern — route defined in `app.ts`, not self-contained |
| `questions/` | Extra `content-schemas.ts` | Discriminated union TypeBox schemas for 10 question formats (JSONB) |

## DOMAIN NOTES

- **submissions**: Most complex — status machine (pending→queued→processing→graded→reviewed), review queue with `claimedBy`/`deadline`, dual grading modes (auto + human)
- **progress**: Adaptive scaffold levels adjust based on performance streaks (streak direction + count)
- **auth**: Refresh token rotation with reuse detection via `replacedByJti` chain
- **exams**: Compose questions into sessions, track per-skill scores independently

## WHERE TO ADD A NEW MODULE

1. Create `src/modules/{name}/` with `index.ts` + `model.ts` + `service.ts`
2. Copy route pattern from `auth/index.ts`
3. Mount in `src/app.ts` → `api.use(moduleName)`
4. Add DB tables in `src/db/schema/{name}.ts` if needed
