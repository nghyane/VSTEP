# DB Schema

**9 files** — Drizzle ORM table definitions for PostgreSQL. 13 tables, 10 enums.

## FILES

| File | Tables | Notes |
|------|--------|-------|
| `enums.ts` | — | 10 `pgEnum` definitions, re-exported via `@common/enums` for API layer |
| `helpers.ts` | — | `timestamps` + `timestampsWithSoftDelete` column sets |
| `users.ts` | users, refreshTokens | Partial unique index on email (soft delete aware) |
| `questions.ts` | questions, questionVersions | JSONB `content` + `answerKey`, version tracking |
| `submissions.ts` | submissions, submissionDetails, submissionEvents | Largest schema — grading pipeline + event sourcing |
| `exams.ts` | exams, examSessions, examAnswers, examSubmissions | Blueprint JSONB, per-skill score columns |
| `progress.ts` | userProgress, userSkillScores, userGoals | Adaptive learning, composite unique (userId+skill) |
| `outbox.ts` | outbox, processedCallbacks | Transactional outbox for async event dispatch |
| `index.ts` | — | Barrel re-export (intentional exception to no-barrel rule) |

## ENUMS (enums.ts)

`skill`(4) · `vstepBand`(5) · `userRole`(3) · `questionFormat`(10) · `questionLevel`(5) · `submissionStatus`(8) · `reviewPriority`(4) · `gradingMode`(3) · `examStatus`(4) · `streakDirection`(3) · `outboxStatus`(4)

## KEY PATTERNS

| Pattern | Where | Detail |
|---------|-------|--------|
| Soft delete | All main tables | `timestampsWithSoftDelete` → `deletedAt` + partial unique indexes `WHERE deletedAt IS NULL` |
| JSONB flexibility | questions, submissions, exams, outbox | Content, answers, blueprints, event payloads stored as JSONB |
| Event sourcing | `submissionEvents` | `kind` + `data` JSONB per submission state change |
| Transactional outbox | `outbox` + `processedCallbacks` | Async dispatch with `lockedAt/By`, retry `attempts`, dedup via `processedCallbacks` |
| Token rotation | `refreshTokens` | `replacedByJti` chain — detects reuse of rotated tokens |
| Idempotency | `submissions.requestId` | Unique constraint prevents duplicate submission processing |
| Numeric scores | `submissions.score` | `numeric(3,1)` → range 0.0–99.9, band-mapped |
| Type exports | All table files | `type Feature = typeof table.$inferSelect` + `type NewFeature = typeof table.$inferInsert` |

## CONVENTIONS

- New table → use `...timestampsWithSoftDelete` spread (or `...timestamps` for junction tables)
- New enum → define in `enums.ts`, register in `@common/enums` for API use
- New table → add relations in `../relations.ts`
- New table → re-export from `index.ts`
- Column naming: `camelCase` in TS, Drizzle auto-maps to `snake_case` in DB
