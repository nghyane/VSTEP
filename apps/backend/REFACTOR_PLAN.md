# Backend Refactor Plan

Mục tiêu: Fix toàn bộ bugs + chuyển pattern phù hợp Bun/Node ecosystem.

---

## Phase 1: Fix Bugs & Security (CRITICAL)

### 1.1 Race condition `UserService.create()`
- **File**: `src/modules/users/service.ts:87-94`
- **Bug**: Check-then-insert (TOCTOU). `AuthService.register()` đã fix, nhưng `UserService.create()` chưa.
- **Fix**: Bỏ `findFirst` check, catch PostgreSQL error code `23505`.

### 1.2 Auth bypass — `GET /questions/:id/versions/:versionId`
- **File**: `src/modules/questions/index.ts:145-163`
- **Bug**: Endpoint không có `auth: true` hoặc `role`. Ai cũng xem được `answerKey`.
- **Fix**: Thêm `role: "instructor"`.

### 1.3 Response schema mismatch — Questions module
- **File**: `src/modules/questions/service.ts:132, 206, 367`
- **Bug**: 3 methods dùng `.returning()` không chọn columns → trả `answerKey`, `deletedAt` ngoài schema → TypeBox reject response.
- **Affected routes**: `POST /questions`, `PATCH /questions/:id`, `POST /questions/:id/restore`
- **Fix**: Dùng `.returning(QUESTION_PUBLIC_COLUMNS)` thay vì `.returning()`.

### 1.4 `scoreToBand()` thiếu A1/A2
- **File**: `src/modules/submissions/service.ts:21-26`
- **Bug**: Enum có `["A1","A2","B1","B2","C1"]` nhưng function chỉ trả B1/B2/C1/null.
- **Fix**:
  ```
  >= 8.5 → C1
  >= 6.0 → B2
  >= 4.0 → B1
  >= 2.0 → A2
  > 0    → A1
  0      → null
  ```

### 1.5 `ProgressService.getSpiderChart()` math bug
- **File**: `src/modules/progress/service.ts:148`
- **Bug**: `(Math.round(avg * 10) / 10) * 10` tạo scale 0-100, mọi nơi khác dùng 0-10.
- **Fix**: Bỏ `* 10`.

### 1.6 Admin không thể force-complete submission
- **File**: `src/modules/submissions/service.ts:208-209`
- **Bug**: `validateTransition()` chạy cho cả admin, nhưng `pending → completed` không hợp lệ.
- **Fix**: Admin bypass `validateTransition()`.

### 1.7 `ExamService.submitExam()` N+1 inserts
- **File**: `src/modules/exams/service.ts:462-481`
- **Bug**: Loop 3 INSERT/answer cho writing/speaking.
- **Fix**: Batch insert `.values([...])`.

### 1.8 Unbounded array — `AnswerSaveBody`
- **File**: `src/modules/exams/model.ts:50-57`
- **Bug**: `t.Array()` không có `maxItems`. Attacker gửi hàng triệu answers.
- **Fix**: Thêm `{ maxItems: 200 }` (VSTEP max ~75 questions, 200 là safe margin).

### 1.9 Score validation thiếu bounds ở schema level
- **File**: `src/modules/submissions/model.ts:44-48`
- **Bug**: `GradeBody.score` là `t.Number()` không min/max. Service check runtime nhưng schema nên validate.
- **Fix**: `t.Number({ minimum: 0, maximum: 10 })`.

### 1.10 Feedback string không giới hạn length
- **File**: `src/modules/submissions/model.ts:47` + `src/db/schema/submissions.ts:115`
- **Bug**: `feedback: varchar("feedback")` không length + `t.String()` không maxLength.
- **Fix**: Schema `varchar("feedback", { length: 10000 })`, model `t.String({ maxLength: 10000 })`.

---

## Phase 2: JSONB Validation (Input Layer)

Thay `t.Any()` bằng TypeBox schemas cụ thể, validate ở HTTP request layer.

### 2.1 Question Content Schemas
- **File mới**: `src/modules/questions/content-schemas.ts`
- Mỗi `questionFormat` có schema riêng:

```
reading_mcq / reading_tng / reading_matching_headings / reading_gap_fill:
  { passage: string, title?: string, items: [{ number, prompt, options: {A,B,C,D} }] }

listening_mcq:
  { audioUrl: string, transcript?: string, items: [{ number, prompt, options }] }

listening_dictation:
  { audioUrl: string, items: [{ number, prompt }] }

writing_task_1 / writing_task_2:
  { taskNumber: 1|2, prompt: string, instructions?: string, minWords?: number, imageUrls?: string[] }

speaking_part_1 / speaking_part_2 / speaking_part_3:
  { partNumber: 1|2|3, prompt: string, instructions?: string, options?: string[], preparationSeconds?: number, speakingSeconds?: number }
```

### 2.2 Answer Key Schema
```
correctAnswers: Record<string, string>  (reading/listening only)
```

### 2.3 User Answer Schema
```
reading/listening: { answers: Record<string, string> }
writing:          { text: string }
speaking:         { audioUrl: string, durationSeconds: number, transcript?: string }
```

### 2.4 Blueprint Schema
```
{
  listening: { parts: [{ partNumber, questionIds: string[], count }], totalQuestions, duration },
  reading:   { passages: [{ passageNumber, questionIds: string[], count, level }], totalQuestions, duration },
  writing:   { tasks: [{ taskNumber, questionId: string, minWords, weight }], duration },
  speaking:  { parts: [{ partNumber, questionId: string, prepTime?, duration }] }
}
```

### 2.5 Cách implement
- TypeBox schemas trong `content-schemas.ts`.
- Route dùng `t.Union` discriminated by `format` field.
- Service nhận typed data, không cần force cast.
- Response schemas cho JSONB output fields cũng define cụ thể (thay `t.Any()`).

---

## Phase 3: Pattern — Static Class → Plain Functions

### Nguyên tắc
- **Plain exported functions** thay vì static class methods.
- **`db` là parameter có default** → testable không cần DI framework.
- Idiomatic cho Bun/Node/Elysia ecosystem.

### 3.1 Chuyển đổi từng service

**Trước:**
```typescript
export class AuthService {
  static async login(body: {...}) {
    const user = await db.query.users.findFirst(...);
  }
}
```

**Sau:**
```typescript
export async function login(body: {...}, database = db) {
  const user = await database.query.users.findFirst(...);
}
```

**Các file cần thay đổi:**

| File | Class | Functions |
|------|-------|-----------|
| `auth/service.ts` | `AuthService` | `signAccessToken`, `login`, `register`, `refreshToken`, `logout` |
| `users/service.ts` | `UserService` | `getById`, `list`, `create`, `update`, `remove`, `updatePassword` |
| `questions/service.ts` | `QuestionService` | `getById`, `list`, `create`, `update`, `createVersion`, `getVersions`, `getVersion`, `remove`, `restore` |
| `submissions/service.ts` | `SubmissionService` | `getById`, `list`, `create`, `update`, `grade`, `remove`, `autoGrade` |
| `exams/service.ts` | `ExamService` | `getById`, `list`, `create`, `update`, `startSession`, `getSessionById`, `submitAnswer`, `saveAnswers`, `submitExam` |
| `progress/service.ts` | `ProgressService` | `getOverview`, `getBySkill`, `getSpiderChart` |
| `health/service.ts` | `HealthService` | `check` |

**Route files** (`index.ts`) cập nhật import:
```typescript
import * as authService from "./service";
.post("/login", () => authService.login(body))
```

### 3.2 Bỏ biome override `noStaticOnlyClass`
- Sau khi chuyển hết, xóa `"noStaticOnlyClass": "off"` trong `biome.json`.

### 3.3 Bỏ namespace pattern trong model.ts
```typescript
// Trước
export namespace AuthModel {
  export const LoginBody = t.Object({...});
}
// Sau — prefix thay namespace
export const AuthLoginBody = t.Object({...});
export const AuthUserInfo = t.Object({...});
```

Prefix = tên module (`Auth`, `User`, `Exam`, `Question`, `Submission`, `Progress`).

### 3.4 Pure functions export riêng để test
- `scoreToBand(score)` — `submissions/service.ts`
- `validateTransition(current, next)` — `submissions/service.ts`
- `computeTrend(scores, stdDev)` — `progress/service.ts`
- `parseExpiry(str)` — `auth/service.ts`
- `hashToken(token)` — `auth/service.ts`

---

## Phase 4: DB Schema Cleanup

### 4.1 Thêm indexes thiếu
| Table | Column(s) | Lý do |
|-------|-----------|-------|
| `refreshTokens` | `expiresAt` | Filter token expired trong `login()` |
| `submissions` | `skill` | Filter by skill trong `list()` |
| `submissions` | `questionId` | FK nhưng không có index |
| `questions` | `createdBy` | `assertAccess` check ownership |
| `examSessions` | `examId` | Filter sessions by exam |

### 4.2 Xóa index thừa
- `questions_skill_level_idx` — trùng với `questions_active_idx` (cùng `skill, level`).

### 4.3 Xóa 10 unused columns trong `submissions`
Các columns khai báo nhưng **không có service nào đọc/ghi**:
- `confidence`, `reviewPending`, `isLate`, `requestId`
- `reviewPriority`, `reviewerId`, `gradingMode`
- `auditFlag`, `claimedBy`, `claimedAt`

Cũng xóa `submissions_request_id_unique` index (never used).

> **Lưu ý**: Nếu team plan dùng cho human review queue → giữ lại `reviewPriority`, `reviewerId`, `claimedBy`, `claimedAt`, `gradingMode`. Cần confirm với team.

### 4.4 Xóa/persist `examAnswers.isCorrect`
- Column `isCorrect` không bao giờ được set. `autoGradeAnswers()` tính in-memory nhưng không persist.
- **Fix**: Hoặc persist khi auto-grade, hoặc xóa column.

### 4.5 Bỏ `$onUpdate` trên schema
- `$onUpdate(() => new Date().toISOString())` trên `updatedAt` + service cũng set `updatedAt: now()` = double-set.
- **Fix**: Bỏ `$onUpdate`, giữ explicit set trong service (rõ ràng hơn).

### 4.6 Thêm `varchar` length limits
Các `varchar` không có length:
- `submissionDetails.feedback` → thêm `{ length: 10000 }`
- Các `varchar` khác đã có length. OK.

---

## Phase 5: Unit Tests

### 5.1 Pure function tests (không cần mock DB)
- **File**: `src/modules/submissions/__tests__/grading.test.ts`
  - `scoreToBand`: mọi khoảng score (0, 1, 3, 4, 6, 8.5, 10)
  - `validateTransition`: mọi transition hợp lệ + không hợp lệ
- **File**: `src/modules/progress/__tests__/trend.test.ts`
  - `computeTrend`: insufficient_data, stable, improving, declining, inconsistent
- **File**: `src/modules/auth/__tests__/helpers.test.ts`
  - `parseExpiry`: s/m/h/d + invalid format
  - `hashToken`: deterministic output

### 5.2 Service tests (mock DB via parameter)
Sau Phase 3, mỗi service function nhận `database` parameter:
```typescript
import { describe, test, expect, mock } from "bun:test";
import { login } from "../service";

const mockDb = {
  query: { users: { findFirst: mock(() => ({...})) } }
};

test("login with valid credentials", async () => {
  const result = await login({ email: "a@b.c", password: "pass" }, mockDb);
  expect(result.user.id).toBe("1");
});
```

---

## Phase 6: Code Cleanup

### 6.1 Bỏ COLUMN constants trùng lặp
```typescript
// Trước
const EXAM_COLUMNS = { id: table.exams.id, level: table.exams.level, ... };
// Sau
import { getTableColumns } from "drizzle-orm";
const { deletedAt, ...examColumns } = getTableColumns(table.exams);
```

### 6.2 Extract pagination count helper
```typescript
// Lặp 5 lần → extract
async function countWhere(tbl, where, database = db) {
  const [r] = await database.select({ count: count() }).from(tbl).where(where);
  return r?.count ?? 0;
}
```

### 6.3 ProgressService thiếu soft-delete filter
- `getOverview()` line 34: query `userProgress` không có `notDeleted()`.
- `getBySkill()` line 51: query `userProgress` không có `notDeleted()`.
- `getSpiderChart()` line 104-116: query `userSkillScores` không filter deleted.
- **Fix**: Thêm filter hoặc join với users để đảm bảo user chưa bị xóa.

### 6.4 Outbox schema — dead code
- `src/db/schema/outbox.ts` + `processedCallbacks` + relations: không có service nào dùng.
- **Quyết định**: Giữ nếu grading service sẽ dùng. Xóa nếu không.

---

## Tổng kết

| Phase | Nội dung | Files | Ưu tiên |
|-------|----------|-------|---------|
| **1** | Bugs & Security | ~10 | **CRITICAL** |
| **2** | JSONB Validation | ~9 | **HIGH** |
| **3** | Pattern (functions + no namespace) | ~20 | **HIGH** |
| **4** | DB Schema Cleanup | ~6 | **MEDIUM** |
| **5** | Unit Tests | ~4 | **MEDIUM** |
| **6** | Code Cleanup | ~8 | **LOW** |

Thứ tự: Phase 1 → 2 → 3 → 4 → 5 → 6.
Phase 5 có thể làm song song với Phase 3 (test pure functions ngay khi export).
