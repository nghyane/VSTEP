# Database Schema Specification

> **Phiên bản**: 1.0 · SP26SE145

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

MVP columns (gợi ý):

- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `role` (learner/instructor/admin)
- `created_at`, `updated_at`

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
- `user_id` (FK users)
- `question_id` (FK questions)
- `skill` (listening/reading/writing/speaking)
- `status` (state machine)
- `attempt` (int, default 1)
- `request_id` (UUID, nullable; dùng cho writing/speaking queue)
- `deadline_at` (nullable)
- `score` (numeric, nullable; 0..10)
- `band` (A1/A2/B1/B2/C1, nullable)
- `confidence_score` (int, nullable)
- `review_required` (bool, default false)
- `is_late` (bool, default false)
- `created_at`, `updated_at`

Indexes (gợi ý):

- `(user_id, skill, created_at desc)` cho lịch sử
- `(status, created_at)` cho review queue / dashboard
- unique `(request_id)` (nullable) để đảm bảo idempotency cho queue-based grading

### 2.3.1 submission_details (New)

Lưu trữ nội dung chi tiết của bài thi để giảm tải cho bảng chính `submissions`.

- `submission_id` (FK submissions, PK)
- `answer` (JSONB) - Bài làm của thí sinh
- `result` (JSONB, nullable) - Kết quả chi tiết từ AI/Human
- `feedback` (TEXT, nullable) - Nhận xét chi tiết

### 2.4 outbox

Outbox pattern cho reliable message publishing sang RabbitMQ. Mỗi entry là một message chờ được publish. Outbox relay worker poll table này mỗi 5 giây, lấy batch (max 50) entries có status PENDING, publish sang queue, rồi update status thành PUBLISHED.

Chi tiết outbox pattern: xem `../40-platform/reliability.md`.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `aggregate_type` (e.g. submission)
- `aggregate_id` (submissionId)
- `message_type` (grading.request)
- `payload` (JSONB)
- `status` (PENDING/PUBLISHED/FAILED)
- `attempts` (int)
- `created_at`, `published_at` (nullable)

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

**Search Strategy (Practical MVP)**:
- Sử dụng **Postgres Full Text Search** (`tsvector`) kết hợp với **Tags** để tìm kiếm.
- Hiệu năng cao, không phụ thuộc vào AI Model bên ngoài, không tốn chi phí API.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `skill` (listening/reading/writing/speaking)
- `level` (A1/A2/B1/B2/C1)
- `format` (writing_task_1/..., reading_passage, listening_part, speaking_part_1/2/3)
- `content` (JSONB)
- `answer_key` (JSONB, nullable)
- `search_vector` (tsvector, generated stored) - **Main Search**: Tự động index nội dung text.
- `tags` (text[]) - **Filter**: Lọc theo chủ đề (Environment, Tech...).
- `is_active` (bool)
- `created_at`, `updated_at`

Indexes (gợi ý):

- `(skill, level, format, is_active)`
- GIN index trên `search_vector` (Fast text search).
- GIN index trên `tags` (Fast tag filter).

### 2.8 user_progress

Tracking tiến độ học tập theo từng skill. Mỗi user có đúng **1 record per skill** (unique constraint).

Bao gồm: level hiện tại, level mục tiêu, scaffold stage (1=Template, 2=Keywords, 3=Free), tổng số lần làm bài, điểm trung bình.

Scaffold stage quyết định mức độ hỗ trợ trong practice mode. Chi tiết: xem `../20-domain/adaptive-scaffolding.md`.

MVP columns (gợi ý):

- `user_id` (FK users)
- `skill` (PK part)
- `current_level`
- `target_level`
- `scaffold_stage` (1/2/3)
- `attempt_count` (int)
- `avg_score` (numeric)
- `updated_at`

### 2.8.1 user_skill_scores (New)

Lưu lịch sử điểm số chi tiết để tính toán Sliding Window và Adaptive Learning, thay vì lưu JSON array trong bảng `user_progress`.

- `id` (UUID, PK)
- `user_id` (FK users)
- `skill` (listening/reading/writing/speaking)
- `submission_id` (FK submissions)
- `score` (numeric)
- `created_at`

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

### 2.10 mock_tests

Cấu hình bài thi thử. Mỗi mock test gồm 4 sections (listening, reading, writing, speaking) với danh sách question IDs và time limits cho mỗi section. Admin tạo và quản lý.

MVP columns (gợi ý):

- `id` (UUID, PK)
- `level` (B1/B2/C1)
- `blueprint` (JSONB) (sections + ordered questionIds + time limits)
- `is_active` (bool)
- `created_at`, `updated_at`

### 2.11 mock_test_sessions

Session khi learner làm mock test. Lưu trạng thái (IN_PROGRESS → SUBMITTED → SCORED), answers cho listening/reading (JSONB), và mapping tới submission IDs cho writing/speaking (vì writing/speaking đi qua grading queue riêng).

MVP columns (gợi ý):

- `id` (UUID, PK)
- `user_id` (FK users)
- `mock_test_id` (FK mock_tests)
- `status` (IN_PROGRESS/SUBMITTED/SCORED)
- `answers` (JSONB) (listening/reading)
- `submission_ids` (JSONB) (writing/speaking)
- `section_scores` (JSONB, nullable)
- `overall_exam_score` (numeric, nullable)
- `started_at`, `submitted_at` (nullable)
- `created_at`, `updated_at`

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
- `result` (JSONB, nullable) (overallScore/band/confidenceScore/criteriaScores/feedback)
- `error` (JSONB, nullable) (type/code/message/retryable)
- `created_at`, `updated_at`

Gợi ý index:

- `(status, created_at)` để theo dõi backlog

---

## 4. Redis

Redis phục vụ 3 mục đích chính:

- **Rate limiting**: Token bucket state per user/endpoint. Key pattern và chi tiết: xem `../40-platform/rate-limiting.md`
- **Submission status cache**: Cache trạng thái submission hiện tại (TTL 1 giờ) để giảm DB load cho polling fallback
- **Circuit breaker state**: Trạng thái circuit breaker cho external APIs (LLM, STT). Chi tiết: xem `../40-platform/reliability.md`

---

## 5. Cross-references

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
