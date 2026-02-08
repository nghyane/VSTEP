# Backend Refactor Plan

Mục tiêu: Fix toàn bộ bugs + chuyển pattern phù hợp Bun/Node ecosystem.

## Phase 1: Fix Bugs Nghiêm Trọng

### 1.1 Race condition `UserService.create()`
- **File**: `src/modules/users/service.ts:87-94`
- **Bug**: Check-then-insert (TOCTOU). `AuthService.register()` đã fix, nhưng `UserService.create()` chưa.
- **Fix**: Bỏ `findFirst` check, catch PostgreSQL error code `23505` giống `AuthService.register()`.

### 1.2 Answer key leak — `GET /questions/:id/versions/:versionId`
- **File**: `src/modules/questions/index.ts:145-163`
- **Bug**: Endpoint không có `auth: true` hoặc `role`. Ai cũng xem được `answerKey`.
- **Fix**: Thêm `role: "instructor"` (giống `GET /:id/versions`).

### 1.3 `scoreToBand()` không trả A1/A2
- **File**: `src/modules/submissions/service.ts:21-26`
- **Bug**: Enum `vstep_band` có `["A1","A2","B1","B2","C1"]` nhưng function chỉ trả B1/B2/C1/null.
- **Quyết định**: VSTEP 3-5 chỉ đánh giá B1-C1. Giữ logic hiện tại, nhưng thêm A2 cho score < 4.0, return null chỉ khi score = 0 hoặc insufficient data.
- **Fix**:
  ```
  >= 8.5 → C1
  >= 6.0 → B2
  >= 4.0 → B1
  >= 2.0 → A2
  > 0    → A1
  0      → null
  ```

### 1.4 `ProgressService.getSpiderChart()` math bug
- **File**: `src/modules/progress/service.ts:148`
- **Bug**: `(Math.round(avg * 10) / 10) * 10` — nhân 10 vô nghĩa, tạo scale 0-100 trong khi mọi nơi khác dùng 0-10.
- **Fix**: Bỏ `* 10`, giữ `Math.round(avg * 10) / 10` (1 decimal place, scale 0-10).

### 1.5 Admin không thể force-complete submission
- **File**: `src/modules/submissions/service.ts:208-209`
- **Bug**: `validateTransition()` chạy cho cả admin, nhưng VALID_TRANSITIONS không cho phép `pending → completed`.
- **Fix**: Admin bypass `validateTransition()`.

### 1.6 `ExamService.submitExam()` — N+1 inserts
- **File**: `src/modules/exams/service.ts:462-481`
- **Bug**: Loop tạo 3 INSERT per writing/speaking answer.
- **Fix**: Batch insert submissions, submissionDetails, examSubmissions bằng array `.values([...])`.

---

## Phase 2: JSONB Validation (Input Layer)

Định nghĩa TypeBox schemas cụ thể cho từng JSONB field, validate ở HTTP request layer.

### 2.1 Question Content Schemas
- **File mới**: `src/modules/questions/content-schemas.ts`
- Mỗi `questionFormat` có schema riêng:

```
reading_mcq / reading_tng / reading_matching_headings / reading_gap_fill:
  { passage: string, title?: string, items: Array<{ number, prompt, options: {A,B,C,D} }> }

listening_mcq:
  { audioUrl: string, transcript?: string, items: Array<{ number, prompt, options }>, scaffolding?: { keywords?, slowAudioUrl? } }

listening_dictation:
  { audioUrl: string, items: Array<{ number, prompt }> }

writing_task_1 / writing_task_2:
  { taskNumber: 1|2, prompt: string, instructions?: string, minWords?: number, imageUrls?: string[] }

speaking_part_1 / speaking_part_2 / speaking_part_3:
  { partNumber: 1|2|3, prompt: string, instructions?: string, options?: string[], preparationSeconds?: number, speakingSeconds?: number }
```

### 2.2 Answer Key Schema
```
correctAnswers: Record<string, string>  (cho reading/listening)
```
- Writing/speaking không có answerKey (human grading).

### 2.3 User Answer Schema
```
reading/listening: { answers: Record<string, string> }
writing:          { text: string }
speaking:         { audioUrl: string, durationSeconds: number, transcript?: string }
```

### 2.4 Blueprint Schema
```
{ level, listening: { parts: [...] }, reading: { passages: [...] }, writing: { tasks: [...] }, speaking: { parts: [...] } }
```

### 2.5 Cách implement
- Tạo TypeBox schemas trong `content-schemas.ts`.
- Routes dùng `t.Union` discriminated by `format` field.
- Service nhận typed data, không cần force cast.

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

| File | Class | Exported Functions |
|------|-------|--------------------|
| `auth/service.ts` | `AuthService` | `signAccessToken`, `login`, `register`, `refreshToken`, `logout` |
| `users/service.ts` | `UserService` | `getById`, `list`, `create`, `update`, `remove`, `updatePassword` |
| `questions/service.ts` | `QuestionService` | `getById`, `list`, `create`, `update`, `createVersion`, `getVersions`, `getVersion`, `remove`, `restore` |
| `submissions/service.ts` | `SubmissionService` | `getById`, `list`, `create`, `update`, `grade`, `remove`, `autoGrade` |
| `exams/service.ts` | `ExamService` | `getById`, `list`, `create`, `update`, `startSession`, `getSessionById`, `submitAnswer`, `saveAnswers`, `submitExam` |
| `progress/service.ts` | `ProgressService` | `getOverview`, `getBySkill`, `getSpiderChart` |
| `health/service.ts` | `HealthService` | `check` |

**Thay đổi route files** (`index.ts`):
```typescript
// Trước
import { AuthService } from "./service";
.post("/login", () => AuthService.login(body))

// Sau
import * as authService from "./service";
.post("/login", () => authService.login(body))
// hoặc
import { login } from "./service";
.post("/login", () => login(body))
```

### 3.2 Bỏ biome override `noStaticOnlyClass`
- **File**: `biome.json`
- Sau khi chuyển hết sang functions, xóa `"noStaticOnlyClass": "off"`.

### 3.3 Pure functions tách riêng (đã testable)
Các pure functions không phụ thuộc DB, export riêng để test:
- `scoreToBand(score)` — `submissions/service.ts`
- `validateTransition(current, next)` — `submissions/service.ts`
- `computeTrend(scores, stdDev)` — `progress/service.ts`
- `parseExpiry(str)` — `auth/service.ts`
- `hashToken(token)` — `auth/service.ts`

---

## Phase 4: Unit Tests

### 4.1 Pure function tests (không cần mock DB)
- **File**: `src/modules/submissions/__tests__/grading.test.ts`
  - `scoreToBand`: test mọi khoảng score
  - `validateTransition`: test mọi transition hợp lệ + không hợp lệ
- **File**: `src/modules/progress/__tests__/trend.test.ts`
  - `computeTrend`: test insufficient_data, stable, improving, declining, inconsistent
- **File**: `src/modules/auth/__tests__/helpers.test.ts`
  - `parseExpiry`: test s/m/h/d + invalid format
  - `hashToken`: test deterministic output

### 4.2 Service tests (mock DB via parameter)
Sau Phase 3, mỗi service function nhận `database` parameter:
```typescript
import { describe, test, expect, mock } from "bun:test";
import { login } from "../service";

const mockDb = {
  query: { users: { findFirst: mock(() => ({ id: "1", passwordHash: "..." })) } }
};

test("login with valid credentials", async () => {
  const result = await login({ email: "a@b.c", password: "pass" }, mockDb);
  expect(result.user.id).toBe("1");
});
```

---

## Phase 5: Cleanup

### 5.1 Bỏ namespace pattern trong model.ts
```typescript
// Trước
export namespace AuthModel {
  export const LoginBody = t.Object({...});
  export type LoginBody = typeof LoginBody.static;
}

// Sau
export const LoginBody = t.Object({...});
export type LoginBody = typeof LoginBody.static;
```

Tuy nhiên: namespace giúp gom các schema theo module, avoid name collision giữa các module (ví dụ `UserModel.User` vs `AuthModel.UserInfo`). **Giữ hoặc bỏ tùy team preference** — đây không phải bug, chỉ là style choice. Nếu bỏ namespace, dùng prefix: `AuthLoginBody`, `AuthUserInfo`, `UserCreateBody`...

### 5.2 Bỏ COLUMN constants trùng lặp
```typescript
// Trước — khai báo columns 2 lần
const EXAM_COLUMNS = { id: table.exams.id, ... };

// Sau — dùng getTableColumns() hoặc columns: { id: true, ... }
import { getTableColumns } from "drizzle-orm";
const { deletedAt, ...examColumns } = getTableColumns(table.exams);
```

### 5.3 Extract pagination helper
```typescript
// Trước — lặp 5 lần
const [countResult] = await db.select({ count: count() }).from(table.X).where(where);
const total = countResult?.count ?? 0;

// Sau — helper
async function countWhere(table, where, database = db) {
  const [r] = await database.select({ count: count() }).from(table).where(where);
  return r?.count ?? 0;
}
```

### 5.4 Xóa `$onUpdate` trên schema hoặc bỏ set `updatedAt` trong service
Chọn 1 trong 2, không cần cả 2. Recommend: **giữ trong service** (explicit), bỏ `$onUpdate` (implicit, dễ quên).

### 5.5 Xóa outbox schema nếu chưa dùng
`src/db/schema/outbox.ts` + relations — dead code. Xóa hoặc giữ nếu plan dùng cho grading service.

---

## Thứ tự thực hiện

```
Phase 1 (Bugs)     →  ước tính: 6 files thay đổi
Phase 2 (JSONB)    →  ước tính: 3 files mới + 6 files update model/route
Phase 3 (Pattern)  →  ước tính: 14 files (7 service + 7 index)
Phase 4 (Tests)    →  ước tính: 4 files test mới
Phase 5 (Cleanup)  →  ước tính: 10 files cleanup
```

Phase 1 → 3 là ưu tiên. Phase 4-5 làm song song hoặc sau.
