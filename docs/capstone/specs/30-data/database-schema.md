# Database Schema Specification

> **Phiên bản**: 2.0 · SP26SE145

## 1. Tổng quan

Hệ thống sử dụng **1 PostgreSQL database** (shared-DB) và **Redis** cho cache/queue:

| Component | Quản lý bởi | Mục đích | Connection |
|-----------|-------------|----------|------------|
| **PostgreSQL** | Main App (Bun) + Grading Worker (Python) | All tables | Cả hai service connect cùng DB |
| **Redis** | Main App + arq Worker | Queue, cache, rate limiting | `import { redis } from "bun"` (built-in) |

**Nguyên tắc**:
- **Shared-DB**: Grading worker (Python/arq) đọc job từ Redis queue, gọi LLM/STT, ghi kết quả trực tiếp vào PostgreSQL.
- **Queue**: Redis list (`arq`) thay vì RabbitMQ. Đơn giản, ít moving parts.
- **Hard delete**: Sử dụng `ON DELETE CASCADE` — không có soft delete (`deleted_at`).
- **ORM**: Drizzle ORM (TypeScript schema → PostgreSQL).

---

## 2. Tables

### 2.1 users

Quản lý tài khoản và authentication. Mỗi user có một role duy nhất (learner, instructor, admin). Email là unique identifier cho đăng nhập. Password lưu dạng Argon2id hash (`Bun.password`).

**Quan hệ**: Một user có nhiều submissions, nhiều refresh_tokens (max 3 active), một user_progress per skill, nhiều user_goals.

Columns:

- `id` (UUID, PK)
- `email` (VARCHAR(255), unique)
- `password_hash` (VARCHAR(255))
- `full_name` (VARCHAR(255), nullable)
- `role` (learner/instructor/admin, default learner)
- `created_at`, `updated_at`

FK references pointing to `users` use `ON DELETE CASCADE` (submissions, refresh_tokens, user_progress, user_goals, class_members, instructor_feedback) or `ON DELETE SET NULL` (questions.created_by, exams.created_by, submissions.reviewer_id, submissions.claimed_by).

### 2.2 refresh_tokens

Lưu refresh token dạng hash (SHA-256) để hỗ trợ revoke và audit. Mỗi user tối đa 3 active refresh tokens (FIFO — token cũ nhất bị revoke khi tạo token mới). Mỗi token có `jti` (JWT ID) duy nhất để hỗ trợ rotation detection: nếu token đã bị rotate (`replaced_by_jti != null`) mà vẫn được dùng lại → revoke toàn bộ token family của user (force re-login).

Chi tiết: xem `../40-platform/authentication.md`

Columns:

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `token_hash` (VARCHAR(64))
- `jti` (VARCHAR(36), unique)
- `replaced_by_jti` (VARCHAR(36), nullable)
- `device_info` (TEXT, nullable) - User-Agent/IP cho device management UI
- `revoked_at` (TIMESTAMPTZ, nullable)
- `expires_at` (TIMESTAMPTZ, NOT NULL)
- `created_at`

Indexes:

- unique `(jti)` cho rotation detection
- `(token_hash)` cho lookup
- `(user_id)` cho token management
- `(expires_at)` cho cleanup
- partial `(user_id) WHERE revoked_at IS NULL` cho active token queries

### 2.3 submissions

Bản ghi submission của learner. Mỗi submission gắn với một user, một question, và một skill (writing/speaking/listening/reading).

Chỉ writing và speaking đi qua grading queue (Redis + arq worker); listening/reading được auto-grade ngay bởi Main App (so sánh answer_key).

Trạng thái submission đi qua 5-state machine:

```
pending → processing → completed
                    → review_pending → completed
                    → failed
pending → failed
```

Chi tiết: xem `../20-domain/submission-lifecycle.md`.

Nội dung nặng (`answer`, `result`) tách sang bảng `submission_details` để tăng tốc query danh sách.

Columns:

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `question_id` (FK questions, ON DELETE RESTRICT)
- `skill` (listening/reading/writing/speaking)
- `status` (submission_status enum — 5 values: pending/processing/completed/review_pending/failed)
- `score` (numeric(3,1), nullable; 0..10)
- `band` (vstep_band enum, nullable)
- `review_priority` (review_priority enum — 3 values: low/medium/high, nullable)
- `reviewer_id` (UUID, nullable, FK users ON DELETE SET NULL) - Instructor chấm/duyệt bài
- `grading_mode` (grading_mode enum — 3 values: auto/human/hybrid, nullable)
- `audit_flag` (bool, default false) - Đánh dấu bài cần kiểm tra lại
- `claimed_by` (UUID, nullable, FK users ON DELETE SET NULL) - Người đang giữ lock chấm bài
- `claimed_at` (TIMESTAMPTZ, nullable)
- `created_at`, `updated_at`
- `completed_at` (TIMESTAMPTZ, nullable)

Indexes:

```sql
-- User history (learner xem lịch sử)
CREATE INDEX submissions_user_id_idx ON submissions (user_id);
CREATE INDEX submissions_skill_idx ON submissions (skill);
CREATE INDEX submissions_question_id_idx ON submissions (question_id);
CREATE INDEX submissions_status_idx ON submissions (status);
CREATE INDEX submissions_user_status_idx ON submissions (user_id, status);
CREATE INDEX submissions_user_history_idx ON submissions (user_id, created_at);

-- Review queue (partial — chỉ review_pending)
CREATE INDEX submissions_review_queue_idx ON submissions (status)
  WHERE status = 'review_pending';
```

**Security - Row Level Security (RLS) + Secure Views (Defense-in-Depth):**

Sử dụng **2 lớp bảo vệ** để tránh data leak:

1. **Secure Views** (primary enforcement): App queries đi qua views có built-in user filter.
2. **RLS policies** (safety net): phòng trường hợp developer viết raw query bypass view.

```sql
CREATE VIEW user_submissions AS
SELECT s.*, sd.answer, sd.result, sd.feedback
FROM submissions s
LEFT JOIN submission_details sd ON s.id = sd.submission_id
WHERE s.user_id = current_setting('app.current_user_id')::UUID;
```

RLS policies (safety net):
- `submissions_select`: User chỉ có thể SELECT rows với `user_id = auth.uid()`
- `submissions_insert`: User chỉ có thể INSERT với `user_id = auth.uid()`
- `submissions_update`: User chỉ có thể UPDATE rows của chính họ

### 2.3.1 submission_details

Lưu trữ nội dung chi tiết của bài thi để giảm tải cho bảng chính `submissions`.

- `submission_id` (FK submissions, PK, ON DELETE CASCADE)
- `answer` (JSONB) - Bài làm của thí sinh
- `result` (JSONB, nullable) - Kết quả chi tiết từ AI/Human
- `feedback` (VARCHAR(10000), nullable) - Nhận xét chi tiết
- `created_at`, `updated_at`

### 2.4 questions

Ngân hàng câu hỏi. Mỗi câu hỏi thuộc một skill (writing/speaking/listening/reading), một level (A1-C1), và một **format**.

**Kiến trúc lưu trữ**: Sử dụng **JSONB** cho `content` và `answer_key` — linh hoạt cho cấu trúc đề thi đa dạng.

Columns:

- `id` (UUID, PK)
- `skill` (skill enum)
- `level` (question_level enum: A1/A2/B1/B2/C1)
- `format` (question_format enum)
- `content` (JSONB) - Đề bài, scaffolding, media links
- `answer_key` (JSONB, nullable)
- `version` (INT, default 1)
- `is_active` (bool, default true)
- `created_by` (UUID, nullable, FK users ON DELETE SET NULL)
- `created_at`, `updated_at`

Indexes:

```sql
CREATE INDEX questions_active_idx ON questions (skill, level) WHERE is_active = true;
CREATE INDEX questions_format_idx ON questions (format);
CREATE INDEX questions_created_by_idx ON questions (created_by);
```

### 2.4.1 question_versions

Lưu trữ snapshot của câu hỏi theo từng version. Hỗ trợ audit trail và rollback.

- `id` (UUID, PK)
- `question_id` (FK questions, ON DELETE CASCADE)
- `version` (INT, NOT NULL)
- `content` (JSONB)
- `answer_key` (JSONB, nullable)
- `created_at`

Indexes:

- unique `(question_id, version)`

### 2.5 user_progress

Tracking tiến độ học tập theo từng skill. Mỗi user có đúng **1 record per skill** (unique constraint).

Bao gồm: level hiện tại, level mục tiêu, scaffold level (1=Template, 2=Keywords, 3=Free), tổng số lần làm bài.

Scaffold level quyết định mức độ hỗ trợ trong practice mode. Chi tiết: xem `../20-domain/adaptive-scaffolding.md`.

Columns:

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `skill` (skill enum)
- `current_level` (question_level enum)
- `target_level` (question_level enum, nullable)
- `scaffold_level` (INT, default 1)
- `streak_count` (INT, default 0) - Chuỗi streak liên tiếp
- `streak_direction` (streak_direction enum: up/down/neutral, nullable)
- `attempt_count` (INT, default 0)
- `created_at`, `updated_at`

Indexes:

- unique `(user_id, skill)`

> **Design Decision — Không lưu `avg_score`**: Điểm trung bình là computed field tính từ `user_skill_scores` (sliding window 10 bài gần nhất). Tránh dual source of truth.

### 2.5.1 user_skill_scores

Lưu lịch sử điểm số chi tiết để tính toán Sliding Window và Adaptive Learning.

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `skill` (skill enum)
- `submission_id` (FK submissions, ON DELETE CASCADE, nullable)
- `score` (numeric(3,1))
- `scaffolding_type` (VARCHAR(20), nullable) - Loại hỗ trợ đã dùng
- `created_at`

Index:

```sql
CREATE INDEX user_skill_scores_user_skill_idx ON user_skill_scores (user_id, skill, created_at);
```

### 2.6 user_goals

Mục tiêu học tập của learner.

Columns:

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `target_band` (vstep_band enum, NOT NULL)
- `current_estimated_band` (VARCHAR(10), nullable)
- `deadline` (TIMESTAMPTZ, nullable) - Ngày dự kiến thi
- `daily_study_time_minutes` (INT, default 30)
- `created_at`, `updated_at`

Indexes:

- `(user_id)`

### 2.7 exams

Cấu hình bài thi thử. Mỗi exam gồm 4 sections (listening, reading, writing, speaking) với danh sách question IDs và time limits.

Columns:

- `id` (UUID, PK)
- `level` (question_level enum)
- `blueprint` (JSONB) - Sections + ordered questionIds + time limits
- `is_active` (bool, default true)
- `created_by` (UUID, nullable, FK users ON DELETE SET NULL)
- `created_at`, `updated_at`

Indexes:

```sql
CREATE INDEX exams_level_idx ON exams (level);
CREATE INDEX exams_active_idx ON exams (level) WHERE is_active = true;
```

### 2.8 exam_sessions

Session khi learner làm exam. Câu trả lời listening/reading lưu trong `exam_answers`. Writing/speaking submissions liên kết qua `exam_submissions`.

Columns:

- `id` (UUID, PK)
- `user_id` (FK users, ON DELETE CASCADE)
- `exam_id` (FK exams, ON DELETE RESTRICT)
- `status` (exam_status enum: in_progress/submitted/completed/abandoned)
- `listening_score`, `reading_score`, `writing_score`, `speaking_score` (numeric(3,1), nullable)
- `overall_score` (numeric(3,1), nullable)
- `started_at` (TIMESTAMPTZ, default now)
- `completed_at` (TIMESTAMPTZ, nullable)
- `created_at`, `updated_at`

Indexes:

```sql
CREATE INDEX exam_sessions_user_idx ON exam_sessions (user_id);
CREATE INDEX exam_sessions_exam_id_idx ON exam_sessions (exam_id);
CREATE INDEX exam_sessions_status_idx ON exam_sessions (status);
CREATE INDEX exam_sessions_user_status_idx ON exam_sessions (user_id, status);
```

### 2.8.1 exam_answers

Lưu câu trả lời listening/reading per-question cho exam session.

- `id` (UUID, PK)
- `session_id` (FK exam_sessions, ON DELETE CASCADE)
- `question_id` (FK questions, ON DELETE CASCADE)
- `answer` (JSONB)
- `is_correct` (BOOLEAN, nullable)
- `created_at`, `updated_at`

Indexes:

- unique `(session_id, question_id)`

### 2.8.2 exam_submissions

Junction table liên kết exam session với submissions của writing/speaking.

- `id` (UUID, PK)
- `session_id` (FK exam_sessions, ON DELETE CASCADE)
- `submission_id` (FK submissions, ON DELETE CASCADE)
- `skill` (skill enum)
- `created_at`

Indexes:

- unique `(session_id, submission_id)`
- `(session_id)`
- `(submission_id)`

### 2.9 classes

Quản lý lớp học. Mỗi lớp có một instructor và nhiều learners.

- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT, nullable)
- `instructor_id` (FK users, NOT NULL)
- `invite_code` (TEXT, unique, NOT NULL)
- `created_at`, `updated_at`

### 2.9.1 class_members

- `id` (UUID, PK)
- `class_id` (FK classes, ON DELETE CASCADE)
- `user_id` (FK users, ON DELETE CASCADE)
- `joined_at` (TIMESTAMPTZ, default now)
- `removed_at` (TIMESTAMPTZ, nullable)

Indexes:

- unique `(class_id, user_id)`
- `(user_id)`

### 2.9.2 instructor_feedback

- `id` (UUID, PK)
- `class_id` (FK classes, ON DELETE CASCADE)
- `from_user_id` (FK users, ON DELETE CASCADE)
- `to_user_id` (FK users, ON DELETE CASCADE)
- `content` (TEXT, NOT NULL)
- `skill` (skill enum, nullable)
- `submission_id` (FK submissions, ON DELETE CASCADE, nullable)
- `created_at`

---

## 3. Enums Summary

| Enum | Values |
|------|--------|
| `user_role` | learner, instructor, admin |
| `skill` | listening, reading, writing, speaking |
| `vstep_band` | A1, A2, B1, B2, C1 |
| `submission_status` | pending, processing, completed, review_pending, failed |
| `review_priority` | low, medium, high |
| `grading_mode` | auto, human, hybrid |
| `question_format` | writing_task_1, writing_task_2, speaking_part_1/2/3, reading_mcq, reading_tng, reading_matching_headings, reading_gap_fill, listening_mcq, listening_dictation |
| `question_level` | A1, A2, B1, B2, C1 |
| `exam_status` | in_progress, submitted, completed, abandoned |
| `streak_direction` | up, down, neutral |

---

## 4. Redis

Redis phục vụ 4 mục đích chính (accessed via `import { redis } from "bun"` — built-in, no extra deps):

- **Grading queue**: Redis list consumed by arq worker (Python). Replaces RabbitMQ.
- **Rate limiting**: Token bucket state per user/endpoint.
- **Submission status cache**: Cache trạng thái submission hiện tại (TTL 1h) để giảm DB load cho polling fallback.
- **Review claim locks**: Distributed lock for instructor review claim (`lock:review:{submissionId}` TTL 15 min).

---

## 5. Database Migration Strategy

Schema thay đổi được quản lý bởi **Drizzle ORM** (`drizzle-kit`).

### 5.1 Tại sao Drizzle (không phải Prisma)

Schema này sử dụng nhiều PostgreSQL-specific features mà Prisma không support native:

| Feature | Prisma | Drizzle |
|---------|--------|---------|
| Partial Index (`WHERE is_active = true`) | No | Yes |
| Functional Index (JSONB path) | Raw SQL only | Supported |
| `FOR UPDATE SKIP LOCKED` | `$queryRaw` only | Native |
| RLS policies | Raw SQL | Raw SQL (cả hai) |

### 5.2 Migration Workflow

```
drizzle-kit generate → review SQL → drizzle-kit migrate → verify
```

**Conventions:**
- `drizzle-kit generate` tạo migration files từ schema TypeScript changes
- Migration files (`.sql`) committed vào Git tại `drizzle/migrations/`
- Mọi schema changes phải qua migration — không chạy ALTER TABLE trực tiếp
- Custom SQL (RLS, triggers) thêm thủ công vào migration files sau khi generate

### 5.3 Custom SQL Migrations (Ngoài Drizzle)

```sql
-- 1. RLS Policies
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY submissions_select ON submissions FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- 2. Secure Views
CREATE VIEW user_submissions AS ...;

-- 3. CHECK Constraints
ALTER TABLE submissions ADD CONSTRAINT check_score_range
  CHECK (score IS NULL OR (score >= 0 AND score <= 10));
```

---

## 6. Cross-references

| Chủ đề | Tài liệu |
|--------|-----------|
| Submission states | `../20-domain/submission-lifecycle.md` |
| Reliability & retry | `../40-platform/reliability.md` |
| Auth & token details | `../40-platform/authentication.md` |
| Rate limiting keys | `../40-platform/rate-limiting.md` |
| Hybrid grading | `../20-domain/hybrid-grading.md` |
| Adaptive scaffolding | `../20-domain/adaptive-scaffolding.md` |
| Question content shapes | `question-content-schemas.md` |

---

*Document version: 2.0 - Last updated: SP26SE145*
