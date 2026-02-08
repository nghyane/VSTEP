# Backend Refactor Plan

Mục tiêu: Fix toàn bộ bugs + chuyển pattern phù hợp Bun/Node ecosystem.
Thứ tự: Phase 1 → 2 → 3 → 4 → 5 → 6 (Phase 5 có thể song song Phase 3).

> **Tham chiếu**: `docs/capstone/specs/` (domain specs, DB schema, API contracts),
> `docs/sample/` (37 JSON fixtures từ luyenthivstep.vn), `docs/00-06/` (exam format & rubrics).
> Docs là tham khảo — một số thông tin do agent tổng hợp, cần cross-check.

---

## Phase 1: Fix Bugs & Security (CRITICAL)

- [ ] **1.1** Race condition `UserService.create()` — `src/modules/users/service.ts:87-94`
  - Check-then-insert (TOCTOU). Bỏ `findFirst`, catch PostgreSQL `23505`.

- [ ] **1.2** Auth bypass `GET /questions/:id/versions/:versionId` — `src/modules/questions/index.ts:145-163`
  - Endpoint không có auth → ai cũng xem được `answerKey`. Thêm `role: "instructor"`.

- [ ] **1.3** Response schema mismatch — Questions `.returning()` — `src/modules/questions/service.ts`
  - `create()` line 132, `update()` line 206, `restore()` line 367: `.returning()` trả toàn bộ row (bao gồm `answerKey`, `deletedAt`) ngoài response schema → TypeBox reject hoặc leak answer key.
  - Fix: `.returning(QUESTION_PUBLIC_COLUMNS)` cho cả 3 methods.

- [ ] **1.4** `scoreToBand()` logic sai — `src/modules/submissions/service.ts:21-26`
  - **VSTEP.3-5 chỉ đánh giá B1-C1** (docs `00-overview/scoring-system.md`). A1/A2 là cấp độ VSTEP.1-2, không dùng cho scoring.
  - Hiện tại: ≥8.5→C1, ≥6→B2, ≥4→B1, else→null. Logic đúng hướng nhưng thiếu xử lý edge.
  - Fix: Giữ null cho <4.0 (= below B1). KHÔNG map sang A1/A2 vì sai domain.
  - Thêm: `score === 0` → null, validate score ≥0 trước khi gọi.

- [ ] **1.5** Spider chart math bug — `src/modules/progress/service.ts:148`
  - `(Math.round(avg * 10) / 10) * 10` tạo scale 0-100, mọi nơi khác 0-10. Bỏ `* 10`.

- [ ] **1.6** Admin không force-complete submission — `src/modules/submissions/service.ts:208-209`
  - `validateTransition()` chạy cho cả admin. Fix: admin bypass.

- [ ] **1.7** `submitExam()` N+1 inserts — `src/modules/exams/service.ts:462-481`
  - Loop `createSubmissionForExam()` → 3 INSERTs/answer (submissions + details + examSubmissions).
  - Fix: batch `.values([...])` cho mỗi table, reduce N*3 queries → 3 queries.

- [ ] **1.8** Unbounded array `AnswerSaveBody` — `src/modules/exams/model.ts:50-57`
  - `t.Array()` không `maxItems`. VSTEP tối đa 75 câu (35 listening + 40 reading).
  - Fix: `{ maxItems: 200 }` (safe margin cho cả writing/speaking parts).

- [ ] **1.9** Score thiếu bounds — `src/modules/submissions/model.ts:44-48`
  - `t.Number()` không min/max. Fix: `t.Number({ minimum: 0, maximum: 10 })`.

- [ ] **1.10** Feedback string không giới hạn — `src/modules/submissions/model.ts:47` + `src/db/schema/submissions.ts:115`
  - Schema `varchar("feedback", { length: 10000 })`, model `t.String({ maxLength: 10000 })`.

- [ ] **1.11** `app.ts` gọi `.listen()` ở module scope — `src/app.ts:64`
  - Import `app` = server start. Fix: tách `.listen()` vào `src/index.ts`.

- [ ] **1.12** `env.JWT_SECRET!` non-null assertion — `src/plugins/auth.ts:44`, `src/modules/auth/service.ts:12`
  - `skipValidation` widens type. Fix: bỏ `skipValidation` hoặc runtime check + throw.

- [ ] **1.13** `saveAnswers()` N+1 upserts — `src/modules/exams/service.ts:330-340`
  - Batch validation đã làm (query 1 lần). Chỉ còn loop upsert từng answer = N queries.
  - Fix: Batch upsert dùng `VALUES` list + `ON CONFLICT DO UPDATE` 1 statement.

- [ ] **1.14** `updatePassword()` không transaction — `src/modules/users/service.ts:203-241`
  - Read → verify → update tách rời. Fix: wrap `db.transaction()`.

- [ ] **1.15** `SubmissionService.create()` validate ngoài tx — `src/modules/submissions/service.ts:131-170`
  - Question validation ngoài tx, insert trong tx. Fix: di chuyển vào tx.

- [ ] **1.16** `startSession()` validate ngoài tx — `src/modules/exams/service.ts:160-196`
  - `getById()` ngoài tx, insert session trong tx. Fix: di chuyển vào tx.

- [ ] **1.17** Questions list `format` query dùng `t.String()` — `src/modules/questions/index.ts:27`
  - Cho phép giá trị format bất kỳ → query không filter đúng. Fix: `t.Optional(QuestionFormat)`.

---

## Phase 2: JSONB Validation — Input Layer (HIGH)

Thay `t.Any()` bằng TypeBox schemas cụ thể, validate ở HTTP request layer.

> **VSTEP.3-5 format** (from docs): Reading = MCQ only (4 passages, 40 câu A-D).
> Listening = MCQ only (3 parts, 35 câu A-D). Writing = 2 tasks (letter + essay).
> Speaking = 3 parts (interview + solution + topic).
>
> **Enum `questionFormatEnum`** hiện có `reading_tng`, `reading_matching_headings`,
> `reading_gap_fill`, `listening_dictation` — các format này là IELTS, **không tồn tại trong VSTEP**.
> Giữ lại trong enum cho extensibility nhưng document rõ. JSONB schemas focus vào formats thực tế.
>
> **Sample data** (`docs/sample/`): Cấu trúc `question_number`, `question_text`, `options`, `correct_answer`
> khác với canonical schema (`number`, `prompt`, `options`). Cần data transform khi import.

- [ ] **2.1** Question Content Schemas — tạo `src/modules/questions/content-schemas.ts`
  - **reading_mcq**: `{ passage: string, title?: string, items: [{ number, prompt, options: {A,B,C,D} }] }`
  - **listening_mcq**: `{ audioUrl: string, transcript?: string, scaffolding?: { keywords?: string[], slowAudioUrl?: string }, items: [{ number, prompt, options: {A,B,C,D} }] }`
  - **writing_task_1**: `{ taskNumber: 1, prompt: string, instructions?: string, minWords?: number(default:120), imageUrls?: string[] }`
  - **writing_task_2**: `{ taskNumber: 2, prompt: string, instructions?: string, minWords?: number(default:250), imageUrls?: string[] }`
  - **speaking_part_1**: `{ partNumber: 1, prompt: string, instructions?: string, speakingSeconds?: number }`
  - **speaking_part_2**: `{ partNumber: 2, prompt: string, instructions?: string, options: string[3], preparationSeconds?: number, speakingSeconds?: number }`
  - **speaking_part_3**: `{ partNumber: 3, prompt: string, instructions?: string, followUpQuestions?: string[], preparationSeconds?: number, speakingSeconds?: number }`
  - Các format IELTS (reading_tng, etc.): schema placeholder `t.Object({ ... })` — document as "reserved for future extension".

- [ ] **2.2** Answer Key Schema
  - Reading/Listening: `{ correctAnswers: Record<string, string> }` (key = question number, value = A/B/C/D)
  - Writing/Speaking: `null` (không có objective answer key)

- [ ] **2.3** User Answer Schema
  - Reading/Listening: `{ answers: Record<string, string> }`
  - Writing: `{ text: string }`
  - Speaking: `{ audioUrl: string, durationSeconds: number, transcript?: string }`

- [ ] **2.4** Blueprint Schema (Exam)
  - Typed schema cho `exams.blueprint` JSONB:
    ```
    {
      listening: { parts: [{ partNumber, questionIds: uuid[], count }], totalQuestions: 35, durationMinutes: 40 },
      reading:   { passages: [{ passageNumber, questionIds: uuid[], count, level }], totalQuestions: 40, durationMinutes: 60 },
      writing:   { tasks: [{ taskNumber, questionId: uuid, minWords, weight }], durationMinutes: 60 },
      speaking:  { parts: [{ partNumber, questionId: uuid, prepTimeSeconds?, speakingTimeSeconds }], durationMinutes: 12 }
    }
    ```
  - VSTEP constraints: listening 35 MCQ/40min, reading 40 MCQ/60min, writing 2 tasks/60min, speaking 3 parts/12min.

- [ ] **2.5** Apply schemas vào routes + response
  - Route dùng `t.Union` discriminated by `format` field cho CreateBody/UpdateBody.
  - Response schemas cho JSONB output cũng define cụ thể (thay `t.Any()` trong model.ts).
  - `ExamModel.Exam.blueprint` → typed schema thay `t.Any()`.
  - `ExamModel.Session.skillScores` → typed hoặc xóa (xem 4.7).

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

- [ ] **4.2** Xóa index thừa `questions_skill_level_idx` (trùng `questions_active_idx` — cùng columns `skill, level`)

- [ ] **4.3** Cleanup `submissions` columns
  - **Xóa**: `reviewPending` (redundant với status `review_pending`)
  - **Giữ** (grading pipeline per spec `20-domain/submission-lifecycle.md`):
    - `requestId` + unique index (idempotency key cho grading request)
    - `auditFlag` (spot-check 5-10% high-confidence submissions)
    - `isLate` (late callback handling — store result nhưng keep FAILED)
    - `confidence`, `reviewPriority`, `reviewerId`, `gradingMode`, `claimedBy`, `claimedAt`, `deadline`

- [ ] **4.4** Fix `examAnswers.isCorrect` — persist khi auto-grade
  - `autoGradeAnswers()` tính in-memory nhưng không set column. Fix: update `isCorrect` per answer khi `submitExam()`.

- [ ] **4.5** Bỏ `$onUpdate` trên `updatedAt` (giữ explicit set trong service)
  - Affected: `exams`, `examSessions`, `examAnswers`, `questions`, `submissions`, `submissionDetails`, `userProgress`, `userGoals`

- [ ] **4.6** Thêm `varchar` length limit cho `submissionDetails.feedback` → `{ length: 10000 }`

- [ ] **4.7** `examSessions.skillScores` JSONB — xóa hoặc typed
  - Column tồn tại nhưng KHÔNG BAO GIỜ được set trong code. Redundant với 4 individual score columns (`listeningScore`, `readingScore`, `writingScore`, `speakingScore`).
  - Fix: Xóa column. Nếu cần structured data, dùng 4 individual columns.

- [ ] **4.8** `examSessions.overallScore` — thêm mechanism tính toán
  - Column tồn tại nhưng không bao giờ được set. `submitExam()` chỉ tính L/R scores.
  - Per spec: `overallScore = (L + R + W + S) / 4`, rounded to nearest 0.5.
  - Fix: Tạo helper `calculateOverallScore()`. Call khi: (1) `submitExam()` nếu W/S không có, (2) grading callback update W/S score.
  - **Note**: Full implementation phụ thuộc grading callback (built later). Hiện tại chỉ cần: nếu exam chỉ có L/R → tính overall = (L+R)/2.

---

## Phase 5: Unit Tests (MEDIUM)

- [ ] **5.1** Pure function tests (không cần mock DB)
  - `submissions/__tests__/grading.test.ts`: `scoreToBand` (0, 3.5, 4, 5.5, 6, 8, 8.5, 10), `validateTransition` (all valid + invalid)
  - `progress/__tests__/trend.test.ts`: `computeTrend` (insufficient_data, stable, improving, declining, inconsistent)
  - `auth/__tests__/helpers.test.ts`: `parseExpiry` (s/m/h/d + invalid), `hashToken` (deterministic)
  - `exams/__tests__/scoring.test.ts`: `calculateScore` (0/0, 5/10, 35/35), `autoGradeAnswers` (mixed skills)

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
  - Giữ `RateLimitError` (sẽ dùng cho rate limiting per spec `40-platform/rate-limiting.md`).

- [ ] **6.6** Remove unused dep `drizzle-typebox` — `bun remove drizzle-typebox`

- [ ] **6.7** `tsconfig.json` — xóa `"jsx": "react-jsx"` và `"allowJs": true`

- [ ] **6.8** `biome.json` — đổi `noConsole` từ `"warn"` → `"error"`

- [ ] **6.9** `biome.json` — bật lại `noNonNullAssertion` (sau khi fix 1.12)

- [ ] **6.10** Auth plugin unsafe `user` derive — `src/plugins/auth.ts:68-70`
  - `undefined as unknown as Actor`. Fix: document hoặc derive as `Actor | undefined`.

- [ ] **6.11** `getSpiderChart()` incomplete fields — `src/modules/progress/service.ts`
  - Per spec (`20-domain/progress-tracking.md`): spider chart cần `current`, `previous`, `target`, `trend`, `confidence`.
  - Code chỉ có `current` và `trend`. Thiếu: `previous` (previous window avg), `target` (from user goal), `confidence` (window stdDev inverse).
  - Fix: Enrich response data + update `ProgressModel.SpiderChartSkill`.

- [ ] **6.12** Update `README.md` — `apps/backend/README.md` (template `bun init` cũ)

- [ ] **6.13** Xóa `CODEBASE_REVIEW.md` (trùng plan này)

- [ ] **6.14** Fix `agent.md` — sai routes path, sai authPlugin syntax, thiếu module pattern

- [ ] **6.15** Fix `CLAUDE.md` — sai 13→16 tables, 10→12 enums, stale JWT_REFRESH_SECRET, thiếu password.ts

- [ ] **6.16** `esbuild` moderate vulnerability (dev only) — update khi patch available

- [ ] **6.17** Document `questionFormatEnum` IELTS values
  - `reading_tng`, `reading_matching_headings`, `reading_gap_fill`, `listening_dictation` không tồn tại trong VSTEP.3-5.
  - Thêm JSDoc comment lên enum: "Reserved for future extension — not part of VSTEP.3-5".
  - Đảm bảo JSONB schemas (Phase 2) có placeholder cho các formats này.

---

## Tổng kết

| Phase | Nội dung | Items | Ưu tiên |
|-------|----------|-------|---------|
| **1** | Bugs & Security | 17 | **CRITICAL** |
| **2** | JSONB Validation | 5 | **HIGH** |
| **3** | Pattern (functions + no namespace) | 4 | **HIGH** |
| **4** | DB Schema Cleanup | 8 | **MEDIUM** |
| **5** | Unit Tests | 2 | **MEDIUM** |
| **6** | Code Cleanup & Docs | 17 | **LOW** |
| | **Tổng** | **53** | |

### Ghi chú từ docs analysis

**Spec features chưa implement (future work, KHÔNG thuộc plan này):**
- SSE real-time grading updates (`10-contracts/sse.md`)
- RabbitMQ integration + outbox relay (`10-contracts/queue-contracts.md`)
- Idempotency-Key header (`40-platform/idempotency-concurrency.md`)
- Rate limiting with Redis (`40-platform/rate-limiting.md`)
- Admin review queue endpoints (`20-domain/review-workflow.md`)
- Goals CRUD endpoints (`api-endpoints.md`)
- Adaptive scaffolding logic (`20-domain/adaptive-scaffolding.md`)
- Exam time limit enforcement
- Circuit breaker + timeout scheduler (`40-platform/reliability.md`)
- User deletion/anonymization (`50-ops/data-retention-privacy.md`)
