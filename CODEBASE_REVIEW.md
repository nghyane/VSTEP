# VSTEP Backend - Codebase Review & Refactoring Suggestions

## Overview

**Project**: VSTEP Adaptive Learning Platform (SP26SE145)
**Stack**: Bun + Elysia + Drizzle ORM + PostgreSQL
**Scope**: Backend API (~42 TypeScript files, 6 feature modules, 13 DB tables)

---

## 1. Architecture Assessment

### What's Done Well

- **Modular structure**: Consistent `index.ts` (routes) + `model.ts` (schemas) + `service.ts` (logic) per module
- **Type safety**: TypeBox schemas, Drizzle inferred types, path aliases
- **Error handling**: Custom error hierarchy with request ID tracing
- **Auth**: Refresh token rotation with reuse detection (security best practice)
- **DB patterns**: Soft deletes, pagination helpers, partial indexes
- **Outbox pattern**: For async grading service integration

### Structural Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Circular dependency risk between schema files | Medium | `exams.ts` imports from `questions.ts` and `submissions.ts` |
| `relations.ts` is a monolith | Low | `src/db/relations.ts` (165 lines, will grow) |
| No separation between internal vs external API types | Medium | Models serve both validation and response shaping |

---

## 2. Code Quality Issues & Refactoring Suggestions

### 2.1. Repeated Boilerplate: Column Selection

**Problem**: Every service manually defines column objects AND repeats them in `db.query` calls with `columns: { id: true, ... }`. The same columns are listed 2-3 times per entity.

**Files affected**: All service files

**Example** (`users/service.ts:11-18` vs `users/service.ts:22-32`):
```typescript
// Defined once as select columns
const USER_COLUMNS = {
  id: table.users.id,
  email: table.users.email,
  // ...
} as const;

// Then AGAIN in db.query calls
const user = await db.query.users.findFirst({
  columns: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
});
```

**Suggestion**: Create a utility that derives one format from the other, or standardize on one query style. Use `db.query` with a shared columns config, OR use `db.select(COLUMNS)` consistently.

```typescript
// Option A: Derive columns config from table definition
function selectColumns<T extends Record<string, unknown>>(
  table: T,
  keys: (keyof T)[]
): Record<string, true> {
  return Object.fromEntries(keys.map(k => [k, true]));
}

const USER_SELECT_KEYS = ['id', 'email', 'fullName', 'role', 'createdAt', 'updatedAt'] as const;
```

---

### 2.2. Duplicated `VstepBand` Enum Literals

**Problem**: The VSTEP band values `["A1", "A2", "B1", "B2", "C1"]` are hardcoded as TypeBox literals in **3 separate files** instead of reusing the shared `VstepBand` enum from `common/enums.ts`.

**Files affected**:
- `modules/submissions/model.ts:12-20` (Submission.band)
- `modules/submissions/model.ts:45-51` (UpdateBody.band)
- `modules/submissions/model.ts:58-64` (GradeBody.band)
- `modules/auth/model.ts:8-12` (UserInfo.role - hardcodes role literals)

**Suggestion**: Import and reuse the shared enums:
```typescript
// Before (submissions/model.ts)
band: t.Optional(t.Nullable(t.Union([
  t.Literal("A1"), t.Literal("A2"), t.Literal("B1"), t.Literal("B2"), t.Literal("C1"),
]))),

// After
import { VstepBand } from "@common/enums";
band: t.Optional(t.Nullable(VstepBand)),
```

Same for `auth/model.ts` - import `UserRole` from `@common/enums` instead of hardcoding role literals.

---

### 2.3. Inconsistent `whereClause` Building

**Problem**: The pattern for building dynamic where clauses differs across services. Some check `conditions.length > 1`, others use `and(...conditions)` directly.

**Files affected**:
- `users/service.ts:57-58`: `conditions.length > 1 ? and(...conditions) : conditions[0]`
- `questions/service.ts:88-89`: Same pattern
- `submissions/service.ts:124-125`: Same pattern
- `exams/service.ts:72`: `and(...conditions)` (correct, simpler)

**Suggestion**: `and(...conditions)` works fine with a single condition. The ternary check is unnecessary. Standardize on the simpler pattern:

```typescript
// Before
const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

// After - and() handles single conditions correctly
const whereClause = and(...conditions);
```

---

### 2.4. Inconsistent `conditions` Array Type

**Problem**: Some services type conditions as `ReturnType<typeof and>[]` which is `SQL | undefined`. This is semantically wrong and can cause issues.

**Files affected**:
- `users/service.ts:47`
- `questions/service.ts:61`
- `submissions/service.ts:106`

**Suggestion**: Use `SQL[]` from drizzle-orm:
```typescript
import { type SQL } from "drizzle-orm";
const conditions: SQL[] = [notDeleted(table.users)];
```

---

### 2.5. Repeated Authorization Checks

**Problem**: Ownership + admin checks follow the same pattern across every service but are implemented ad-hoc each time.

**Pattern repeated in**:
- `users/service.ts:130-137` (update)
- `users/service.ts:238-240` (updatePassword)
- `questions/service.ts:180-182` (update)
- `questions/service.ts:248-252` (createVersion)
- `questions/service.ts:349-351` (remove)
- `submissions/service.ts:73-75` (getById)
- `submissions/service.ts:224-226` (update)
- `submissions/service.ts:374-376` (remove)
- `exams/service.ts:202-204` (getSessionById)
- `exams/service.ts:246-248, 299-301, 445-447` (submitAnswer, saveAnswers, submitExam)

**Suggestion**: Extract authorization into a reusable guard:

```typescript
// common/guards.ts
export function assertOwnerOrAdmin(
  resourceUserId: string,
  currentUserId: string,
  isAdmin: boolean,
  message = "You do not have access to this resource",
) {
  if (resourceUserId !== currentUserId && !isAdmin) {
    throw new ForbiddenError(message);
  }
}
```

---

### 2.6. `new Date().toISOString()` Repeated Everywhere

**Problem**: `new Date().toISOString()` is called dozens of times across services for timestamps. When two timestamps are set in the same operation (e.g., `updatedAt` and `deletedAt`), they can differ by microseconds.

**Occurrences**: 30+ across all service files

**Suggestion**: Create a helper and use a single timestamp per operation:

```typescript
// common/utils.ts
export function now(): string {
  return new Date().toISOString();
}

// Usage
const timestamp = now();
await tx.update(table.users).set({
  deletedAt: timestamp,
  updatedAt: timestamp,
});
```

Alternatively, use Drizzle's `sql`NOW()`` to let PostgreSQL handle timestamps consistently.

---

### 2.7. `QuestionSkill` is a Duplicate of `Skill`

**Problem**: In `common/enums.ts`, both `Skill` and `QuestionSkill` are created from the exact same source (`skillEnum.enumValues`).

**File**: `common/enums.ts:26-27`
```typescript
export const Skill = enumSchema(skillEnum.enumValues);
export const QuestionSkill = enumSchema(skillEnum.enumValues); // duplicate
```

**Suggestion**: Remove `QuestionSkill` and use `Skill` everywhere:
```typescript
export const Skill = enumSchema(skillEnum.enumValues);
// Remove QuestionSkill, update imports in questions module
```

---

### 2.8. Services Export as Classes with Only Static Methods

**Problem**: All services use `class` with only `static` methods. This is an anti-pattern in TypeScript - it's essentially using classes as namespaces.

**Files affected**: All `service.ts` files

**Suggestion**: Two options:

**Option A** - Use plain exported functions (simpler, tree-shakeable):
```typescript
// Before
export class UserService {
  static async getById(userId: string) { ... }
  static async list(query: ...) { ... }
}

// After
export async function getUserById(userId: string) { ... }
export async function listUsers(query: ...) { ... }
```

**Option B** - If you prefer namespacing, keep the pattern but be aware it prevents dependency injection and testing. The current approach is acceptable for this project scale but won't scale to DI-based testing.

**Recommendation**: Keep the current pattern for consistency. It's not causing real problems at this scale and provides clear namespacing. Refactor only if you add unit tests requiring mocks.

---

### 2.9. Missing Return Type Annotations on Service Methods

**Problem**: No service method has explicit return type annotations. TypeScript infers them, but explicit types serve as documentation and catch unintended changes.

**Files affected**: All `service.ts` files

**Suggestion**: Add return types at least to public service methods:

```typescript
// Before
static async getById(userId: string) {

// After
static async getById(userId: string): Promise<UserModel.User> {
```

---

### 2.10. Logger is Inefficient for Structured Logging

**Problem**: The logger creates a new `Date` object and JSON stringifies for every log call, even when the log level would suppress output. The level check happens after formatting in the current code structure.

**File**: `common/logger.ts:17-25, 28-48`

Wait, actually the level check IS before the write. However, the logger methods recreate the same pattern 4 times.

**Suggestion**: DRY up the logger:

```typescript
function log(level: LogLevel, stream: typeof Bun.stdout, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] >= currentLevel) {
    stream.write(format(level, msg, meta));
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", Bun.stdout, msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", Bun.stdout, msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", Bun.stderr, msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", Bun.stderr, msg, meta),
};
```

---

### 2.11. Health Check Logic in `app.ts`

**Problem**: The health check endpoint in `app.ts` (lines 52-104) contains ~50 lines of business logic (Redis URL manipulation, RabbitMQ management API construction). This makes the app entry point harder to read.

**File**: `app.ts:52-104`

**Suggestion**: Extract to a `health` module or service:

```typescript
// modules/health/service.ts
export class HealthService {
  static async check(): Promise<HealthStatus> { ... }
}

// app.ts
.get("/health", () => HealthService.check())
```

---

### 2.12. Redis Health Check is Incorrect

**Problem**: The Redis health check replaces `redis://` with `http://` and tries to fetch. This doesn't actually check Redis - Redis uses a binary protocol, not HTTP.

**File**: `app.ts:73-79`
```typescript
const res = await fetch(env.REDIS_URL.replace(/^redis/, "http")).catch(() => null);
services.redis = res ? "ok" : "error";
```

**Suggestion**: Use a proper Redis client to PING, or remove the fake check. A TCP connection check would be more accurate:

```typescript
// Use Bun's TCP socket to check Redis connectivity
const url = new URL(env.REDIS_URL);
try {
  const socket = await Bun.connect({
    hostname: url.hostname,
    port: Number(url.port) || 6379,
    socket: {
      data() {},
      open(socket) { socket.write("PING\r\n"); },
    },
  });
  socket.end();
  services.redis = "ok";
} catch {
  services.redis = "error";
}
```

---

### 2.13. `paginate()` and `paginationMeta()` Duplicate Logic

**Problem**: Both `paginate()` and `paginationMeta()` independently calculate `safeLimit`. When called together (which is always), the clamping runs twice.

**File**: `db/helpers.ts:7-23`

**Suggestion**: Combine into a single function or have `paginationMeta` accept the already-clamped values:

```typescript
export function pagination(page = 1, limit = 20) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    meta: (total: number) => ({
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    }),
  };
}
```

---

### 2.14. `UserService.update` Allows Password Change Without Verification

**Problem**: `UserService.update()` (`users/service.ts:118-197`) accepts a `password` field and updates it directly (for admins). There's a separate `updatePassword` endpoint that requires `currentPassword`, but the PATCH endpoint bypasses this. The model (`UserModel.UpdateBody`) includes `password` as an updateable field.

**File**: `users/service.ts:182-186`, `users/model.ts:34`

**Suggestion**: Remove `password` from `UpdateBody` schema. Password changes should only go through the dedicated `/users/:id/password` endpoint which validates the current password.

---

### 2.15. `ExamService.saveAnswers` Has N+1 Query Problem

**Problem**: `saveAnswers` validates each question AND upserts each answer inside a loop, causing 2N queries for N answers.

**File**: `exams/service.ts:306-319`
```typescript
for (const { questionId, answer } of answers) {
  await ExamService.validateQuestion(tx, questionId); // query 1
  await tx.insert(table.examAnswers).values(...).onConflictDoUpdate(...); // query 2
}
```

**Suggestion**: Batch validate all questions at once, then batch upsert:

```typescript
// Batch validate
const questionIds = answers.map(a => a.questionId);
const validQuestions = await tx
  .select({ id: table.questions.id })
  .from(table.questions)
  .where(and(
    inArray(table.questions.id, questionIds),
    eq(table.questions.isActive, true),
  ));

const validIds = new Set(validQuestions.map(q => q.id));
const invalidIds = questionIds.filter(id => !validIds.has(id));
if (invalidIds.length > 0) {
  throw new BadRequestError(`Invalid or inactive questions: ${invalidIds.join(", ")}`);
}

// Then batch upsert (or at least remove the validation from the loop)
```

---

### 2.16. `ProgressService.getSpiderChart` Has N+1 Problem

**Problem**: `getSpiderChart` calls `getBySkill` in a loop for each of 4 skills, and each call queries `userProgress` + `userSkillScores`. This results in 8 queries.

**File**: `progress/service.ts:104-109`

**Suggestion**: Query all skills at once:

```typescript
const allScores = await db
  .select({ skill: table.userSkillScores.skill, score: table.userSkillScores.score, createdAt: table.userSkillScores.createdAt })
  .from(table.userSkillScores)
  .where(eq(table.userSkillScores.userId, userId))
  .orderBy(desc(table.userSkillScores.createdAt))
  .limit(40); // 10 per skill max

const allProgress = await db.query.userProgress.findMany({
  where: eq(table.userProgress.userId, userId),
});

// Then group by skill and compute metrics in memory
```

---

### 2.17. `ProgressService` Export Style Inconsistency

**Problem**: All other services use `export class FooService`, but `ProgressService` uses `class ProgressService { ... } export { ProgressService };`.

**File**: `progress/service.ts:5, 125`

**Suggestion**: Use `export class ProgressService` for consistency.

---

### 2.18. Auth Token Double Verification

**Problem**: In `auth.ts` plugin, the `role` macro calls `verifyAccessToken` independently. If a route uses both `auth: true` and `role: "admin"`, the token is verified twice.

**File**: `plugins/auth.ts:74-88`

Looking at the code, `role` replaces `auth` (it doesn't stack). But the concern is that if someone uses `{ auth: true, role: "admin" }`, both macros fire. The `role` macro already implicitly authenticates, making `auth: true` redundant.

**Suggestion**: Document this clearly, or have `role` implicitly set `auth: true` internally.

---

### 2.19. `Submission.create` Doesn't Return Details

**Problem**: `SubmissionService.create()` returns `SUBMISSION_COLUMNS` from the insert but doesn't include `answer`/`result`/`feedback` from `submissionDetails`. The response type is `SubmissionWithDetails` which expects these fields.

**File**: `submissions/service.ts:176-195`

**Suggestion**: Return the full object including details:
```typescript
return {
  ...sub,
  answer: body.answer,
  result: null,
  feedback: null,
};
```

---

### 2.20. SQL Injection Risk in Search

**Problem**: In `questions/service.ts:83-85`, the search query uses string interpolation with `sql` template literal, but the pattern is safe because it uses parameterized values. However, the `%` wildcard in ILIKE could be exploited for ReDoS-like performance issues with patterns like `%%%%%`.

**File**: `questions/service.ts:84`, `users/service.ts:54`
```typescript
sql`${table.questions.content}::text ILIKE ${`%${query.search}%`}`
ilike(table.users.fullName, `%${query.search}%`)
```

**Suggestion**: Escape special LIKE characters (`%`, `_`, `\`) in user input:
```typescript
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

ilike(table.users.fullName, `%${escapeLike(query.search)}%`)
```

---

## 3. Architectural Refactoring Suggestions

### 3.1. Extract Common List Pattern

Every `list()` method follows the exact same pattern: build conditions -> count query -> data query -> return `{ data, meta }`. This could be extracted into a generic helper.

```typescript
// db/helpers.ts
export async function paginatedQuery<T>(opts: {
  table: PgTable;
  columns: Record<string, Column>;
  conditions: SQL[];
  orderBy: Column;
  page?: number;
  limit?: number;
  joins?: ...;
}): Promise<{ data: T[]; meta: PaginationMeta }> {
  const { limit, offset } = paginate(opts.page, opts.limit);
  const where = and(...opts.conditions);

  const [{ count: total }] = await db.select({ count: count() }).from(opts.table).where(where);
  const data = await db.select(opts.columns).from(opts.table).where(where)
    .orderBy(desc(opts.orderBy)).limit(limit).offset(offset);

  return { data, meta: paginationMeta(total, opts.page, opts.limit) };
}
```

### 3.2. Standardize Error Response in Routes

Routes define `response` schemas for every error status code (401, 403, 404). This is repetitive. Consider creating route-level presets:

```typescript
// common/schemas.ts
export const AuthErrors = { 401: ErrorResponse, 403: ErrorResponse };
export const CrudErrors = { ...AuthErrors, 404: ErrorResponse };
export const CrudWithConflictErrors = { ...CrudErrors, 409: ErrorResponse };
```

### 3.3. Consider Repository Pattern

Currently services directly use `db` and `table`. If the project grows, consider a thin repository layer:

```
Route -> Service (business logic) -> Repository (data access)
```

This would make services testable without a database. For the current project scope, this is optional.

---

## 4. Security Findings

| Finding | Severity | File | Line |
|---------|----------|------|------|
| Password in PATCH body (bypasses verification) | High | `users/model.ts` | 34 |
| LIKE wildcards not escaped in search | Low | `users/service.ts`, `questions/service.ts` | 54, 84 |
| Redis health check doesn't actually check Redis | Low | `app.ts` | 73-79 |
| No rate limiting on login/register endpoints | Medium | `modules/auth/index.ts` | - |
| `JWT_SECRET` non-null assertion (`!`) | Info | `auth/service.ts`, `plugins/auth.ts` | 11, 34 |
| No password complexity validation (only minLength: 8) | Low | `auth/model.ts` | 28 |

---

## 5. Testing Gaps

- Only auth plugin has tests (`plugins/__tests__/auth-final.test.ts`)
- No service layer tests
- No integration tests for API routes
- No test for the outbox pattern
- No test for refresh token rotation/reuse detection

**Priority testing targets**:
1. `AuthService` (login, register, refresh, reuse detection)
2. `SubmissionService.autoGrade` (SQL-based grading logic)
3. `ExamService.submitExam` (complex transaction with auto-grading + submission creation)
4. `ProgressService.getBySkill` (trend calculation logic)

---

## 6. Priority Refactoring Roadmap

### Phase 1 - Quick Wins (Low Risk)
1. Remove `QuestionSkill` duplicate enum
2. Replace hardcoded band/role literals with shared enums in models
3. Standardize `and(...conditions)` pattern (remove unnecessary ternary)
4. Fix `conditions` array type to `SQL[]`
5. Extract `now()` helper for timestamps
6. Fix `ProgressService` export style

### Phase 2 - Moderate Effort
7. Remove `password` from `UserModel.UpdateBody`
8. Escape LIKE wildcards in search inputs
9. Extract authorization guard helper
10. Fix `Submission.create` to return details
11. DRY up logger
12. Extract health check logic from `app.ts`

### Phase 3 - Performance
13. Fix N+1 in `ExamService.saveAnswers` (batch validate)
14. Fix N+1 in `ProgressService.getSpiderChart` (batch query)
15. Consider extracting paginated list helper

### Phase 4 - Architecture (Optional)
16. Fix Redis health check
17. Add rate limiting to auth endpoints
18. Extract common list pattern helper
19. Add comprehensive test coverage
20. Consider repository pattern for testability

---

## Summary

The codebase is well-structured for a capstone project with consistent patterns, good type safety, and production-grade security features (token rotation, reuse detection, RBAC). The main areas for improvement are:

1. **DRY violations**: Duplicated enums, column definitions, authorization checks, timestamp generation
2. **N+1 queries**: In exam answer saving and spider chart calculation
3. **Minor security**: Password in PATCH body, unescaped LIKE patterns
4. **Testing**: Minimal test coverage for critical business logic

The suggested refactorings are ordered by impact-to-effort ratio. Phase 1 items can be done in a single PR with minimal risk.
