# Database Schema Specification

> **Phiên bản**: 1.2 · SP26SE145

## 1. Tổng quan

Hệ thống sử dụng **2 PostgreSQL database tách biệt** và **Redis** làm cache layer:

- **Main DB**: Quản lý bởi Main App — users, submissions, progress, questions, mock tests
- **Grading DB**: Quản lý bởi Grading Service — grading jobs, results, errors
- **Redis** (`redis:6379`): Rate limiting, submission status cache, circuit breaker state

**Nguyên tắc quan trọng**: Không có cross-service writes. Main App chỉ ghi vào Main DB. Grading Service chỉ ghi vào Grading DB. Hai service giao tiếp qua AMQP message queue (xem `../10-contracts/queue-contracts.md`).

---

## 2. Main Database

### 2.1 users

Quản lý tài khoản và authentication. Mỗi user có một role duy nhất (learner, instructor, admin). Email là unique identifier cho đăng nhập. Password lưu dạng bcrypt hash.

**Quan hệ**: Một user có nhiều submissions, nhiều refresh_tokens (max 3 active), một user_progress per skill, nhiều user_goals.

**Soft Deletes**: Sử dụng `deleted_at` để hỗ trợ soft delete, cho phép khôi phục dữ liệu và duy trì referential integrity.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `role` (learner/instructor/admin)
- `created_at`, `updated_at`
- `deleted_at` (TIMESTAMP, nullable) - **Soft delete**

### 2.2 refresh_tokens

Lưu refresh token dạng hash (SHA-256) để hỗ trợ revoke và audit. Mỗi user tối đa 3 active refresh tokens (FIFO — token cũ nhất bị revoke khi tạo token mới). Mỗi token có `jti` (JWT ID) duy nhất để hỗ trợ rotation detection: nếu token đã bị rotate (`replaced_by_jti != null`) mà vẫn được dùng lại → revoke toàn bộ token family của user (force re-login).

Chi tiết: xem `../40-platform/authentication.md`

MVP columns (gợi ý):

- `id` (UUID, PK)
- `user_id` (FK users)
- `token_hash` (SHA-256)
- `jti` (unique)
- `created_at`, `expires_at`
- `replaced_by_jti` (nullable)
- `revoked_at` (nullable)
- `device_info` (TEXT/JSONB, nullable) - Lưu thông tin User-Agent/IP để hiển thị trên UI quản lý thiết bị.

Indexes (gợi ý):

- unique `(jti)` cho rotation detection
- `idx_refresh_tokens_active` (`user_id`, `created_at`) WHERE `revoked_at IS NULL` - **Performance**: Tối ưu truy vấn active tokens cho authentication và token revocation.

### 2.3 submissions

Bản ghi submission của learner. **Source of truth cho submission status** phía Main App.

**Tối ưu hóa**: Tách nội dung nặng (`answer`, `result`) sang bảng `submission_details` để tăng tốc độ query danh sách và giảm I/O.

Mỗi submission gắn với một user, một question, và một skill (writing/speaking/listening/reading). Chỉ writing và speaking đi qua grading queue; listening/reading được auto-grade ngay bởi Main App (so sánh answer_key).

Trạng thái submission đi qua state machine: PENDING → QUEUED → PROCESSING → ANALYZING → GRADING → COMPLETED (hoặc ERROR/RETRYING/FAILED). Chi tiết: xem `../20-domain/submission-lifecycle.md`.

Writing/Speaking có thể đi qua trạng thái `REVIEW_REQUIRED` khi `confidenceScore < 85` (xem `../20-domain/hybrid-grading.md`).

Khi submission được tạo, Main App đồng thời tạo một outbox entry trong cùng transaction để đảm bảo reliable publishing.

Trường `is_late` đánh dấu submissions mà grading callback đến sau SLA timeout — kết quả được lưu nhưng không tính vào progress.

**Quan hệ**: Một submission thuộc một user và một question. SLA deadline được tính từ thời điểm tạo (writing: +20 phút, speaking: +60 phút).

MVP columns (gợi ý):

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `question_id` (FK questions, ON DELETE RESTRICT)
- `skill` (listening/reading/writing/speaking)
- `status` (state machine)
- `attempt` (int, default 1)
- `request_id` (UUID, nullable; dùng cho writing/speaking queue)
- `deadline_at` (nullable)
- `score` (numeric, nullable; 0..10) CHECK (score IS NULL OR (score >= 0 AND score <= 10))
- `band` (A1/A2/B1/B2/C1, nullable)
- `confidence_score` (int, nullable)
- `review_required` (bool, default false)
- `is_late` (bool, default false)
- `created_at`, `updated_at`
- `deleted_at` (TIMESTAMP, nullable) - **Soft delete**

**Review Workflow & Hybrid Grading Support:**
- `review_priority` (ENUM: LOW, MEDIUM, HIGH, CRITICAL, nullable) - Dùng để sắp xếp hàng đợi review.
- `reviewer_id` (UUID, nullable, FK users ON DELETE SET NULL) - ID của Instructor chấm/duyệt bài.
- `grading_mode` (ENUM: AUTO, HUMAN, HYBRID, nullable) - Ghi nhận phương thức chấm cuối cùng.
- `audit_flag` (bool, default false) - Đánh dấu bài cần kiểm tra lại (gian lận, bất thường).
- `claimed_by` (UUID, nullable, FK users ON DELETE SET NULL) - ID người đang giữ lock chấm bài (Backup cho Redis).
- `claimed_at` (TIMESTAMP, nullable) - Thời điểm claim lock.


Indexes (tối ưu — giảm write overhead trên high-write table):

```sql
-- Giữ: Essential cho user history (learner xem lịch sử)
CREATE INDEX idx_submissions_user_history
ON submissions (user_id, skill, created_at DESC)
WHERE deleted_at IS NULL;

-- Giữ: Unique constraint = index, required cho idempotency
ALTER TABLE submissions ADD CONSTRAINT unique_request_id UNIQUE (request_id);

-- Tối ưu: Chuyển sang Partial Index — chỉ index các status đang active
-- (thay vì index toàn bộ status, giảm ~25% write overhead)
CREATE INDEX idx_submissions_active_queue
ON submissions (status, created_at)
WHERE status IN ('PENDING', 'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'ERROR');

-- Đã xóa: (review_priority, created_at) — review queue volume thấp (instructor-facing),
-- sort in-memory đủ nhanh, không worth write overhead trên mỗi submission insert.
```

**Security - Row Level Security (RLS) + Secure Views (Defense-in-Depth):**

Sử dụng **2 lớp bảo vệ** để tránh data leak:

1. **Secure Views** (primary enforcement): App queries đi qua views có built-in user filter → single point of enforcement, không thể drift giữa các bảng.
2. **RLS policies** (safety net): Giữ trên `submissions` và `submission_details` — phòng trường hợp developer viết raw query bypass view (debug, admin tool, migration script).

```sql
-- Secure View: Single enforcement point cho submission data
-- App set user context trước mỗi request: SET app.current_user_id = 'uuid';
CREATE VIEW user_submissions AS
SELECT s.*, sd.answer, sd.result, sd.feedback
FROM submissions s
LEFT JOIN submission_details sd ON s.id = sd.submission_id
WHERE s.user_id = current_setting('app.current_user_id')::UUID
  AND s.deleted_at IS NULL;
```

RLS policies (giữ làm safety net):
- `submissions_select`: User chỉ có thể SELECT rows với `user_id = auth.uid()`
- `submissions_insert`: User chỉ có thể INSERT với `user_id = auth.uid()`
- `submissions_update`: User chỉ có thể UPDATE rows của chính họ

> **Lưu ý**: `user_progress`, `user_goals`, `user_skill_scores` **không cần RLS** — các bảng này luôn được query bằng `user_id` trong WHERE clause ở application layer, và không chứa dữ liệu nhạy cảm cần bảo vệ ở DB level.

### 2.3.1 submission_details (New)

Lưu trữ nội dung chi tiết của bài thi để giảm tải cho bảng chính `submissions`.

- `submission_id` (FK submissions, PK)
- `answer` (JSONB) - Bài làm của thí sinh
- `result` (JSONB, nullable) - Kết quả chi tiết từ AI/Human
- `feedback` (TEXT, nullable) - Nhận xét chi tiết

**Security - Row Level Security (RLS):** Áp dụng RLS tương tự `submissions` làm safety net. Tuy nhiên, **primary access control** thông qua `user_submissions` view (xem trên). Tạo foreign key constraint với `ON DELETE CASCADE`.

> **⚠️ MITIGATED RISK:** RLS drift giữa `submissions` và `submission_details` đã được giảm thiểu nhờ Secure View pattern — view `user_submissions` JOIN 2 bảng với 1 filter duy nhất tại `s.user_id`. Tuy nhiên, khi thêm RLS policy mới cho `submissions`, vẫn nên áp dụng tương tự cho `submission_details` (defense-in-depth).

### 2.4 outbox

Outbox pattern cho reliable message publishing sang RabbitMQ. Mỗi entry là một message chờ được publish. Outbox relay worker poll table này mỗi 1-2 giây, sử dụng `FOR UPDATE SKIP LOCKED` để lấy batch (max 50) entries, đảm bảo nhiều worker instance không tranh chấp cùng một row.

Chi tiết outbox pattern: xem `../40-platform/reliability.md`.

**Concurrency Control**: Khi chạy nhiều outbox relay workers, mỗi worker sử dụng `SELECT ... FOR UPDATE SKIP LOCKED` để claim batch riêng biệt. Nếu worker crash giữa chừng, entries có `locked_at` quá 5 phút sẽ tự động được release (timeout-based recovery).

MVP columns (gợi ý):

- `id` (UUID, PK)
- `submission_id` (FK submissions, ON DELETE CASCADE)
- `aggregate_type` (e.g. submission)
- `aggregate_id` (submissionId)
- `message_type` (grading.request)
- `payload` (JSONB)
- `status` (PENDING/PROCESSING/PUBLISHED/FAILED)
- `attempts` (int)
- `locked_at` (TIMESTAMP, nullable) - Thời điểm worker claim entry.
- `locked_by` (VARCHAR(64), nullable) - ID của worker đang xử lý.
- `created_at`, `published_at` (nullable)

**Worker Query Pattern** (tránh race condition giữa nhiều workers):
```sql
-- Mỗi worker claim batch riêng biệt, không tranh chấp
WITH next_batch AS (
    SELECT id
    FROM outbox
    WHERE status = 'PENDING'
      AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '5 minutes')
    ORDER BY created_at
    LIMIT 50
    FOR UPDATE SKIP LOCKED
)
UPDATE outbox
SET status = 'PROCESSING', locked_at = NOW(), locked_by = $worker_id
WHERE id IN (SELECT id FROM next_batch)
RETURNING *;
```

**Tối ưu hóa Index**: Sử dụng Partial Index để worker tìm job cực nhanh.
```sql
CREATE INDEX idx_outbox_pending ON outbox (created_at) WHERE status = 'PENDING';
```

### 2.5 processed_callbacks

Bảng idempotency cho AMQP callbacks. Vì callback có thể gồm nhiều progress events và có thể duplicate delivery, Main App phải dedup **theo từng callback message**.

Dedup key: `event_id` (UUID) từ message `grading.callback`.

Tối thiểu nên lưu:

- `event_id` (PK)
- `request_id`
- `submission_id`
- `processed_at`

Records cũ hơn 7 ngày được cleanup bởi scheduled job.

Indexes (gợi ý):

- `(request_id)` để trace/debug
- `(submission_id)` để join nhanh

### 2.6 submission_events

Event log tối giản theo submission để phục vụ:

- SSE replay khi client reconnect với `Last-Event-ID`
- Audit trail (tiến trình grading, completed/failed)


Mỗi event phải có một ID ổn định: ưu tiên dùng `eventId` từ `grading.callback`. Nếu event không đến từ grading callback thì Main App tự sinh `eventId`.

Tối thiểu nên lưu:

- `event_id` (PK)
- `submission_id`
- `request_id` (nullable cho events không thuộc grading)
- `kind` (progress/completed/error)
- `event_at`
- `data` (JSONB)
- `created_at`

Retention: lưu tối thiểu 7 ngày, cleanup bằng scheduled job.

Indexes (gợi ý):

- `(submission_id, event_at desc)` cho replay
- `(request_id)` (nullable) cho trace/debug

### 2.7 questions

Ngân hàng câu hỏi. Mỗi câu hỏi thuộc một skill (writing/speaking/listening/reading), một level (A1-C1), và một **format**.

**Kiến trúc lưu trữ**: Sử dụng **JSONB + Functional Indexes**.
- Không tách bảng con (Normalization) để giữ linh hoạt cho cấu trúc đề thi đa dạng.
- Sử dụng **Functional (Expression) Indexes** để đảm bảo hiệu năng query cao (O(log n)) cho các trường hợp lọc theo Scaffolding (Template, Keywords...).

MVP columns (gợi ý):

- `id` (UUID, PK)
- `skill` (listening/reading/writing/speaking)
- `level` (A1/A2/B1/B2/C1) CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
- `format` (writing_task_1/..., reading_passage, listening_part, speaking_part_1/2/3)
- `content` (JSONB) - Chứa đề bài, scaffolding (template, keywords), media links.
- `answer_key` (JSONB, nullable)
- `search_vector` (tsvector, generated stored) - **Main Search**: Tự động index nội dung text.
- `is_active` (bool)
- `version` (INT, default 1) - **Versioning**: Số version hiện tại của câu hỏi.
- `created_by` (UUID, nullable, FK users ON DELETE SET NULL) - **Audit**: ID của instructor/admin tạo câu hỏi.
- `created_at`, `updated_at`
- `deleted_at` (TIMESTAMP, nullable) - **Soft delete**

**Indexes Quan Trọng (Functional Indexes):**
```sql
-- Index tìm câu hỏi có Template Scaffolding (cho Adaptive Learning)
CREATE INDEX idx_questions_has_template 
ON questions (skill, level) 
WHERE (content -> 'scaffolding' ->> 'template') IS NOT NULL;

-- Index tìm câu hỏi có Keywords Scaffolding
CREATE INDEX idx_questions_has_keywords 
ON questions (skill, level) 
WHERE (content -> 'scaffolding' ->> 'keywords') IS NOT NULL;

-- Full text search
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);
```

**Question Versioning**: Khi câu hỏi được cập nhật (content, answer_key), tạo record mới trong `question_versions` và tăng `version`.

### 2.7.1 question_versions (New)

Lưu trữ snapshot của câu hỏi theo từng version. Hỗ trợ audit trail và rollback khi cần thiết.

- `id` (UUID, PK)
- `question_id` (FK questions, ON DELETE CASCADE)
- `version` (INT, NOT NULL) - Version của câu hỏi
- `content` (JSONB) - Snapshot content tại version này
- `answer_key` (JSONB, nullable) - Snapshot answer_key tại version này
- `created_at` - Thời điểm tạo version

Indexes:

- unique `(question_id, version)` để đảm bảo mỗi version là duy nhất
- `(question_id)` cho việc truy vết lịch sử

### 2.8 user_progress

Tracking tiến độ học tập theo từng skill. Mỗi user có đúng **1 record per skill** (unique constraint).

Bao gồm: level hiện tại, level mục tiêu, scaffold stage (1=Template, 2=Keywords, 3=Free), tổng số lần làm bài.

Scaffold stage quyết định mức độ hỗ trợ trong practice mode. Chi tiết: xem `../20-domain/adaptive-scaffolding.md`.

MVP columns (gợi ý):

- `user_id` (FK users)
- `skill` (PK part)
- `current_level`
- `target_level`
- `scaffold_stage` (1/2/3)
- `attempt_count` (int)
- `streak_count` (int, default 0) - Số lần liên tiếp đạt/không đạt điều kiện Stage Up/Down.
- `streak_direction` (ENUM: UP, DOWN, NEUTRAL) - Hướng của chuỗi streak hiện tại.
- `updated_at`

> **⚠️ Design Decision — Không lưu `avg_score`**: Điểm trung bình là **computed field** được tính từ `user_skill_scores` (sliding window 10 bài gần nhất). Lưu trữ giá trị này trong `user_progress` tạo ra dual source of truth — nếu quên update khi insert score mới sẽ gây data inconsistent. Thay vào đó, tính realtime từ `user_skill_scores` hoặc cache trong Redis (TTL 5 phút).

### 2.8.1 user_skill_scores (New)

Lưu lịch sử điểm số chi tiết để tính toán Sliding Window và Adaptive Learning, thay vì lưu JSON array trong bảng `user_progress`.

- `id` (UUID, PK)
- `user_id` (FK users, **ON DELETE CASCADE**)
- `skill` (listening/reading/writing/speaking)
- `submission_id` (FK submissions, **ON DELETE CASCADE**)
- `score` (numeric)
- `scaffolding_type` (ENUM: TEMPLATE, KEYWORDS, FREE, nullable) - Ghi nhận loại hỗ trợ đã dùng.
- `created_at`

**Performance Index:**
```sql
CREATE INDEX idx_user_skill_scores_window ON user_skill_scores (user_id, skill, created_at DESC);
```

**Logic**: Khi cần tính avg_score cho 10 bài gần nhất:
```sql
SELECT AVG(score) FROM (
  SELECT score FROM user_skill_scores 
  WHERE user_id = ? AND skill = ? 
  ORDER BY created_at DESC LIMIT 10
) sub;
```

### 2.9 user_goals

Mục tiêu học tập của learner. Lưu target level (A1-C1) và deadline dự kiến. Dùng để tính learning path recommendations và hiển thị progress dashboard.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `target_band` (VARCHAR(10), NOT NULL) CHECK (target_band IN ('B1', 'B2', 'C1'))
- `current_estimated_band` (VARCHAR(10), nullable) - Band hiện tại (tính toán từ bài test đầu vào)
- `deadline` (DATE, NOT NULL) - Ngày dự kiến thi
- `daily_study_time_minutes` (INT, DEFAULT 30) - Cam kết học mỗi ngày
- `created_at`, `updated_at`

Indexes (gợi ý):

- `(user_id)` cho việc truy vấn mục tiêu của user

### 2.10 mock_tests

Cấu hình bài thi thử. Mỗi mock test gồm 4 sections (listening, reading, writing, speaking) với danh sách question IDs và time limits cho mỗi section. Admin tạo và quản lý.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `level` (B1/B2/C1)
- `blueprint` (JSONB) (sections + ordered questionIds + time limits)
- `is_active` (bool)
- `created_by` (UUID, nullable, FK users ON DELETE SET NULL) - **Audit**: ID của admin tạo mock test.
- `created_at`, `updated_at`
- `deleted_at` (TIMESTAMP, nullable) - **Soft delete**

### 2.11 mock_test_sessions

Session khi learner làm mock test. Lưu trạng thái (IN_PROGRESS → SUBMITTED → SCORED). Câu trả lời listening/reading được lưu trong bảng `mock_test_session_answers` (normalized). Writing/speaking submissions được liên kết qua junction table `mock_test_session_submissions`.

**Normalization**: Sử dụng junction tables cho **tất cả** loại answers/submissions thay vì JSONB, đảm bảo referential integrity, tối ưu query per-question, và consistent data access pattern.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `mock_test_id` (FK mock_tests, ON DELETE RESTRICT)
- `status` (IN_PROGRESS/SUBMITTED/SCORED)
- `section_scores` (JSONB, nullable)
- `overall_exam_score` (numeric, nullable)
- `started_at`, `submitted_at` (nullable)
- `created_at`, `updated_at`
- `deleted_at` (TIMESTAMP, nullable) - **Soft delete**

**Performance Indexes:**
```sql
CREATE INDEX idx_mock_test_sessions_user_status ON mock_test_sessions (user_id, status, created_at DESC);
```

### 2.11.1 mock_test_session_answers (New)

Lưu câu trả lời listening/reading per-question cho mock test session. Thay thế cho `answers` JSONB trong `mock_test_sessions` để đảm bảo referential integrity và hỗ trợ per-question accuracy analysis.

- `session_id` (FK mock_test_sessions, ON DELETE CASCADE)
- `question_id` (FK questions)
- `answer` (JSONB) - Câu trả lời của learner
- `is_correct` (BOOLEAN, nullable) - Kết quả đánh giá (auto-grade)
- `created_at`

PK: `(session_id, question_id)` — composite primary key.

Indexes:

- `(session_id)` cho việc lấy toàn bộ answers theo session
- `(question_id)` cho việc phân tích per-question accuracy

### 2.11.2 mock_test_session_submissions (New)

Junction table liên kết mock test session với submissions của writing/speaking.

- `id` (UUID, PK)
- `session_id` (FK mock_test_sessions, ON DELETE CASCADE)
- `submission_id` (FK submissions, ON DELETE CASCADE)
- `skill` (writing/speaking) - Phân biệt loại submission
- `created_at`

Indexes:

- unique `(session_id, submission_id)` để tránh duplicate
- `(session_id)` cho việc join với session
- `(submission_id)` cho việc truy vết submission

### 2.12 Partial Indexes for Soft Deletes

Các bảng có sử dụng soft delete (`deleted_at`) nên có partial indexes để tối ưu hóa query trên các records active (chưa bị xóa). Điều này giúp query performance tương đương với hard delete trong khi vẫn giữ được dữ liệu cho audit/rollback.

**Recommended Partial Indexes:**
```sql
-- users table
CREATE INDEX idx_users_active ON users (id) WHERE deleted_at IS NULL;

-- submissions table (đã được tích hợp trong idx_submissions_user_history ở 2.3)
-- Không cần index riêng — idx_submissions_user_history đã có WHERE deleted_at IS NULL

-- questions table
CREATE INDEX idx_questions_active ON questions (skill, level) WHERE deleted_at IS NULL;

-- mock_tests table
CREATE INDEX idx_mock_tests_active ON mock_tests (id) WHERE deleted_at IS NULL;

-- mock_test_sessions table
CREATE INDEX idx_mock_test_sessions_active ON mock_test_sessions (user_id, status, created_at DESC) WHERE deleted_at IS NULL;
```

**Lưu ý**: Partial indexes chỉ include các rows thỏa mãn điều kiện WHERE, giúp:
- Giảm kích thước index
- Tăng tốc độ query trên active records
- Đảm bảo query planner ưu tiên active data

### 2.12.1 Soft Delete Cleanup

Soft deleted records được giữ lại cho mục đích audit và recovery. Hiện tại sử dụng single `deleted_at` timestamp cho tất cả bảng với retention period 30 ngày.

```sql
-- Simple cleanup (current approach):
DELETE FROM {table} WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
```

> **Production Enhancement**: Sau này khi scale, nên differentiate retention per table (submissions: 365 ngày, events: 90 ngày, callbacks: 7 ngày) và implement automated scheduled job.

### 2.13 Production Considerations

> **Lưu ý:** Các tính năng dưới đây được thiết kế nhưng **không implement trong capstone scope**. Document tại đây để thể hiện awareness và phục vụ mở rộng sau này.

#### Partitioning Strategy (Future)

Khi data volume vượt 1M records, các bảng `submission_events` và `processed_callbacks` nên được partition:

- **Loại:** Range Partitioning theo `created_at` (monthly)
- **Lý do chưa implement:** Data volume trong capstone không đủ lớn để justify overhead. Partitioning thêm deployment complexity (partition creation, maintenance) mà không mang lại lợi ích thực tế.
- **Khi nào cần:** Khi single table scan > 100ms hoặc data > 1M rows.

```sql
-- Example (future implementation):
CREATE TABLE submission_events (...) PARTITION BY RANGE (created_at);
CREATE TABLE submission_events_2026_01 PARTITION OF submission_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

#### Data Retention Policy (Future)

Hiện tại sử dụng single soft delete (`deleted_at` timestamp) cho tất cả bảng. Production system cần:

- **Automated cleanup:** Scheduled job xóa soft-deleted records sau 30 ngày
- **Differentiated retention:** Submissions (365 ngày), Events (90 ngày), Callbacks (7 ngày)
- **GDPR compliance:** Hard delete user data khi có request

```sql
-- Simple cleanup (current approach):
DELETE FROM {table} WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
```

---

## 3. Grading Database

### 3.1 grading_jobs

Job state cho grading service. GradingDB (MVP) chỉ cần **một bảng**: job + result + error.

Lý do: đồ án triển khai đồng bộ, ưu tiên đơn giản; không cần tách `grading_results`/`grading_errors`.

Mỗi job được tạo khi grading worker consume message từ `grading.request` queue. `request_id` (UUID từ queue message) là unique key cho idempotency — nếu nhận duplicate message, skip.

Status riêng của grading service: PENDING → PROCESSING → ANALYZING → GRADING → COMPLETED/ERROR.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `request_id` (UUID, unique)
- `submission_id`
- `skill` (writing/speaking)
- `status`
- `attempt` (int)
- `retry_count` (int, default 0) - Số lần retry tự động.
- `worker_id` (string, nullable) - ID của worker xử lý (để debug).
- `result` (JSONB, nullable) (overallScore/band/confidenceScore/criteriaScores/feedback)
- `error` (JSONB, nullable) (type/code/message)
- `error_category` (ENUM: NETWORK, RATE_LIMIT, SCHEMA, TIMEOUT, UNKNOWN, nullable) - Phân loại lỗi cho DLQ logic.
- `created_at`, `updated_at`

Gợi ý index:

- `(status, created_at)` để theo dõi backlog

### 3.2 grading_job_history (New)

Lưu lịch sử chuyển đổi trạng thái của grading jobs. Hỗ trợ debug pipeline (PENDING → PROCESSING → ANALYZING → GRADING → COMPLETED/ERROR) và phát hiện bottleneck.

- `id` (UUID, PK)
- `job_id` (FK grading_jobs, ON DELETE CASCADE)
- `from_status` (VARCHAR(20)) - Trạng thái trước
- `to_status` (VARCHAR(20)) - Trạng thái sau
- `changed_at` (TIMESTAMP, DEFAULT NOW())
- `changed_by` (VARCHAR(100)) - worker_id hoặc 'system'
- `metadata` (JSONB, nullable) - Context bổ sung (retry reason, error snapshot, duration)

Indexes:

- `(job_id, changed_at DESC)` cho việc trace từng job
- `(to_status, changed_at)` cho dashboard monitoring

**Implementation**: Sử dụng trigger `AFTER UPDATE` trên `grading_jobs.status` để tự động insert history record, đảm bảo không bị miss.

---

## 4. Redis

Redis phục vụ 3 mục đích chính:

- **Rate limiting**: Token bucket state per user/endpoint. Key pattern và chi tiết: xem `../40-platform/rate-limiting.md`
- **Submission status cache**: Cache trạng thái submission hiện tại (TTL 1 giờ) để giảm DB load cho polling fallback
- **Circuit breaker state**: Trạng thái circuit breaker cho external APIs (LLM, STT). Chi tiết: xem `../40-platform/reliability.md`

---

## 5. Database Migration Strategy

Schema thay đổi được quản lý bởi **Drizzle ORM** (`drizzle-kit`) — ORM SQL-first phù hợp cho schema PostgreSQL-heavy này.

### 5.1 Tại sao Drizzle (không phải Prisma)

Schema này sử dụng nhiều PostgreSQL-specific features mà Prisma **không support native**:

| Feature | Prisma | Drizzle |
|---------|--------|---------|
| Partial Index (`WHERE deleted_at IS NULL`) | ❌ Không support | ✅ `sql` helper |
| Functional Index (JSONB path) | ❌ Raw SQL migration | ✅ Support |
| Generated column (`tsvector`) | ❌ Raw SQL | ✅ `sql` helper |
| `FOR UPDATE SKIP LOCKED` | ⚠️ Chỉ qua `$queryRaw` | ✅ Native |
| RLS policies | ❌ Raw SQL | ❌ Raw SQL (cả hai) |
| Range Partitioning | ❌ Không support | ❌ Không support (cả hai) |

> **Kết luận**: Drizzle cover được ~80% schema features. Phần còn lại (RLS, Partitioning, Triggers) cần **custom SQL migrations**.

### 5.2 Migration Workflow

```
drizzle-kit generate → review SQL → drizzle-kit migrate → verify
```

**Conventions:**
- `drizzle-kit generate` tạo migration files từ schema TypeScript changes
- Migration files (`.sql`) được commit vào Git tại `drizzle/migrations/`
- Mọi schema changes phải qua migration — **không chạy ALTER TABLE trực tiếp**
- Custom SQL (RLS, triggers, partitions) được thêm thủ công vào migration files sau khi generate

**Environments:**
| Environment | Migration Mode | Notes |
|------------|---------------|-------|
| Local dev | Auto-run on startup | `drizzle-kit migrate` trong docker-compose |
| Staging | CI/CD pipeline | Chạy trước khi deploy app |
| Production | Manual approval + CI/CD | Review migration trước khi apply |

### 5.3 Custom SQL Migrations (Ngoài Drizzle)

Các features sau **phải** được thêm thủ công vào migration files:

```sql
-- 1. RLS Policies (Drizzle không generate được)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY submissions_select ON submissions FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

-- 2. Secure Views
CREATE VIEW user_submissions AS ...;

-- 3. Partitioning: Documented as future production enhancement (see Section 2.13)

-- 4. Triggers (soft delete cascade, grading_job_history)
CREATE OR REPLACE FUNCTION cascade_soft_delete() RETURNS TRIGGER AS $$ ... $$;

-- 5. CHECK Constraints (Drizzle có thể generate nhưng nên verify)
ALTER TABLE submissions ADD CONSTRAINT check_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 10));
ALTER TABLE questions ADD CONSTRAINT check_cefr_level CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
ALTER TABLE user_goals ADD CONSTRAINT check_target_band CHECK (target_band IN ('B1', 'B2', 'C1'));
```

### 5.4 Migration cho Partitioned Tables

Partitioning cho `processed_callbacks` và `submission_events` được **document as future enhancement** (xem Section 2.13). Hiện tại, các bảng này sử dụng single table với GIN indexes.

---

## 6. Cross-references

| Chủ đề | Tài liệu |
|--------|-----------|
| Submission states | `../20-domain/submission-lifecycle.md` |
| Outbox pattern | `../40-platform/reliability.md` |
| Queue message format | `../10-contracts/queue-contracts.md` |
| Auth & token details | `../40-platform/authentication.md` |
| Rate limiting keys | `../40-platform/rate-limiting.md` |
| Confidence & hybrid grading | `../20-domain/hybrid-grading.md` |
| Adaptive scaffolding | `../20-domain/adaptive-scaffolding.md` |
| Question content shapes | `question-content-schemas.md` |
| Database migration strategy | Section 5 (this document) |
