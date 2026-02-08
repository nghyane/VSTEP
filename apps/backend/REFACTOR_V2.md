# Backend Refactor Plan v2

Mục tiêu: Code sạch, type-safe, không bug ẩn, dễ maintain.
Thứ tự: R1 → R2 → R3 → R4 → R5.

> Baseline: Phase 1-4+6+7 (REFACTOR_PLAN.md) đã hoàn thành.
> Linter: `bun run check` pass. Tests: 69/69 pass.

---

## R1: Fix Hidden Bugs (CRITICAL)

### R1.1 — Unsafe `as` casts trong `autoGradeAnswers()`

**File:** `exams/service.ts:337-340`

```typescript
// HIỆN TẠI — cast mù, nếu data sai shape → so sánh sai → điểm sai
const correctAnswers = (answerKey as { correctAnswers?: Record<string, string> })
  ?.correctAnswers ?? {};
const userAnswers = (ea.answer ?? {}) as Record<string, string>;
```

**Vấn đề:** `answerKey` và `answer` là `unknown` từ JSONB. Cast không validate → nếu data format sai, auto-grade chấm sai mà không báo lỗi.

**Fix:** Tạo type guards dùng TypeBox `Value.Check()`:

```typescript
import { Value } from "@sinclair/typebox/value";
import { ObjectiveAnswerKey, ObjectiveAnswer } from "./content-schemas";

function parseAnswerKey(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswerKey, raw)) return raw.correctAnswers;
  return {};
}
function parseUserAnswer(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswer, raw)) return raw;
  return {};
}
```

---

### R1.2 — Fragile null→empty string trong access check

**File:** `questions/service.ts:166-170`

```typescript
// HIỆN TẠI — createdBy=null → "" → không match actor.sub → deny. Đúng kết quả nhưng logic mờ.
assertAccess(question.createdBy ?? "", actor, "...");
```

**Vấn đề:** Nếu logic `assertAccess` thay đổi (ví dụ allow empty string), sẽ thành security hole.

**Fix:** Check null explicitly trước `assertAccess`:

```typescript
if (!question.createdBy) {
  if (!actor.is("admin")) throw new ForbiddenError("Question has no owner");
} else {
  assertAccess(question.createdBy, actor, "...");
}
```

Áp dụng cả 3 chỗ: `updateQuestion`, `createQuestionVersion`, `removeQuestion`.

---

### R1.3 — Floating point bug trong score 0.5-step validation

**File:** `submissions/service.ts:297-299`

```typescript
// HIỆN TẠI — IEEE 754 precision: 0.1 * 2 = 0.20000000000000001
if (Math.round(body.score * 2) !== body.score * 2) { ... }
```

**Fix:** Dùng modulo check:

```typescript
if (body.score % 0.5 !== 0) {
  throw new BadRequestError("Score must be in 0.5 increments");
}
```

Hoặc integer math: `if ((body.score * 10) % 5 !== 0)`.

---

### R1.4 — Silent skip khi question không tìm thấy trong auto-grade

**File:** `exams/service.ts:331-332`

```typescript
// HIỆN TẠI — answer tham chiếu question đã bị xóa → bỏ qua im lặng → mất điểm
const question = questionsMap.get(ea.questionId);
if (!question) continue;
```

**Fix:** Throw error hoặc log warning. Trong exam context, tất cả questions đã validate khi submit answer, nên nếu thiếu = data corruption:

```typescript
if (!question) {
  throw new BadRequestError(`Question ${ea.questionId} not found during grading`);
}
```

---

### R1.5 — `refreshToken()` TOCTOU: lookup ngoài transaction

**File:** `auth/service.ts:177-245`

```typescript
// HIỆN TẠI — Step 1 (ngoài tx): tìm token, check reuse, check expiry, fetch user
const tokenRecord = await db.query.refreshTokens.findFirst(...);
// ... checks ...
// Step 2 (trong tx): revoke old, insert new
await db.transaction(async (tx) => { ... });
```

**Vấn đề:** Giữa Step 1 và Step 2, concurrent request có thể sử dụng cùng token → cả hai đều pass check → duplicate rotation.

**Fix:** Đưa toàn bộ vào 1 transaction:

```typescript
return db.transaction(async (tx) => {
  const tokenRecord = await tx.query.refreshTokens.findFirst(...);
  // ... tất cả checks ...
  // ... revoke + insert ...
});
```

---

### R1.6 — `as` casts sau `Value.Check()` trong auth plugin

**File:** `plugins/auth.ts:55-59`

```typescript
if (!Value.Check(PayloadSchema, payload)) {
  throw new UnauthorizedError("Malformed token payload");
}
return {
  sub: payload.sub as string,   // ← redundant cast
  jti: payload.jti as string,   // ← TypeBox đã narrow type
  role: payload.role as Role,
};
```

**Fix:** Dùng `Value.Decode()` hoặc access trực tiếp sau check (TypeBox narrow type đúng). Nếu TS không infer, dùng intermediate:

```typescript
const validated = payload as Static<typeof PayloadSchema>;
return { sub: validated.sub, jti: validated.jti, role: validated.role };
```

---

## R2: Tách `submitExam()` (HIGH)

### R2.1 — Decompose god function

**File:** `exams/service.ts:398-553` (155 dòng trong 1 transaction)

**Hiện tại làm quá nhiều:** validate session → fetch answers → fetch questions → auto-grade → persist isCorrect → calculate scores → create submissions → create details → create links → update session.

**Tách thành:**

```
submitExam(sessionId, actor)
├── getActiveSession(tx, sessionId, actor)           // có sẵn
├── fetchSessionAnswers(tx, sessionId)               // mới
├── fetchQuestionsForAnswers(tx, questionIds)         // mới
├── autoGradeAnswers(answers, questionsMap)           // có sẵn (pure)
├── persistCorrectness(tx, sessionId, correctnessMap) // mới
├── createPendingSubmissions(tx, session, pending)     // mới
└── finalizeSession(tx, sessionId, scores, status)     // mới
```

Mỗi function < 25 dòng, rõ trách nhiệm, dễ test từng phần.

---

### R2.2 — `overallScore` callback khi writing/speaking hoàn thành

**Vấn đề:** `overallScore` luôn `null` khi submit vì writing/speaking chưa graded. Không có code path nào update lại.

**Fix:** Thêm `updateSessionScoreIfComplete()` — gọi khi submission grading hoàn thành:

```typescript
export async function updateSessionScoreIfComplete(sessionId: string) {
  // Fetch session scores + check all exam_submissions completed
  // If all 4 skills scored → calculateOverallScore → update session
}
```

Hook vào `gradeSubmission()` hoặc callback từ grading service.

---

## R3: Consistency & Type Safety (MEDIUM)

### R3.1 — PG error code constant

**Files:** `auth/service.ts:162`, `users/service.ts:105`

Hai chỗ check `"23505"` bằng magic string với pattern khác nhau:

```typescript
// auth: typeof check
typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505"
// users: instanceof check
err instanceof Error && "code" in err && (err as { code: string }).code === "23505"
```

**Fix:** Tạo helper:

```typescript
// common/errors.ts
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
```

---

### R3.2 — Standardize column selection

**Vấn đề:** 3 pattern khác nhau:
1. `getTableColumns()` + destructure (users, exams, questions)
2. Manual `SUBMISSION_COLUMNS` object (submissions)
3. `db.query.findFirst({ columns: { id: true, ... } })` (getExamById, getExamSessionById, login)

**Fix:**
- Pattern 1 (`getTableColumns`) cho `.select()` / `.returning()` — đã chuẩn
- Pattern 2 chuyển sang `getTableColumns` cho submissions (exclude 12 columns bằng helper)
- Pattern 3 (`columns: { ... }`) OK cho `findFirst`/`findMany` — nhưng phải derive từ cùng source

Tạo helper omit:

```typescript
function omitColumns<T extends Record<string, unknown>, K extends keyof T>(
  cols: T, ...keys: K[]
): Omit<T, K> {
  const result = { ...cols };
  for (const key of keys) delete result[key];
  return result as Omit<T, K>;
}

// submissions:
const SUBMISSION_COLUMNS = omitColumns(
  getTableColumns(table.submissions),
  "confidence", "isLate", "attempt", "requestId",
  "reviewPriority", "reviewerId", "gradingMode",
  "auditFlag", "claimedBy", "claimedAt", "deadline", "deletedAt",
);
```

---

### R3.3 — Rename abbreviated unused vars

**Files:** users, questions, exams service

```typescript
// HIỆN TẠI
const { passwordHash: _ph, deletedAt: _da, ...USER_COLUMNS } = ...
const { answerKey: _ak, ...QUESTION_PUBLIC_COLUMNS } = ...
const { deletedAt: _ed, ...EXAM_COLUMNS } = ...
const { deletedAt: _sd, ...SESSION_COLUMNS } = ...
```

**Fix:**

```typescript
const { passwordHash: _passwordHash, deletedAt: _deletedAt, ...USER_COLUMNS } = ...
const { answerKey: _answerKey, ...QUESTION_PUBLIC_COLUMNS } = ...
const { deletedAt: _examDeletedAt, ...EXAM_COLUMNS } = ...
const { deletedAt: _sessionDeletedAt, ...SESSION_COLUMNS } = ...
```

---

### R3.4 — `VALID_TRANSITIONS` không cần export

**File:** `submissions/service.ts:30`

`VALID_TRANSITIONS` được export nhưng chỉ dùng bởi `validateTransition()`. Test hiện tại import nó để assert.

**Fix:** Remove export. Test chỉ cần test `validateTransition()` behavior, không cần access internal map.

---

### R3.5 — Bỏ `overallScore` write khi chắc chắn null

**File:** `exams/service.ts:477-482`

```typescript
// HIỆN TẠI — luôn null vì writing/speaking chưa graded, nhưng vẫn ghi DB
const overallScore = calculateOverallScore([
  listeningScore, readingScore, null, null,
]);
```

**Fix:** Không gọi `calculateOverallScore` ở đây (sẽ move sang R2.2). Chỉ ghi `listeningScore` + `readingScore`.

---

### R3.6 — `getExamSessionById` columns hardcoded, drift risk

**File:** `exams/service.ts:192-213`

Dùng `db.query.findFirst({ columns: { id: true, ... } })` — 12 fields manually listed, dễ drift khi thêm column mới.

**Fix:** Dùng `SESSION_COLUMNS` keys để generate columns object:

```typescript
const SESSION_QUERY_COLUMNS = Object.fromEntries(
  Object.keys(SESSION_COLUMNS).map((k) => [k, true]),
) as Record<keyof typeof SESSION_COLUMNS, true>;
```

---

## R4: Defensive Coding (MEDIUM)

### R4.1 — Health service: URL parsing

**File:** `health/service.ts:46-48`

```typescript
// HIỆN TẠI — regex replace, brittle
const mgmtUrl = env.RABBITMQ_URL.replace(/^amqp/, "http").replace(/:5672/, ":15672");
```

**Fix:**

```typescript
const url = new URL(env.RABBITMQ_URL);
url.protocol = url.protocol === "amqps:" ? "https:" : "http:";
url.port = "15672";
const mgmtUrl = url.toString();
```

---

### R4.2 — `assertAccess` type narrowing cho nullable `createdBy`

**File:** `common/utils.ts:25-32`

Hiện tại `assertAccess` nhận `string` cho `resourceUserId`. Nhưng `createdBy` có thể `null` (FK set null). Caller phải `?? ""` → fragile.

**Fix:** Overload signature:

```typescript
export function assertAccess(
  resourceUserId: string | null,
  actor: Actor,
  message?: string,
): void {
  if (resourceUserId === null || (resourceUserId !== actor.sub && !actor.is("admin"))) {
    throw new ForbiddenError(message ?? "You do not have access to this resource");
  }
}
```

Eliminates tất cả `?? ""` patterns.

---

### R4.3 — Transaction type extraction

**File:** `exams/service.ts:16`

```typescript
// HIỆN TẠI — fragile, phụ thuộc vào internal signature
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

**Fix:** Export type từ db module:

```typescript
// db/index.ts
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

---

### R4.4 — Submission update: bỏ query thừa

**File:** `submissions/service.ts:253-257`

```typescript
// HIỆN TẠI — re-fetch details SAU KHI vừa update
const [details] = await tx.select().from(table.submissionDetails)
  .where(eq(table.submissionDetails.submissionId, submissionId)).limit(1);
```

**Vấn đề:** Query thừa trong transaction. Đã có data từ update ở trên.

**Fix:** Dùng `.returning()` trên update details, hoặc build response từ input data.

---

## R5: Test Coverage (LOW)

### R5.1 — Test `isUniqueViolation` helper (sau R3.1)

### R5.2 — Test `parseAnswerKey` / `parseUserAnswer` guards (sau R1.1)

### R5.3 — Test `calculateOverallScore` edge: `[10, 0, 10, 0]` = 5.0

### R5.4 — Test `scoreToBand` boundary: 3.99 → null, 4.0 → B1

### R5.5 — Test score 0.5-step validation (sau R1.3): 5.3 → reject, 5.5 → pass

---

## Tổng kết

| Phase | Nội dung | Items | Ưu tiên |
|-------|----------|-------|---------|
| **R1** | Fix Hidden Bugs | 6 | **CRITICAL** |
| **R2** | Tách submitExam + overallScore callback | 2 | **HIGH** |
| **R3** | Consistency & Type Safety | 6 | **MEDIUM** |
| **R4** | Defensive Coding | 4 | **MEDIUM** |
| **R5** | Test Coverage | 5 | **LOW** |
| | **Tổng** | **23** | |

### Thứ tự thực hiện

```
R1 (bugs) → R3.1 (PG error helper) → R1.5 (auth tx, dùng helper)
         → R2.1 (tách submitExam)  → R2.2 (overallScore callback)
         → R3 (consistency)        → R4 (defensive)
         → R5 (tests)
```

### Không thuộc plan này

- Phase 0 (spec corrections) — cần domain owner review
- Phase 5 (DB migration) — cần running DB
- Features: SSE, RabbitMQ, rate limiting, admin review queue
