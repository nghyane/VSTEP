# Database Schema

Single PostgreSQL 17 database. All tables use UUID PKs, `created_at`/`updated_at` timestamps. Hard delete with `ON DELETE CASCADE`. ORM: Drizzle.

## Tables (24)

### Users & Auth

| Table | Purpose |
|-------|---------|
| `users` | Accounts: email (unique), password_hash, full_name, role (learner/instructor/admin) |
| `refresh_tokens` | JWT refresh tokens: token_hash, jti (unique), replaced_by_jti, revoked_at, expires_at |

### Content

| Table | Purpose |
|-------|---------|
| `questions` | Question bank: skill, level, type, content (JSONB), answer_key (JSONB) |
| `knowledge_points` | Learning concepts: skill, category, name, description |
| `question_knowledge_points` | M:N join table |

### Submissions & Grading

| Table | Purpose |
|-------|---------|
| `submissions` | Learner answers: user_id, question_id, skill, status (5-state), score, band, review_priority, grading_mode, reviewer_id, audit_flag, claimed_by |
| `submission_details` | Heavy content (1:1): answer (JSONB), result (JSONB) |
| `instructor_feedback` | Review feedback: criteria_scores (JSONB), overall_score, comment |

### Exams

| Table | Purpose |
|-------|---------|
| `exams` | Exam definitions: type (practice/placement/mock), skill, title, duration, blueprint (JSONB) |
| `exam_sessions` | Learner exam attempts: status (in_progress/submitted/completed/abandoned), answers (JSONB), skill_scores (JSONB) |
| `exam_answers` | Individual answers within a session |
| `exam_submissions` | Links exam answers → submissions for W/S grading |

### Progress

| Table | Purpose |
|-------|---------|
| `user_progress` | Per-user per-skill: current_level, target_level, scaffold_level, streak_count, streak_direction, attempt_count |
| `user_skill_scores` | Score history: submission_id, skill, score, band |
| `user_goals` | Learning goals: target_band, deadline, daily_study_time |
| `user_placements` | Placement test results: skill levels, source (self_assess/placement/skipped) |

### Classes

| Table | Purpose |
|-------|---------|
| `classes` | Instructor classes: name, invite_code (unique), owner_id |
| `class_members` | M:N users ↔ classes |

### Vocabulary

| Table | Purpose |
|-------|---------|
| `vocabulary_topics` | Topics: name (unique), description, icon_key, sort_order |
| `vocabulary_words` | Words: topic_id, word, phonetic, audio_url, part_of_speech, definition, examples (JSONB) |
| `user_vocabulary_progress` | Per-user per-word: known (boolean), last_reviewed_at |

### Notifications

| Table | Purpose |
|-------|---------|
| `notifications` | User notifications: type (grading_completed/feedback_received/class_invite/goal_achieved/system), title, body, read_at |
| `device_tokens` | Push tokens: user_id, token (unique), platform (ios/android/web) |

## Enums

| Enum | Values |
|------|--------|
| `skill` | listening, reading, writing, speaking |
| `question_level` | A2, B1, B2, C1 |
| `submission_status` | pending, processing, completed, review_pending, failed |
| `review_priority` | low, medium, high |
| `grading_mode` | auto, human, hybrid |
| `vstep_band` | B1, B2, C1 |
| `exam_type` | practice, placement, mock |
| `exam_skill` | listening, reading, writing, speaking, mixed |
| `exam_status` | in_progress, submitted, completed, abandoned |
| `notification_type` | grading_completed, feedback_received, class_invite, goal_achieved, system |
| `placement_status` | completed, skipped |
| `placement_source` | self_assess, placement, skipped |
| `placement_confidence` | high, medium, low |
| `knowledge_point_category` | grammar, vocabulary, strategy, topic |
| `streak_direction` | up, down, neutral |
| `user_role` | learner, instructor, admin |

## Key Indexes

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| `submissions_user_id_idx` | submissions | user_id | User's submissions |
| `submissions_skill_idx` | submissions | skill | Skill filter |
| `submissions_question_id_idx` | submissions | question_id | Question lookup |
| `submissions_status_idx` | submissions | status | Queue queries |
| `submissions_user_status_idx` | submissions | (user_id, status) | User + status filter |
| `submissions_review_queue_idx` | submissions | status WHERE status = 'review_pending' | Partial index for review queue |
| `submissions_user_history_idx` | submissions | (user_id, created_at) | User submission history |
| `user_progress_user_skill_idx` | user_progress | (user_id, skill) | Unique per-user per-skill |
| `user_skill_scores_user_skill_idx` | user_skill_scores | (user_id, skill, created_at) | Score history lookup |
| `vocabulary_words_topic_idx` | vocabulary_words | topic_id | Words by topic |
| `notifications_user_idx` | notifications | (user_id, created_at) | User timeline |
| `notifications_unread_idx` | notifications | user_id WHERE read_at IS NULL | Unread count |
| `device_tokens_user_idx` | device_tokens | user_id | Push notification lookup |

## Redis Keys

| Key Pattern | Type | Purpose |
|-------------|------|---------|
| `grading:tasks` | Stream | Grading task queue (XADD/XREADGROUP) |
| `grading:results` | Stream | Grading results (worker → backend) |
| `stt:{sha256}` | String (TTL 24h) | STT transcription cache |

---

*Reflects implemented schema as of March 2026.*
