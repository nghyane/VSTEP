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

### 2.2 refresh_tokens

Lưu refresh token dạng hash (SHA-256) để hỗ trợ revoke và audit. Mỗi user tối đa 3 active refresh tokens (FIFO — token cũ nhất bị revoke khi tạo token mới). Mỗi token có `jti` (JWT ID) duy nhất để hỗ trợ rotation detection: nếu token đã bị rotate (`replaced_by_jti != null`) mà vẫn được dùng lại → revoke toàn bộ token family của user (force re-login).

Chi tiết: xem `../40-platform/authentication.md`

### 2.3 submissions

Bản ghi submission của learner. **Source of truth cho submission status** phía Main App.

Mỗi submission gắn với một user, một question, và một skill (writing/speaking/listening/reading). Chỉ writing và speaking đi qua grading queue; listening/reading được auto-grade ngay bởi Main App (so sánh answer_key).

Trạng thái submission đi qua state machine: PENDING → QUEUED → PROCESSING → ANALYZING → GRADING → COMPLETED (hoặc ERROR/RETRYING/FAILED). Chi tiết: xem `../20-domain/submission-lifecycle.md`.

Writing/Speaking có thể đi qua trạng thái `REVIEW_REQUIRED` khi `confidenceScore < 85` (xem `../20-domain/hybrid-grading.md`).

Khi submission được tạo, Main App đồng thời tạo một outbox entry trong cùng transaction để đảm bảo reliable publishing.

Trường `is_late` đánh dấu submissions mà grading callback đến sau SLA timeout — kết quả được lưu nhưng không tính vào progress.

**Quan hệ**: Một submission thuộc một user và một question. SLA deadline được tính từ thời điểm tạo (writing: +20 phút, speaking: +60 phút).

### 2.4 outbox

Outbox pattern cho reliable message publishing sang RabbitMQ. Mỗi entry là một message chờ được publish. Outbox relay worker poll table này mỗi 5 giây, lấy batch (max 50) entries có status PENDING, publish sang queue, rồi update status thành PUBLISHED.

Chi tiết outbox pattern: xem `../40-platform/reliability.md`.

### 2.5 processed_callbacks

Bảng idempotency cho AMQP callbacks. Vì callback có thể gồm nhiều progress events và có thể duplicate delivery, Main App phải dedup **theo từng callback message**.

Dedup key: `event_id` (UUID) từ message `grading.callback` schema v2.

Tối thiểu nên lưu:

- `event_id` (PK)
- `request_id`
- `submission_id`
- `processed_at`

Records cũ hơn 7 ngày được cleanup bởi scheduled job.

### 2.6 submission_events

Event log tối giản theo submission để phục vụ:

- SSE replay khi client reconnect với `Last-Event-ID`
- Audit trail (tiến trình grading, completed/failed)

Mỗi event phải có một ID ổn định:

- Với schema v2: dùng `eventId` từ `grading.callback`
- Với schema v1 (không có eventId): Main App tự sinh `eventId` và ghi nhận mapping

Tối thiểu nên lưu:

- `event_id` (PK)
- `submission_id`
- `request_id` (nullable cho events không thuộc grading)
- `kind` (progress/completed/error)
- `event_at`
- `data` (JSONB)
- `created_at`

Retention: lưu tối thiểu 7 ngày, cleanup bằng scheduled job.

### 2.7 questions

Ngân hàng câu hỏi. Mỗi câu hỏi thuộc một skill (writing/speaking/listening/reading), một level (A1-C1), và một type (essay, email, mcq, fill_blank, dictation, v.v.).

Nội dung câu hỏi lưu dạng JSONB linh hoạt để hỗ trợ nhiều loại: text, audio URL (listening), images. Câu hỏi writing/speaking có rubric chấm điểm. Câu hỏi listening/reading có answer_key.

Câu hỏi có thể soft-delete (is_active = false). Admin và instructor có quyền tạo/sửa câu hỏi.

### 2.8 user_progress

Tracking tiến độ học tập theo từng skill. Mỗi user có đúng **1 record per skill** (unique constraint).

Bao gồm: level hiện tại, level mục tiêu, scaffold stage (1=Template, 2=Keywords, 3=Free), mảng scores gần đây (sliding window cho adaptive algorithm), tổng số lần làm bài, điểm trung bình.

Scaffold stage quyết định mức độ hỗ trợ trong practice mode. Chi tiết: xem `../20-domain/adaptive-scaffolding.md`.

### 2.9 user_goals

Mục tiêu học tập của learner. Lưu target level (A1-C1) và deadline dự kiến. Dùng để tính learning path recommendations và hiển thị progress dashboard.

### 2.10 mock_tests

Cấu hình bài thi thử. Mỗi mock test gồm 4 sections (listening, reading, writing, speaking) với danh sách question IDs và time limits cho mỗi section. Admin tạo và quản lý.

### 2.11 mock_test_sessions

Session khi learner làm mock test. Lưu trạng thái (IN_PROGRESS → SUBMITTED → SCORED), answers cho listening/reading (JSONB), và mapping tới submission IDs cho writing/speaking (vì writing/speaking đi qua grading queue riêng).

---

## 3. Grading Database

### 3.1 grading_jobs

Job state cho grading service. **Source of truth cho grading results** phía Grading Service.

Mỗi job được tạo khi grading worker consume message từ `grading.request` queue. `request_id` (UUID từ queue message) là unique key cho idempotency — nếu nhận duplicate message, skip.

Status riêng của grading service: PENDING → PROCESSING → ANALYZING → GRADING → COMPLETED/ERROR.

### 3.2 grading_results

Kết quả chấm điểm chi tiết. One-to-one với grading_job.

Bao gồm: overall score (0-10), VSTEP band (A1-C1), confidence score (0-100), điểm theo từng tiêu chí (JSONB), feedback chi tiết, gợi ý cải thiện, raw AI response (để audit), và kết quả human review nếu có.

Confidence score quyết định routing: >= 85% → auto-grade, < 85% → human review queue. Chi tiết: xem `../20-domain/hybrid-grading.md`.

### 3.3 grading_errors

Log lỗi cho failed jobs. Mỗi error record ghi nhận loại lỗi (LLM_TIMEOUT, STT_FAIL, INVALID_INPUT, v.v.), số lần retry, và liệu lỗi có retryable hay không.

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
