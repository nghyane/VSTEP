# Backend Refactor Plan

Mục tiêu: Fix toàn bộ bugs, sửa spec sai domain, chuyển pattern phù hợp Bun/Node ecosystem.
Thứ tự: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 (Phase 6 có thể song song Phase 3).

> **Tham chiếu**: `docs/capstone/specs/` (domain specs, DB schema, API contracts),
> `docs/sample/` (JSON fixtures — chỉ để phân tích, không phải data thực tế),
> `docs/00-06/` (exam format & rubrics).
> Docs là tham khảo — một số thông tin do agent tổng hợp, cần cross-check.

---

## Phase 0: Spec Corrections (CRITICAL)

Specs có nhiều chỗ sai domain VSTEP, contradictions, over-engineering. Sửa spec trước khi code theo.

### Sai domain VSTEP

- [ ] **0.1** Speaking rubric sai criteria — `20-domain/hybrid-grading.md`
  - Spec ghi 4 criteria: fluency, pronunciation, content, vocabulary.
  - **VSTEP thực tế 5 criteria** (`docs/06-scoring/speaking-rubric.md`): Grammar (20%), Vocabulary (20%), Pronunciation (20%), Fluency (20%), Discourse Management (20%).
  - "Content" không tồn tại trong VSTEP. Thiếu Grammar và Discourse Management.
  - Fix: Sửa criteriaScores thành 5 fields đúng VSTEP.

- [ ] **0.2** Writing rubric tên sai — `20-domain/hybrid-grading.md`
  - Spec ghi "Task Achievement". **VSTEP ghi "Task Response"** (`docs/06-scoring/writing-rubric.md`).
  - 4 criteria đúng: Task Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA).
  - Fix: Đổi tên cho khớp VSTEP rubric chính thức.

- [ ] **0.3** Overall band dùng `min(4 skills)` — `20-domain/progress-tracking.md` §8.2
  - **Sai**. VSTEP tính `overall = (L + R + W + S) / 4`, rounded to nearest 0.5.
  - `min()` harsh hơn nhiều (8.0, 8.0, 8.0, 5.5 → B1 thay vì B2). Learner sẽ thấy band khác xa thực tế.
  - Fix: Dùng `avg / 4` rounded 0.5 cho overall band, giống VSTEP chính thức.
  - Progress spec có thể **thêm** `weakest_skill` indicator riêng, nhưng overall band phải đúng VSTEP.

- [ ] **0.4** Band gap 5.6-5.9 không defined
  - VSTEP: B1 ≤ 5.5, B2 ≥ 6.0. Scores 5.6-5.9 rơi vào khoảng trống.
  - Hybrid grading weighted average (`ai*0.4 + human*0.6`) có thể tạo scores không ở bước 0.5 (vd: 5.8).
  - Fix: Sau khi tính weighted average, **round to nearest 0.5** trước khi derive band. Đảm bảo mọi score cuối cùng đều ở bước 0.5.

- [ ] **0.5** Listening question granularity mơ hồ — `20-domain/vstep-exam-format.md` §3
  - Spec: "1 question = 1 part or 1 audio set" — hai cách hiểu rất khác nhau.
  - Part 1: 8 announcements (mỗi cái 1 MCQ). Part 2: 3 conversations (mỗi cái 4 MCQ). Part 3: 3 lectures (mỗi cái 5 MCQ).
  - Fix: Định nghĩa rõ: **1 question record = 1 audio set + N items MCQ** (tương tự reading: 1 passage + N items).
    - Part 1: 8 question records (mỗi record = 1 announcement + 1 item)
    - Part 2: 3 question records (mỗi record = 1 conversation + 4 items)
    - Part 3: 3 question records (mỗi record = 1 lecture + 5 items)
    - Tổng: 14 question records, 35 items.

- [ ] **0.6** Writing combined scoring undefined cho practice mode — `20-domain/vstep-exam-format.md`
  - Exam mode: `writing_score = task1 * (1/3) + task2 * (2/3)`. Rõ ràng.
  - Practice mode: Learner nộp từng task riêng. Không có combined score.
  - Fix: Clarify — practice mode scoring là per-task (0-10). Combined score chỉ tính trong exam session.

### Over-engineering / Contradictions

- [ ] **0.7** `RETRYING`/`ERROR` states trong Main DB là state Grading Service — `20-domain/submission-lifecycle.md`
  - Spec ownership table xác nhận: ERROR → RETRYING chỉ xảy ra trong Grading DB.
  - Main App không bao giờ set `error` hay `retrying` trực tiếp.
  - Main App chỉ cần: `pending → queued → processing → completed | review_pending | failed`.
  - Fix: Giữ `error`/`retrying` trong enum (grading callback có thể report), nhưng document rõ: Main App chỉ write subset states. Loại bỏ chúng khỏi state machine diagram của Main App.

- [ ] **0.8** `DELAYED` state không tồn tại — `40-platform/reliability.md`
  - Không có trong `submissionStatusEnum`. Trigger ("queue depth > 1000") cần monitor RabbitMQ — phức tạp.
  - Fix: Xóa khỏi spec. Nếu cần thông báo "system busy", dùng HTTP 503 + Retry-After, không cần DB state.

- [ ] **0.9** Confidence formula quá phức tạp — `20-domain/hybrid-grading.md` §6
  - Model Consistency (chạy LLM **3 lần**): 3× cost + latency, stddev 3 samples không đáng tin.
  - Content Similarity: cần template DB + cosine similarity — project ML riêng.
  - Fix: Simplify cho MVP:
    - Phase 1: `confidence = rule_validation_score` (word count, format, rubric coverage). Đơn giản, deterministic.
    - Phase 2 (future): Thêm model consistency khi budget cho phép.
    - Bỏ Content Similarity (detect copy qua plagiarism check riêng nếu cần).

- [ ] **0.10** Device warning/confirmation flow — `40-platform/authentication.md`
  - Spec yêu cầu 2-step: warning → confirm → revoke. Code đã implement silent FIFO revoke (đúng hơn).
  - Fix: Sửa spec theo code — silent FIFO revoke, bỏ `confirm-device-revoke` endpoint.

- [ ] **0.11** Redis vừa optional vừa required
  - `env.ts`: `REDIS_URL` optional. Nhưng rate limiting, SSE scaling, review locks, circuit breaker đều cần Redis.
  - Fix: Sửa spec — Redis optional cho **development** (graceful degradation), required cho **production**.
  - `env.ts`: Giữ optional nhưng log warning khi missing ở production mode.

- [ ] **0.12** SSE token expiry during long connection — `10-contracts/sse.md`
  - JWT access token expire 15min. Writing SLA 20min, Speaking SLA 60min. Connection sẽ có expired token.
  - Fix: SSE endpoint validate token **1 lần khi connect**. Sau đó trust connection (server-side). Client reconnect sẽ dùng fresh token.
  - Document: SSE connection lifetime bounded by server (max 30min per spec), không cần re-validate.

- [ ] **0.13** Review claim: Redis lock vs DB column — `20-domain/review-workflow.md`
  - Spec dùng cả Redis distributed lock (TTL 15min) VÀ DB `claimedBy`/`claimedAt`. Hai state sources → inconsistency.
  - Capstone project: single instance, 1-2 instructors.
  - Fix: Chỉ dùng DB columns (`claimedBy`, `claimedAt`) + application-level check. Bỏ Redis lock. Thêm stale claim timeout (15min) tính từ `claimedAt`.

- [ ] **0.14** `auditFlag` type conflict — `20-domain/hybrid-grading.md`
  - Spec ghi vừa boolean vừa string (`SPOT_CHECK`). Schema là boolean.
  - Fix: Giữ boolean. Spot-check tracking qua separate audit log nếu cần, không overload boolean.

### Gaps cần bổ sung

- [ ] **0.15** Không có `CANCELLED` state — `20-domain/submission-lifecycle.md`
  - Learner không thể hủy submission đang chờ grading.
  - Fix: Thêm `cancelled` vào enum. Transitions: `pending → cancelled`, `queued → cancelled`. Không cancel khi đã `processing`.

- [ ] **0.16** `REVIEW_PENDING` không có timeout — `20-domain/submission-lifecycle.md`
  - Nếu instructor không review → stuck vĩnh viễn.
  - Fix: Thêm review SLA (vd: 7 ngày). Sau deadline: auto-accept AI score hoặc escalate to admin.

- [ ] **0.17** `attempt` field trong queue contract mơ hồ — `10-contracts/queue-contracts.md`
  - Không rõ: retry count hay user resubmission count?
  - Fix: Clarify — `attempt` = số lần **user submit** (manual resubmission). Retry nội bộ grading service dùng `retryCount` riêng trong Grading DB.

- [ ] **0.18** Outbox stale lock recovery — `40-platform/reliability.md`
  - Worker crash → outbox entries stuck `processing` vĩnh viễn.
  - Fix: Thêm stale lock timeout. Relay query: `status = 'pending' OR (status = 'processing' AND lockedAt < now() - interval '5 minutes')`.

- [ ] **0.19** Speaking audio upload không có spec — cross-cutting gap
  - `queue-contracts.md` yêu cầu `audioUrl` nhưng không spec nào define file upload infrastructure.
  - Fix: Thêm spec cho file upload — endpoint, storage (local/S3), size limit, format validation, cleanup policy.
  - **Note**: Implementation thuộc future work, nhưng spec cần tồn tại để các spec khác reference.

- [ ] **0.20** Scoring: linear formula vs conversion table — `20-domain/progress-tracking.md` §5.2
  - Code dùng `(correct / total) * 10` (linear). VSTEP docs có conversion table (non-linear).
  - Fix: Clarify — dùng **linear formula** cho practice (đơn giản, transparent). Full VSTEP conversion table chỉ dùng cho official mock exam scoring nếu cần.

---

## Phase 1: Fix Bugs & Security (CRITICAL)

- [x] **1.1** Race condition `UserService.create()` — `src/modules/users/service.ts:87-94`
  - Check-then-insert (TOCTOU). Bỏ `findFirst`, catch PostgreSQL `23505`.

- [x] **1.2** Auth bypass `GET /questions/:id/versions/:versionId` — `src/modules/questions/index.ts:145-163`
  - Endpoint không có auth → ai cũng xem được `answerKey`. Thêm `role: "instructor"`.

- [x] **1.3** Response schema mismatch — Questions `.returning()` — `src/modules/questions/service.ts`
  - `create()` line 132, `update()` line 206, `restore()` line 367: `.returning()` trả toàn bộ row (bao gồm `answerKey`, `deletedAt`) ngoài response schema → TypeBox reject hoặc leak answer key.
  - Fix: `.returning(QUESTION_PUBLIC_COLUMNS)` cho cả 3 methods.

- [x] **1.4** `scoreToBand()` logic — `src/modules/submissions/service.ts:21-26`
  - **VSTEP.3-5 chỉ đánh giá B1-C1**. A1/A2 là cấp độ VSTEP.1-2, không dùng cho scoring.
  - Hiện tại: ≥8.5→C1, ≥6→B2, ≥4→B1, else→null. Logic đúng hướng nhưng thiếu xử lý edge.
  - Fix: Giữ null cho <4.0 (= below B1). KHÔNG map sang A1/A2. Validate score ≥0.

- [x] **1.5** Spider chart math bug — `src/modules/progress/service.ts:148`
  - `(Math.round(avg * 10) / 10) * 10` tạo scale 0-100, mọi nơi khác 0-10. Bỏ `* 10`.

- [x] **1.6** Admin không force-complete submission — `src/modules/submissions/service.ts:208-209`
  - `validateTransition()` chạy cho cả admin. Fix: admin bypass.

- [x] **1.7** `submitExam()` N+1 inserts — `src/modules/exams/service.ts:462-481`
  - Loop `createSubmissionForExam()` → 3 INSERTs/answer.
  - Fix: batch `.values([...])` cho mỗi table.

- [x] **1.8** Unbounded array `AnswerSaveBody` — `src/modules/exams/model.ts:50-57`
  - `t.Array()` không `maxItems`. Fix: `{ maxItems: 200 }`.

- [x] **1.9** Score thiếu bounds — `src/modules/submissions/model.ts:44-48`
  - Fix: `t.Number({ minimum: 0, maximum: 10 })`.

- [x] **1.10** Feedback string không giới hạn — `src/modules/submissions/model.ts:47` + `src/db/schema/submissions.ts:115`
  - Fix: Schema `varchar("feedback", { length: 10000 })`, model `t.String({ maxLength: 10000 })`.

- [x] **1.11** `app.ts` gọi `.listen()` ở module scope — `src/app.ts:64`
  - Fix: tách `.listen()` vào `src/index.ts`.

- [x] **1.12** `env.JWT_SECRET!` non-null assertion — `src/plugins/auth.ts:44`, `src/modules/auth/service.ts:12`
  - Fix: bỏ `skipValidation` hoặc runtime check + throw.

- [x] **1.13** `saveAnswers()` N+1 upserts — `src/modules/exams/service.ts:330-340`
  - Batch validation đã làm. Chỉ còn loop upsert. Fix: batch upsert 1 statement.

- [x] **1.14** `updatePassword()` không transaction — `src/modules/users/service.ts:203-241`
  - Fix: wrap `db.transaction()`.

- [x] **1.15** `SubmissionService.create()` validate ngoài tx — `src/modules/submissions/service.ts:131-170`
  - Fix: di chuyển question validation vào tx.

- [x] **1.16** `startSession()` validate ngoài tx — `src/modules/exams/service.ts:160-196`
  - Fix: di chuyển exam validation vào tx.

- [x] **1.17** Questions list `format` query dùng `t.String()` — `src/modules/questions/index.ts:27`
  - Fix: `t.Optional(QuestionFormat)`.

---

## Phase 2: JSONB Validation — Input Layer (HIGH)

Thay `t.Any()` bằng TypeBox schemas cụ thể, validate ở HTTP request layer.

> **VSTEP.3-5 format**: Reading = MCQ only (4 passages, 40 câu A-D).
> Listening = MCQ only (3 parts, 35 câu A-D). Writing = 2 tasks. Speaking = 3 parts.
>
> **Enum `questionFormatEnum`** có `reading_tng`, `reading_matching_headings`,
> `reading_gap_fill`, `listening_dictation` — IELTS formats, **không tồn tại trong VSTEP**.
> Giữ enum cho extensibility, document rõ.

- [ ] **2.1** Question Content Schemas — tạo `src/modules/questions/content-schemas.ts`
  - **reading_mcq**: `{ passage: string, title?: string, items: [{ number, prompt, options: {A,B,C,D} }] }`
  - **listening_mcq**: `{ audioUrl: string, transcript?: string, scaffolding?: { keywords?, slowAudioUrl? }, items: [{ number, prompt, options }] }`
  - **writing_task_1**: `{ taskNumber: 1, prompt, instructions?, minWords?(120), imageUrls? }`
  - **writing_task_2**: `{ taskNumber: 2, prompt, instructions?, minWords?(250), imageUrls? }`
  - **speaking_part_1**: `{ partNumber: 1, prompt, instructions?, speakingSeconds? }`
  - **speaking_part_2**: `{ partNumber: 2, prompt, instructions?, options: string[3], preparationSeconds?, speakingSeconds? }`
  - **speaking_part_3**: `{ partNumber: 3, prompt, instructions?, followUpQuestions?, preparationSeconds?, speakingSeconds? }`

- [ ] **2.2** Answer Key Schema
  - Reading/Listening: `{ correctAnswers: Record<string, string> }`
  - Writing/Speaking: `null`

- [ ] **2.3** User Answer Schema
  - Reading/Listening: `{ answers: Record<string, string> }`
  - Writing: `{ text: string }`
  - Speaking: `{ audioUrl: string, durationSeconds: number, transcript?: string }`

- [ ] **2.4** Blueprint Schema (Exam)
  - Typed schema cho `exams.blueprint` JSONB (listening/reading/writing/speaking sections + duration).

- [ ] **2.5** Apply schemas vào routes + response
  - Route: `t.Union` discriminated by format. Response: typed JSONB output.

---

## Phase 3: Pattern — Static Class → Plain Functions (HIGH)

- [ ] **3.1** Chuyển 7 service files sang plain functions (`db` as parameter with default)
  - Cập nhật route files import tương ứng.

- [ ] **3.2** Bỏ biome override `noStaticOnlyClass` — `biome.json`

- [ ] **3.3** Bỏ namespace pattern trong model.ts → prefix
  - `AuthModel.LoginBody` → `AuthLoginBody`, etc.

- [ ] **3.4** Export pure functions riêng để test
  - `scoreToBand`, `validateTransition`, `computeTrend`, `parseExpiry`, `hashToken`

---

## Phase 4: DB Schema Cleanup (MEDIUM)

- [ ] **4.1** Thêm indexes thiếu
  - `refreshTokens.expiresAt`, `submissions.skill`, `submissions.questionId`, `questions.createdBy`, `examSessions.examId`

- [ ] **4.2** Xóa index thừa `questions_skill_level_idx` (trùng `questions_active_idx`)

- [ ] **4.3** Cleanup `submissions` columns
  - **Xóa**: `reviewPending` (redundant với status `review_pending`)
  - **Giữ**: `requestId`, `auditFlag`, `isLate`, `confidence`, `reviewPriority`, `reviewerId`, `gradingMode`, `claimedBy`, `claimedAt`, `deadline`

- [ ] **4.4** Fix `examAnswers.isCorrect` — persist khi auto-grade trong `submitExam()`

- [ ] **4.5** Bỏ `$onUpdate` trên `updatedAt` (giữ explicit set trong service)

- [ ] **4.6** Thêm `varchar` length limit: `submissionDetails.feedback` → `{ length: 10000 }`

- [ ] **4.7** Xóa `examSessions.skillScores` JSONB (dead column, redundant với 4 individual score columns)

- [ ] **4.8** `examSessions.overallScore` — tạo helper `calculateOverallScore()` dùng `avg / 4` rounded 0.5

---

## Phase 5: DB Migration (sau Phase 4)

- [ ] **5.1** Generate migration cho tất cả schema changes (Phase 4 + Phase 0 nếu có enum changes)
- [ ] **5.2** Test migration trên fresh DB và existing DB

---

## Phase 6: Unit Tests (MEDIUM)

- [ ] **6.1** Pure function tests (không cần mock DB)
  - `scoreToBand` (0, 3.5, 4, 5.5, 6, 8, 8.5, 10)
  - `validateTransition` (all valid + invalid + admin bypass)
  - `computeTrend` (insufficient_data, stable, improving, declining, inconsistent)
  - `parseExpiry`, `hashToken`
  - `calculateScore` (0/0, 5/10, 35/35)
  - `calculateOverallScore` (partial scores, all 4 scores, rounding)

- [ ] **6.2** Service tests (mock DB via parameter)

---

## Phase 7: Code Cleanup & Docs (LOW)

- [ ] **7.1** Bỏ COLUMN constants trùng lặp → `getTableColumns()` + destructure

- [ ] **7.2** Extract pagination count helper `countWhere()`

- [ ] **7.3** ProgressService thiếu soft-delete filter

- [ ] **7.4** Outbox schema — giữ cho grading service

- [ ] **7.5** Xóa dead error classes: `ValidationError`, `InternalError`

- [ ] **7.6** Remove unused dep `drizzle-typebox`

- [ ] **7.7** `tsconfig.json` — xóa `"jsx": "react-jsx"`, `"allowJs": true`

- [ ] **7.8** `biome.json` — `noConsole` → `"error"`

- [ ] **7.9** `biome.json` — bật lại `noNonNullAssertion` (sau fix 1.12)

- [ ] **7.10** Auth plugin unsafe `user` derive — document hoặc fix type

- [ ] **7.11** `getSpiderChart()` incomplete fields (thiếu `previous`, `target`, `confidence` per spec)

- [ ] **7.12** Update `README.md`

- [ ] **7.13** Xóa `CODEBASE_REVIEW.md`

- [ ] **7.14** Fix `agent.md`

- [ ] **7.15** Fix `CLAUDE.md` — sai table/enum counts, stale refs, thiếu password.ts

- [ ] **7.16** `esbuild` vulnerability — update khi patch available

- [ ] **7.17** Document `questionFormatEnum` IELTS values (JSDoc)

---

## Tổng kết

| Phase | Nội dung | Items | Ưu tiên |
|-------|----------|-------|---------|
| **0** | Spec Corrections | 20 | **CRITICAL** |
| **1** | Bugs & Security | 17 | **CRITICAL** |
| **2** | JSONB Validation | 5 | **HIGH** |
| **3** | Pattern (functions + no namespace) | 4 | **HIGH** |
| **4** | DB Schema Cleanup | 8 | **MEDIUM** |
| **5** | DB Migration | 2 | **MEDIUM** |
| **6** | Unit Tests | 2 | **MEDIUM** |
| **7** | Code Cleanup & Docs | 17 | **LOW** |
| | **Tổng** | **75** | |

### Spec features chưa implement (future work, KHÔNG thuộc plan này)

- SSE real-time grading updates (`10-contracts/sse.md`)
- RabbitMQ integration + outbox relay (`10-contracts/queue-contracts.md`)
- Idempotency-Key header (`40-platform/idempotency-concurrency.md`)
- Rate limiting with Redis (`40-platform/rate-limiting.md`)
- Admin review queue endpoints (`20-domain/review-workflow.md`)
- Goals CRUD endpoints
- Adaptive scaffolding logic (`20-domain/adaptive-scaffolding.md`)
- Exam time limit enforcement
- Circuit breaker + timeout scheduler (`40-platform/reliability.md`)
- User deletion/anonymization (`50-ops/data-retention-privacy.md`)
- File upload infrastructure for speaking audio
