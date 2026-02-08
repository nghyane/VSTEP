# Backend Refactor Plan

Mục tiêu: Fix toàn bộ bugs + chuyển pattern phù hợp Bun/Node ecosystem.
Thứ tự: Phase 1 → 2 → 3 → 4 → 5 → 6 (Phase 5 có thể song song Phase 3).

---

## Phase 1: Fix Bugs & Security (CRITICAL)

- [ ] **1.1** Race condition `UserService.create()` — `src/modules/users/service.ts:87-94`
  - Check-then-insert (TOCTOU). Bỏ `findFirst`, catch PostgreSQL `23505`.

- [ ] **1.2** Auth bypass `GET /questions/:id/versions/:versionId` — `src/modules/questions/index.ts:145-163`
  - Endpoint không có auth → ai cũng xem được `answerKey`. Thêm `role: "instructor"`.

- [ ] **1.3** Response schema mismatch — Questions `.returning()` — `src/modules/questions/service.ts:132, 206, 367`
  - `.returning()` trả `answerKey`, `deletedAt` ngoài schema → TypeBox reject. Dùng `.returning(QUESTION_PUBLIC_COLUMNS)`.

- [ ] **1.4** `scoreToBand()` thiếu A1/A2 — `src/modules/submissions/service.ts:21-26`
  - Chỉ trả B1/B2/C1/null, thiếu A1/A2. Fix: ≥8.5→C1, ≥6→B2, ≥4→B1, ≥2→A2, >0→A1, 0→null.

- [ ] **1.5** Spider chart math bug — `src/modules/progress/service.ts:148`
  - `*10` tạo scale 0-100, mọi nơi khác 0-10. Bỏ `*10`.

- [ ] **1.6** Admin không force-complete submission — `src/modules/submissions/service.ts:208-209`
  - `validateTransition()` chạy cho cả admin. Fix: admin bypass.

- [ ] **1.7** `submitExam()` N+1 inserts — `src/modules/exams/service.ts:462-481`
  - Loop INSERT/answer cho writing/speaking. Fix: batch `.values([...])`.

- [ ] **1.8** Unbounded array `AnswerSaveBody` — `src/modules/exams/model.ts:50-57`
  - `t.Array()` không `maxItems`. Thêm `{ maxItems: 200 }`.

- [ ] **1.9** Score thiếu bounds — `src/modules/submissions/model.ts:44-48`
  - `t.Number()` không min/max. Fix: `t.Number({ minimum: 0, maximum: 10 })`.

- [ ] **1.10** Feedback string không giới hạn — `src/modules/submissions/model.ts:47` + `src/db/schema/submissions.ts:115`
  - Schema `varchar("feedback", { length: 10000 })`, model `t.String({ maxLength: 10000 })`.

- [ ] **1.11** `app.ts` gọi `.listen()` ở module scope — `src/app.ts:64`
  - Import `app` = server start. Fix: tách `.listen()` vào `src/index.ts`.

- [ ] **1.12** `env.JWT_SECRET!` non-null assertion — `src/plugins/auth.ts:44`, `src/modules/auth/service.ts:12`
  - `skipValidation` widens type. Fix: bỏ `skipValidation` hoặc runtime check + throw.

- [ ] **1.13** `saveAnswers()` N+1 validate — `src/modules/exams/service.ts:306-319`
  - Loop validate + upsert 2N queries. Fix: batch validate 1 lần, batch upsert.

- [ ] **1.14** `updatePassword()` không transaction — `src/modules/users/service.ts:203-241`
  - Read → verify → update tách rời. Fix: wrap `db.transaction()`.

- [ ] **1.15** `SubmissionService.create()` validate ngoài tx — `src/modules/submissions/service.ts:131-170`
  - Question validation ngoài tx, insert trong tx. Fix: di chuyển vào tx.

- [ ] **1.16** `startSession()` validate ngoài tx — `src/modules/exams/service.ts:160-196`
  - `getById()` ngoài tx, insert session trong tx. Fix: di chuyển vào tx.

---

## Phase 2: JSONB Validation — Input Layer (HIGH)

Thay `t.Any()` bằng TypeBox schemas cụ thể, validate ở HTTP request layer.

- [ ] **2.1** Question Content Schemas — tạo `src/modules/questions/content-schemas.ts`
  - Mỗi `questionFormat` có schema riêng (reading_mcq, listening_mcq, writing_task, speaking_part, etc.)

- [ ] **2.2** Answer Key Schema
  - `correctAnswers: Record<string, string>` (reading/listening only)

- [ ] **2.3** User Answer Schema
  - reading/listening: `{ answers: Record<string, string> }`, writing: `{ text: string }`, speaking: `{ audioUrl, durationSeconds, transcript? }`

- [ ] **2.4** Blueprint Schema (Exam)
  - Typed schema cho `exams.blueprint` JSONB (listening/reading/writing/speaking sections)

- [ ] **2.5** Apply schemas vào routes + response
  - Route dùng `t.Union` discriminated by format. Response schemas cho JSONB output cũng define cụ thể.

---

## Phase 3: Pattern — Static Class → Plain Functions (HIGH)

- [ ] **3.1** Chuyển 7 service files sang plain functions (`db` as parameter with default)
  - `auth/service.ts` (AuthService → 5 functions)
  - `users/service.ts` (UserService → 6 functions)
  - `questions/service.ts` (QuestionService → 9 functions)
  - `submissions/service.ts` (SubmissionService → 7 functions)
  - `exams/service.ts` (ExamService → 9 functions)
  - `progress/service.ts` (ProgressService → 3 functions)
  - `health/service.ts` (HealthService → 1 function)
  - Cập nhật route files (`index.ts`) import tương ứng.

- [ ] **3.2** Bỏ biome override `noStaticOnlyClass` — `biome.json`

- [ ] **3.3** Bỏ namespace pattern trong model.ts → prefix
  - `AuthModel.LoginBody` → `AuthLoginBody`, etc. cho tất cả 6 modules.

- [ ] **3.4** Export pure functions riêng để test
  - `scoreToBand`, `validateTransition`, `computeTrend`, `parseExpiry`, `hashToken`

---

## Phase 4: DB Schema Cleanup (MEDIUM)

- [ ] **4.1** Thêm indexes thiếu
  - `refreshTokens.expiresAt`, `submissions.skill`, `submissions.questionId`, `questions.createdBy`, `examSessions.examId`

- [ ] **4.2** Xóa index thừa `questions_skill_level_idx` (trùng `questions_active_idx`)

- [ ] **4.3** Xóa unused columns `submissions`: `requestId`, `auditFlag`, `isLate`, `reviewPending` + xóa `submissions_request_id_unique`
  - Giữ grading columns: `confidence`, `reviewPriority`, `reviewerId`, `gradingMode`, `claimedBy`, `claimedAt`

- [ ] **4.4** Fix `examAnswers.isCorrect` — persist khi auto-grade hoặc xóa column

- [ ] **4.5** Bỏ `$onUpdate` trên `updatedAt` (giữ explicit set trong service)

- [ ] **4.6** Thêm `varchar` length limit cho `submissionDetails.feedback` → `{ length: 10000 }`

---

## Phase 5: Unit Tests (MEDIUM)

- [ ] **5.1** Pure function tests (không cần mock DB)
  - `submissions/__tests__/grading.test.ts`: `scoreToBand`, `validateTransition`
  - `progress/__tests__/trend.test.ts`: `computeTrend`
  - `auth/__tests__/helpers.test.ts`: `parseExpiry`, `hashToken`

- [ ] **5.2** Service tests (mock DB via parameter)
  - Sau Phase 3, mỗi function nhận `database` parameter → mock dễ dàng.

---

## Phase 6: Code Cleanup & Docs (LOW)

- [ ] **6.1** Bỏ COLUMN constants trùng lặp → dùng `getTableColumns()` + destructure bỏ `deletedAt`

- [ ] **6.2** Extract pagination count helper `countWhere(tbl, where, database)`

- [ ] **6.3** ProgressService thiếu soft-delete filter — `src/modules/progress/service.ts`
  - `getOverview`, `getBySkill`, `getSpiderChart` không filter deleted users.

- [ ] **6.4** Outbox schema — giữ cho grading service (không xóa)

- [ ] **6.5** Xóa dead error classes: `ValidationError`, `InternalError` — `src/plugins/error.ts`
  - Giữ `RateLimitError` (sẽ dùng cho rate limiting).

- [ ] **6.6** Remove unused dep `drizzle-typebox` — `bun remove drizzle-typebox`

- [ ] **6.7** `tsconfig.json` — xóa `"jsx": "react-jsx"` và `"allowJs": true`

- [ ] **6.8** `biome.json` — đổi `noConsole` từ `"warn"` → `"error"`

- [ ] **6.9** `biome.json` — bật lại `noNonNullAssertion` (sau khi fix 1.12)

- [ ] **6.10** Auth plugin unsafe `user` derive — `src/plugins/auth.ts:68-70`
  - `undefined as unknown as Actor`. Fix: document hoặc derive as `Actor | undefined`.

- [ ] **6.11** `getSpiderChart()` N+1 query — `src/modules/progress/service.ts:104-109`
  - 4 skills × 2 queries = 8 queries. Fix: query tất cả 1 lần, group in-memory.

- [ ] **6.12** Update `README.md` — `apps/backend/README.md` (template `bun init` cũ)

- [ ] **6.13** Xóa `CODEBASE_REVIEW.md` (trùng plan này)

- [ ] **6.14** Fix `agent.md` — sai routes path, sai authPlugin syntax, thiếu module pattern

- [ ] **6.15** Fix `CLAUDE.md` — sai 13→16 tables, 10→12 enums, stale JWT_REFRESH_SECRET, thiếu password.ts

- [ ] **6.16** `esbuild` moderate vulnerability (dev only) — update khi patch available

---

## Tổng kết

| Phase | Nội dung | Items | Ưu tiên |
|-------|----------|-------|---------|
| **1** | Bugs & Security | 16 | **CRITICAL** |
| **2** | JSONB Validation | 5 | **HIGH** |
| **3** | Pattern (functions + no namespace) | 4 | **HIGH** |
| **4** | DB Schema Cleanup | 6 | **MEDIUM** |
| **5** | Unit Tests | 2 | **MEDIUM** |
| **6** | Code Cleanup + Docs | 16 | **LOW** |
| | **Tổng** | **49** | |
