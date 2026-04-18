---
RFC: 0002
Title: Database Schema Draft
Status: Draft
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0002 — Database Schema Draft

## Summary

Schema chi tiết cho toàn bộ 7 bounded contexts của RFC 0001. Bao gồm bảng, field, khóa, index, constraint. Chưa viết migration code.

Tài liệu này là **reference cho RFC 0006 migration plan**. Mỗi bảng có:
- Mục đích
- Fields + type + nullable
- Primary key, foreign keys
- Indexes quan trọng
- Constraints đặc biệt (check, partial unique, exclusion)

## Motivation

RFC 0001 chốt ranh giới context. Bước tiếp: xuống schema để:
1. Phát hiện ambiguity field-level sớm.
2. Chốt kiểu polymorphic vs typed tables.
3. Chuẩn bị migration order.

## Conventions

- Primary key: `id UUID` cho entity business, `id BIGSERIAL` cho log/event/ledger.
- Timestamp: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at` nếu mutable.
- Soft delete: KHÔNG dùng (theo project rule). Hard delete + CASCADE.
- Money/xu: `INTEGER` (xu là unit dương nguyên, không cần decimal).
- VND: `INTEGER` trong minor unit (đồng), không scale.
- Enum: Postgres enum type qua CHECK constraint string, không dùng `CREATE TYPE` (migration khó).
- JSON: `JSONB`, không `JSON`.
- Timezone: `TIMESTAMPTZ` luôn. Date-local cho streak dùng `DATE` + timezone convert ở app layer.
- Naming: snake_case, plural table names, singular column names.

## Design

### Schema organization

Mô tả ~65 tables chia theo 7 contexts + 2 cross-cutting. Mỗi context 1 section.

---

## 1. Identity & Profile

### `accounts`

Identity login entity. Teacher/admin login qua bảng này nhưng không có profile.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| email | VARCHAR(255) | no | unique, lowercase |
| password_hash | VARCHAR(255) | no | bcrypt |
| role | VARCHAR(20) | no | check IN ('learner', 'admin', 'teacher') |
| email_verified_at | TIMESTAMPTZ | yes | |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_accounts_email` unique on `email`
- `idx_accounts_role` on `role` (admin panel filter)

### `profiles`

Learner profile, 1 account n profiles. Teacher/admin không có row ở đây.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| account_id | UUID | no | fk → accounts.id CASCADE |
| nickname | VARCHAR(50) | no | unique within account |
| target_level | VARCHAR(2) | no | check IN ('B1', 'B2', 'C1') |
| target_deadline | DATE | no | ngày thi |
| entry_level | VARCHAR(2) | yes | từ onboarding, chỉ info |
| avatar_color | VARCHAR(7) | yes | hex color auto-assigned |
| is_initial_profile | BOOLEAN | no | profile đầu của account, flag để cấp onboarding_bonus |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_profiles_account_nickname` unique on `(account_id, nickname)`
- `idx_profiles_account_id` on `account_id`
- `uniq_profiles_account_initial` unique partial on `(account_id) WHERE is_initial_profile = true`

### `profile_onboarding_responses`

Raw answers từ onboarding wizard. Cho phép redo onboarding khi reset profile.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| profile_id | UUID | no | fk → profiles.id CASCADE |
| weaknesses | JSONB | no | array of skill strings |
| motivation | VARCHAR(30) | yes | graduation/scholarship/... |
| raw_answers | JSONB | no | full wizard state snapshot |
| completed_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_onboarding_profile` on `profile_id`

### `profile_reset_events`

Audit log khi user reset profile.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| profile_id | UUID | no | fk → profiles.id CASCADE |
| reason | TEXT | yes | |
| wiped_entities | JSONB | no | snapshot counts: {srs: 120, mastery: 30, ...} |
| reset_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_reset_profile` on `profile_id`

### `refresh_tokens`

Đã có ở backend hiện tại. Không sửa.

---

## 2. Economy

### `coin_transactions`

Append-only ledger. Balance derive = `SUM(delta) WHERE profile_id = X`.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| profile_id | UUID | no | fk → profiles.id CASCADE |
| type | VARCHAR(30) | no | check IN (list 8 types) |
| delta | INTEGER | no | dương hoặc âm, != 0 |
| balance_after | INTEGER | no | snapshot sau tx, >= 0 |
| source_type | VARCHAR(40) | yes | polymorphic: 'exam_session', 'course_enrollment', 'promo_code', ... |
| source_id | VARCHAR(40) | yes | ID tham chiếu source |
| metadata | JSONB | yes | lý do admin_grant, note, etc. |
| created_at | TIMESTAMPTZ | no | |

Check constraints:
- `delta != 0`
- `balance_after >= 0`
- `type IN ('topup', 'onboarding_bonus', 'promo_redeem', 'admin_grant', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase')`

Indexes:
- `idx_coin_profile_created` on `(profile_id, created_at DESC)` — balance query, history list
- `idx_coin_source` on `(source_type, source_id)` — trace từ action về tx

### `wallet_topup_packages`

Gói nạp VND → xu, admin CRUD.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| label | VARCHAR(50) | no | "Gói cơ bản" |
| amount_vnd | INTEGER | no | 50000 |
| coins_base | INTEGER | no | 500 |
| bonus_coins | INTEGER | no | 0 hoặc > 0 |
| display_order | INTEGER | no | sort UI |
| is_active | BOOLEAN | no | soft disable |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_topup_packages_active` on `is_active, display_order`

### `wallet_topup_orders`

User order top-up. Integration payment gateway để sau.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| profile_id | UUID | no | fk → profiles.id CASCADE |
| package_id | UUID | no | fk → wallet_topup_packages.id RESTRICT |
| amount_vnd | INTEGER | no | snapshot from package |
| coins_to_credit | INTEGER | no | base + bonus snapshot |
| status | VARCHAR(20) | no | check IN ('pending', 'paid', 'failed', 'expired') |
| payment_provider | VARCHAR(30) | yes | 'mock', 'vnpay', 'momo' |
| provider_ref | VARCHAR(100) | yes | gateway txn id |
| paid_at | TIMESTAMPTZ | yes | |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_topup_orders_profile` on `profile_id, created_at DESC`
- `idx_topup_orders_provider_ref` on `provider_ref` (callback lookup)

### `promo_codes`

Admin tạo promo campaigns.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| code | VARCHAR(50) | no | unique, case-insensitive |
| partner_name | VARCHAR(100) | yes | "The Coffee House" |
| amount_coins | INTEGER | no | > 0 |
| max_total_uses | INTEGER | yes | null = unlimited |
| per_account_limit | INTEGER | no | default 1 |
| expires_at | TIMESTAMPTZ | yes | |
| is_active | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_promo_code` unique on `LOWER(code)`
- `idx_promo_active` on `is_active, expires_at`

### `promo_code_redemptions`

1 redemption = 1 account dùng 1 code. Chống farm qua unique constraint.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| promo_code_id | UUID | no | fk → promo_codes.id RESTRICT |
| account_id | UUID | no | fk → accounts.id CASCADE |
| profile_id | UUID | no | fk → profiles.id CASCADE — xu vào đây |
| coins_granted | INTEGER | no | snapshot |
| coin_transaction_id | BIGINT | no | fk → coin_transactions.id RESTRICT |
| redeemed_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_redemption_account_code` unique on `(promo_code_id, account_id)` — khi `per_account_limit = 1`
- `idx_redemption_profile` on `profile_id`

---

## 3. Authoring (Content)

### Vocab

#### `vocab_topics`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(50) | no | unique |
| name | VARCHAR(100) | no | |
| description | TEXT | yes | |
| level | VARCHAR(2) | no | B1/B2/C1 |
| icon_key | VARCHAR(30) | no | family/sun/briefcase/heart/leaf/graduation |
| display_order | INTEGER | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `vocab_topic_tasks`

Junction many-to-many: topic × VSTEP task.

| Field | Type | Null | Note |
|---|---|---|---|
| topic_id | UUID | no | fk → vocab_topics.id CASCADE |
| task | VARCHAR(10) | no | check IN ('WT1','WT2','SP1','SP2','SP3','READ') |
| pk | (topic_id, task) | | |

#### `vocab_words`

Phase 1 one-to-many với topic. Polymorphic many-to-many nếu cần phase 2.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| topic_id | UUID | no | fk → vocab_topics.id CASCADE |
| word | VARCHAR(100) | no | |
| phonetic | VARCHAR(100) | yes | IPA |
| part_of_speech | VARCHAR(30) | no | |
| definition | TEXT | no | tiếng Việt |
| example | TEXT | yes | |
| synonyms | TEXT[] | no | default '{}' |
| collocations | TEXT[] | no | default '{}' |
| word_family | TEXT[] | no | default '{}' |
| vstep_tip | TEXT | yes | |
| display_order | INTEGER | no | |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_vocab_words_topic` on `topic_id, display_order`
- `uniq_vocab_words_topic_word` unique on `(topic_id, LOWER(word))`

#### `vocab_exercises`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| topic_id | UUID | no | fk → vocab_topics.id CASCADE |
| kind | VARCHAR(20) | no | check IN ('mcq', 'fill_blank', 'word_form') |
| payload | JSONB | no | schema theo kind |
| explanation | TEXT | no | |
| display_order | INTEGER | no | |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Payload schemas:
```json
// mcq
{ "prompt": "...", "options": ["A","B","C","D"], "correct_index": 0 }
// fill_blank
{ "sentence": "...", "accepted_answers": ["ans1", "ans2"] }
// word_form
{ "instruction": "...", "sentence": "... ___ ...", "root_word": "happy", "accepted_answers": ["happiness"] }
```

### Grammar

#### `grammar_points`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| name | VARCHAR(150) | no | "Câu điều kiện loại 2" |
| vietnamese_name | VARCHAR(150) | yes | |
| summary | TEXT | no | |
| category | VARCHAR(30) | no | check IN ('foundation','sentence','task','error-clinic') |
| display_order | INTEGER | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `grammar_point_levels`, `grammar_point_tasks`, `grammar_point_functions`

Junction tables many-to-many. Structure tương tự `vocab_topic_tasks`.

#### `grammar_structures`

Cấu trúc cú pháp template, hiển thị trong tab theory.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| grammar_point_id | UUID | no | fk CASCADE |
| template | TEXT | no | "If + S + V(past), S + would + V" |
| description | TEXT | yes | |
| display_order | INTEGER | no | |

#### `grammar_examples`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| grammar_point_id | UUID | no | fk CASCADE |
| en | TEXT | no | |
| vi | TEXT | no | |
| note | TEXT | yes | |
| display_order | INTEGER | no | |

#### `grammar_common_mistakes`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| grammar_point_id | UUID | no | fk CASCADE |
| wrong | TEXT | no | |
| correct | TEXT | no | |
| explanation | TEXT | no | |
| display_order | INTEGER | no | |

#### `grammar_vstep_tips`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| grammar_point_id | UUID | no | fk CASCADE |
| task | VARCHAR(10) | no | WT1/WT2/... |
| tip | TEXT | no | |
| example | TEXT | no | |
| display_order | INTEGER | no | |

#### `grammar_exercises`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| grammar_point_id | UUID | no | fk CASCADE |
| kind | VARCHAR(30) | no | check IN ('mcq','error_correction','fill_blank','rewrite') |
| payload | JSONB | no | |
| explanation | TEXT | no | |
| display_order | INTEGER | no | |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Payload schemas per kind:
```json
// mcq
{ "prompt": "...", "options": [...], "correct_index": 0 }
// error_correction
{ "sentence": "...", "error_start": 10, "error_end": 15, "correction": "..." }
// fill_blank
{ "template": "... ___ ...", "accepted_answers": [...] }
// rewrite
{ "instruction": "...", "original": "...", "accepted_answers": [...] }
```

### Practice skill content

#### `practice_listening_exercises`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | |
| description | TEXT | yes | |
| part | SMALLINT | no | 1/2/3 |
| audio_url | VARCHAR(500) | yes | R2 key |
| transcript | TEXT | no | |
| vietnamese_transcript | TEXT | yes | |
| word_timestamps | JSONB | yes | array of {word, start, end} |
| keywords | TEXT[] | no | default '{}' |
| estimated_minutes | SMALLINT | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `practice_listening_questions`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| exercise_id | UUID | no | fk CASCADE |
| display_order | INTEGER | no | |
| question | TEXT | no | |
| options | TEXT[] | no | 4 elements |
| correct_index | SMALLINT | no | check 0-3 |
| explanation | TEXT | no | |

#### `practice_reading_exercises`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | |
| description | TEXT | yes | |
| part | SMALLINT | no | 1/2/3 |
| passage | TEXT | no | |
| vietnamese_translation | TEXT | yes | |
| keywords | TEXT[] | no | default '{}' |
| estimated_minutes | SMALLINT | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `practice_reading_questions`

Schema tương tự `practice_listening_questions`.

#### `practice_writing_prompts`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | |
| description | TEXT | yes | |
| part | SMALLINT | no | 1/2 (letter/essay) |
| prompt | TEXT | no | |
| min_words | SMALLINT | no | |
| max_words | SMALLINT | no | |
| required_points | TEXT[] | no | default '{}' |
| keywords | TEXT[] | no | default '{}' |
| sentence_starters | TEXT[] | no | default '{}' |
| sample_answer | TEXT | yes | drill-tier |
| estimated_minutes | SMALLINT | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `practice_writing_outline_sections`, `practice_writing_template_sections`

Child of prompt, display_order + title + description.

#### `practice_writing_sample_markers`

Sticker annotations cho sample answer. Dùng match-string locating, không offset.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| prompt_id | UUID | no | fk CASCADE |
| match | TEXT | no | substring trong sample_answer |
| occurrence | SMALLINT | no | default 1 |
| side | VARCHAR(10) | no | check IN ('left', 'right') |
| color | VARCHAR(20) | no | check IN ('yellow', 'blue', 'pink') |
| label | VARCHAR(100) | no | |
| detail | TEXT | yes | |
| display_order | INTEGER | no | |

#### `practice_speaking_drills`

Drill-tier dictation/shadowing.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | |
| description | TEXT | yes | |
| level | VARCHAR(2) | no | A2/B1/B2/C1 |
| estimated_minutes | SMALLINT | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `practice_speaking_drill_sentences`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| drill_id | UUID | no | fk CASCADE |
| display_order | INTEGER | no | |
| text | TEXT | no | |
| translation | TEXT | yes | |

#### `practice_speaking_tasks`

VSTEP-format practice cho speaking (part 1/2/3 shape).

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | |
| part | SMALLINT | no | 1/2/3 |
| task_type | VARCHAR(20) | no | check IN ('social', 'solution', 'development') |
| content | JSONB | no | schema theo part |
| estimated_minutes | SMALLINT | no | |
| speaking_seconds | SMALLINT | no | |
| is_published | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

### Exam

#### `exams`

Metadata đề thi. Content gắn với exam_versions.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | "Đề thi VSTEP HNUE 08/02/2026" |
| source_school | VARCHAR(100) | yes | "HNUE", "Văn Lang" |
| tags | TEXT[] | no | default '{}' |
| total_duration_minutes | SMALLINT | no | |
| is_published | BOOLEAN | no | default false |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

#### `exam_versions`

Version immutable sau publish. Latest published = current version.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| exam_id | UUID | no | fk CASCADE |
| version_number | SMALLINT | no | monotonic |
| published_at | TIMESTAMPTZ | yes | null = draft |
| is_active | BOOLEAN | no | default false, chỉ 1 active per exam |
| created_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_exam_version_number` unique on `(exam_id, version_number)`
- `uniq_exam_active_version` unique partial on `(exam_id) WHERE is_active = true`

#### `exam_version_listening_sections`, `exam_version_reading_passages`, `exam_version_writing_tasks`, `exam_version_speaking_parts`

Content per version. Mỗi bảng tham chiếu `exam_version_id` CASCADE.

Listening section: `part`, `part_title`, `duration_minutes`, `audio_url`, `transcript`.
Reading passage: `part`, `title`, `duration_minutes`, `passage`.
Writing task: `part`, `task_type` (letter/essay), `duration_minutes`, `prompt`, `min_words`, `instructions TEXT[]`.
Speaking part: `part`, `type` (social/solution/development), `duration_minutes`, `speaking_seconds`, `content JSONB`.

#### `exam_version_listening_items`, `exam_version_reading_items`

MCQ items. `section_id` hoặc `passage_id` CASCADE. `display_order`, `question`, `options TEXT[]`, `correct_index`, `explanation`.

---

## 4. Learning Execution

### Practice

#### `practice_sessions`

Root của mọi practice session (drill).

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| profile_id | UUID | no | fk CASCADE |
| module | VARCHAR(30) | no | check IN ('vocab','grammar','listening','reading','writing','speaking_drill','speaking_vstep_practice') |
| content_ref_type | VARCHAR(40) | no | ví dụ 'vocab_topic', 'grammar_point', 'practice_listening_exercise' |
| content_ref_id | UUID | no | |
| started_at | TIMESTAMPTZ | no | |
| ended_at | TIMESTAMPTZ | yes | null = still active |
| duration_seconds | INTEGER | yes | compute khi ended |
| support_levels_used | JSONB | no | default '[]' — array of {level, used_at, coins_spent} |
| created_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_practice_sessions_profile_started` on `(profile_id, started_at DESC)`
- `idx_practice_sessions_content` on `(content_ref_type, content_ref_id)`

#### `practice_mcq_answers`

Per-item answer cho listening/reading drill.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| session_id | UUID | no | fk CASCADE |
| question_id | UUID | no | fk → practice_listening_questions.id OR practice_reading_questions.id (polymorphic) |
| question_type | VARCHAR(30) | no | phân biệt listening/reading |
| selected_index | SMALLINT | no | 0-3 |
| is_correct | BOOLEAN | no | |
| answered_at | TIMESTAMPTZ | no | |

#### `practice_writing_submissions`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| session_id | UUID | no | fk CASCADE |
| profile_id | UUID | no | fk CASCADE (duplicate để query nhanh) |
| prompt_id | UUID | no | fk RESTRICT |
| text | TEXT | no | |
| word_count | INTEGER | no | |
| submitted_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_writing_sub_profile_submitted` on `(profile_id, submitted_at DESC)`
- `idx_writing_sub_prompt` on `prompt_id`

#### `practice_speaking_submissions`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| session_id | UUID | no | fk CASCADE |
| profile_id | UUID | no | fk CASCADE |
| task_ref_type | VARCHAR(30) | no | 'practice_speaking_drill' or 'practice_speaking_task' |
| task_ref_id | UUID | no | |
| audio_url | VARCHAR(500) | no | R2 key |
| duration_seconds | SMALLINT | no | |
| transcript | TEXT | yes | filled sau STT |
| submitted_at | TIMESTAMPTZ | no | |

#### `practice_speaking_drill_attempts`

Per-sentence dictation result.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| session_id | UUID | no | fk CASCADE |
| sentence_id | UUID | no | fk → practice_speaking_drill_sentences.id RESTRICT |
| mode | VARCHAR(20) | no | check IN ('dictation', 'shadowing') |
| user_text | TEXT | yes | nếu dictation |
| accuracy_percent | SMALLINT | yes | 0-100 |
| attempted_at | TIMESTAMPTZ | no | |

#### `practice_vocab_reviews`

Append-only SRS review log. Source of truth cho `profile_vocab_srs_states`.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| profile_id | UUID | no | fk CASCADE |
| word_id | UUID | no | fk RESTRICT |
| session_id | UUID | yes | fk → practice_sessions.id SET NULL |
| rating | SMALLINT | no | 1=Again, 2=Hard, 3=Good, 4=Easy |
| previous_state | JSONB | no | state trước review |
| new_state | JSONB | no | state sau review |
| reviewed_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_vocab_reviews_profile_word` on `(profile_id, word_id, reviewed_at DESC)`

#### `practice_grammar_attempts`

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| profile_id | UUID | no | fk CASCADE |
| grammar_point_id | UUID | no | fk CASCADE |
| exercise_id | UUID | no | fk CASCADE |
| session_id | UUID | yes | fk SET NULL |
| answer | JSONB | no | user answer theo kind |
| is_correct | BOOLEAN | no | |
| attempted_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_grammar_attempts_profile_point` on `(profile_id, grammar_point_id, attempted_at DESC)`

### Exam

#### `exam_sessions`

Root cho Custom VSTEP + Full VSTEP.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| profile_id | UUID | no | fk CASCADE |
| exam_version_id | UUID | no | fk RESTRICT |
| mode | VARCHAR(20) | no | check IN ('custom', 'full') |
| selected_skills | TEXT[] | no | full → all 4; custom → subset |
| is_full_test | BOOLEAN | no | derive: mode='full' AND 4 skills |
| time_extension_factor | DECIMAL(3,2) | no | default 1.00; custom có thể >1 |
| started_at | TIMESTAMPTZ | no | |
| server_deadline_at | TIMESTAMPTZ | no | ground truth timer |
| submitted_at | TIMESTAMPTZ | yes | null = active |
| status | VARCHAR(20) | no | check IN ('active','submitted','grading','graded','auto_submitted','abandoned') |
| coins_charged | INTEGER | no | cost at session creation |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_exam_sessions_profile_submitted` on `(profile_id, submitted_at DESC)`
- `idx_exam_sessions_status_deadline` on `(status, server_deadline_at)` — cho ForceSubmit job
- `idx_exam_sessions_full_graded` on `(profile_id, is_full_test, status)` — chart query

#### `exam_mcq_answers`

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| session_id | UUID | no | fk CASCADE |
| item_ref_type | VARCHAR(30) | no | 'exam_listening_item' or 'exam_reading_item' |
| item_ref_id | UUID | no | |
| selected_index | SMALLINT | no | |
| is_correct | BOOLEAN | no | chấm ngay khi submit |
| answered_at | TIMESTAMPTZ | no | |

#### `exam_writing_submissions`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| session_id | UUID | no | fk CASCADE |
| profile_id | UUID | no | fk CASCADE |
| task_id | UUID | no | fk → exam_version_writing_tasks.id RESTRICT |
| text | TEXT | no | |
| word_count | INTEGER | no | |
| submitted_at | TIMESTAMPTZ | no | |

#### `exam_speaking_submissions`

Schema tương tự `practice_speaking_submissions` nhưng gắn `exam_version_speaking_parts.id`.

#### `exam_listening_play_log`

Audit play-once.

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| session_id | UUID | no | fk CASCADE |
| section_id | UUID | no | fk RESTRICT |
| played_at | TIMESTAMPTZ | no | |
| client_ip | INET | yes | |
| user_agent | VARCHAR(500) | yes | |

Indexes:
- `uniq_listening_play` unique on `(session_id, section_id)` — 1 lần duy nhất

---

## 5. Grading

### `grading_jobs`

Async job queue tracker. Bổ sung cho Horizon job records.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| submission_type | VARCHAR(40) | no | check IN (4 types) |
| submission_id | UUID | no | |
| status | VARCHAR(20) | no | check IN ('pending','processing','ready','failed') |
| attempts | SMALLINT | no | default 0 |
| last_error | TEXT | yes | |
| started_at | TIMESTAMPTZ | yes | |
| completed_at | TIMESTAMPTZ | yes | |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Check: `submission_type IN ('practice_writing','practice_speaking','exam_writing','exam_speaking')`

Indexes:
- `idx_grading_jobs_status` on `status, created_at`
- `idx_grading_jobs_submission` on `(submission_type, submission_id)`

### `writing_grading_results`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| job_id | UUID | no | fk RESTRICT |
| submission_type | VARCHAR(40) | no | |
| submission_id | UUID | no | |
| version | SMALLINT | no | monotonic per submission |
| is_active | BOOLEAN | no | chỉ 1 active per submission |
| rubric_scores | JSONB | no | {task_achievement, coherence, lexical, grammar} |
| overall_band | DECIMAL(3,1) | no | 1.0-10.0 |
| strengths | TEXT[] | no | default '{}' |
| improvements | JSONB | no | array of {message, explanation, annotation_idx?} |
| rewrites | JSONB | no | array of {original, improved, reason} |
| annotations | JSONB | no | array of {start, end, severity, category, message, suggestion?} |
| paragraph_feedback | JSONB | no | array of ParagraphFeedback |
| created_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_writing_result_active` unique partial on `(submission_type, submission_id) WHERE is_active = true`
- `idx_writing_result_sub` on `(submission_type, submission_id, version DESC)`

### `speaking_grading_results`

Schema tương tự nhưng:
- `rubric_scores`: {fluency, pronunciation, content, vocab, grammar}
- `pronunciation_report JSONB` — Azure Speech detailed
- `transcript TEXT` — snapshot STT

### `teacher_reviews`

Review của giáo viên sau slot 1-1, không sinh score.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| booking_id | UUID | no | fk RESTRICT |
| teacher_id | UUID | no | fk → accounts.id RESTRICT |
| submission_type | VARCHAR(40) | yes | polymorphic; null nếu booking không attach submission |
| submission_id | UUID | yes | |
| content | JSONB | no | {corrections, tips, notes, annotations} |
| visible_to_student | BOOLEAN | no | default true |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

---

## 6. Progress

### `profile_vocab_srs_states`

Cache Anki state per word. Source: `practice_vocab_reviews`.

| Field | Type | Null | Note |
|---|---|---|---|
| profile_id | UUID | no | fk CASCADE |
| word_id | UUID | no | fk CASCADE |
| state_kind | VARCHAR(15) | no | check IN ('new','learning','review','relearning') |
| due_at | TIMESTAMPTZ | no | |
| interval_days | INTEGER | yes | review only |
| ease_factor | DECIMAL(4,2) | yes | review only |
| lapses | SMALLINT | no | default 0 |
| remaining_steps | SMALLINT | yes | learning/relearning |
| review_interval_days | INTEGER | yes | relearning only |
| review_ease_factor | DECIMAL(4,2) | yes | relearning only |
| updated_at | TIMESTAMPTZ | no | |
| pk | (profile_id, word_id) | | |

Indexes:
- `idx_srs_profile_due` on `(profile_id, due_at)` — queue build

### `profile_grammar_mastery`

| Field | Type | Null | Note |
|---|---|---|---|
| profile_id | UUID | no | fk CASCADE |
| grammar_point_id | UUID | no | fk CASCADE |
| attempts | INTEGER | no | default 0 |
| correct | INTEGER | no | default 0 |
| last_practiced_at | TIMESTAMPTZ | yes | |
| computed_level | VARCHAR(20) | no | 'new','learning','practicing','mastered' |
| updated_at | TIMESTAMPTZ | no | |
| pk | (profile_id, grammar_point_id) | | |

### `profile_daily_activity`

Per-day aggregate cho streak + study time.

| Field | Type | Null | Note |
|---|---|---|---|
| profile_id | UUID | no | fk CASCADE |
| date_local | DATE | no | Asia/Ho_Chi_Minh |
| drill_session_count | INTEGER | no | default 0 |
| drill_duration_seconds | INTEGER | no | default 0 |
| updated_at | TIMESTAMPTZ | no | |
| pk | (profile_id, date_local) | | |

### `profile_streak_state`

Cache để dashboard query nhanh.

| Field | Type | Null | Note |
|---|---|---|---|
| profile_id | UUID | no | pk, fk CASCADE |
| current_streak | INTEGER | no | default 0 |
| longest_streak | INTEGER | no | default 0 |
| last_active_date_local | DATE | yes | |
| updated_at | TIMESTAMPTZ | no | |

### `profile_chart_cache`

Optional cache cho band estimate per skill. Recompute on exam.graded.

| Field | Type | Null | Note |
|---|---|---|---|
| profile_id | UUID | no | fk CASCADE |
| skill | VARCHAR(20) | no | listening/reading/writing/speaking |
| sample_size | SMALLINT | no | số bài dùng trong window |
| avg_band | DECIMAL(3,1) | yes | null nếu < min_tests |
| trend | VARCHAR(15) | yes | 'up','down','stable','insufficient' |
| computed_at | TIMESTAMPTZ | no | |
| pk | (profile_id, skill) | | |

---

## 7. Commerce & Mentoring

### `courses`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slug | VARCHAR(80) | no | unique |
| title | VARCHAR(200) | no | |
| target_level | VARCHAR(2) | no | B1/B2/C1 |
| target_exam_school | VARCHAR(100) | yes | "ĐH Văn Lang" |
| description | TEXT | yes | |
| price_coins | INTEGER | no | 2000-5000 |
| bonus_coins | INTEGER | no | default 0 |
| max_slots | INTEGER | no | |
| max_slots_per_student | SMALLINT | no | default 2 |
| start_date | DATE | no | |
| end_date | DATE | no | |
| required_full_tests | SMALLINT | no | |
| commitment_window_days | SMALLINT | no | |
| exam_cooldown_days | SMALLINT | no | default 0 — N ngày đầu không được thi |
| livestream_url | VARCHAR(500) | yes | |
| teacher_id | UUID | no | fk → accounts.id RESTRICT |
| is_published | BOOLEAN | no | default false |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

### `course_schedule_items`

Lịch livestream tĩnh.

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| course_id | UUID | no | fk CASCADE |
| session_number | SMALLINT | no | |
| date | DATE | no | |
| start_time | TIME | no | |
| end_time | TIME | no | |
| topic | VARCHAR(100) | no | |

### `course_enrollments`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| profile_id | UUID | no | fk CASCADE |
| course_id | UUID | no | fk RESTRICT |
| enrolled_at | TIMESTAMPTZ | no | |
| coins_paid | INTEGER | no | snapshot |
| bonus_coins_received | INTEGER | no | snapshot |
| acknowledged_commitment | BOOLEAN | no | default true |
| coin_transaction_id | BIGINT | no | fk → coin_transactions.id RESTRICT |

Indexes:
- `uniq_enrollment_profile_course` unique on `(profile_id, course_id)`
- `idx_enrollment_course` on `course_id` — sold_slots count

### `teacher_slots`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| course_id | UUID | no | fk CASCADE |
| teacher_id | UUID | no | fk → accounts.id RESTRICT |
| starts_at | TIMESTAMPTZ | no | |
| duration_minutes | SMALLINT | no | default 30 |
| status | VARCHAR(20) | no | check IN ('open','booked','completed','cancelled') |
| created_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_slots_course_starts` on `(course_id, starts_at)`
- `idx_slots_teacher_starts` on `(teacher_id, starts_at)`

### `teacher_bookings`

| Field | Type | Null | Note |
|---|---|---|---|
| id | UUID | no | pk |
| slot_id | UUID | no | fk RESTRICT |
| profile_id | UUID | no | fk CASCADE |
| submission_type | VARCHAR(40) | yes | polymorphic, nullable |
| submission_id | UUID | yes | |
| meet_url | VARCHAR(500) | yes | admin paste sau booking |
| status | VARCHAR(20) | no | check IN ('booked','completed','cancelled','no_show') |
| booked_at | TIMESTAMPTZ | no | |
| updated_at | TIMESTAMPTZ | no | |

Indexes:
- `uniq_booking_slot_active` unique partial on `(slot_id) WHERE status IN ('booked','completed')`
- `idx_booking_profile` on `(profile_id, booked_at DESC)`

---

## Cross-cutting

### `notifications`

| Field | Type | Null | Note |
|---|---|---|---|
| id | BIGSERIAL | no | pk |
| profile_id | UUID | no | fk CASCADE |
| type | VARCHAR(40) | no | |
| title | VARCHAR(200) | no | |
| body | TEXT | yes | |
| icon_key | VARCHAR(20) | no | fire/coin/trophy |
| payload | JSONB | yes | context data |
| dedup_key | VARCHAR(100) | yes | idempotency |
| read_at | TIMESTAMPTZ | yes | |
| created_at | TIMESTAMPTZ | no | |

Indexes:
- `idx_notif_profile_created` on `(profile_id, created_at DESC)`
- `idx_notif_unread` on `(profile_id) WHERE read_at IS NULL`
- `uniq_notif_dedup` unique partial on `(profile_id, dedup_key) WHERE dedup_key IS NOT NULL`

### `system_configs`

| Field | Type | Null | Note |
|---|---|---|---|
| key | VARCHAR(80) | no | pk |
| value | JSONB | no | scalar or object |
| description | TEXT | yes | |
| updated_at | TIMESTAMPTZ | no | |

Seed keys:
```
chart.min_tests: 5
chart.sliding_window_size: 10
chart.std_dev_threshold: 2.0
streak.daily_goal: 1
streak.timezone: "Asia/Ho_Chi_Minh"
grading.max_retries: 3
exam.full_test_cost_coins: 25
exam.custom_per_skill_coins: 8
support.level_costs: {"1": 1, "2": 2}
onboarding.initial_coins: 100
```

---

## Alternatives considered

### Alt 1: Polymorphic join table cho MCQ questions

Đã bỏ. Practice listening/reading/exam có 4 bảng question riêng. Duplication acceptable cho clarity + schema evolution độc lập.

### Alt 2: Single `submissions` table polymorphic

Gộp practice_writing + practice_speaking + exam_writing + exam_speaking thành 1 bảng. Nhược: query filter phức tạp, STORAGE wasted cho speaking (không có text column). Giữ 4 bảng.

### Alt 3: Event sourcing full

Lưu mọi thứ là event, derive state. Phức tạp cho phase 1. Dùng event-sourcing nhẹ: attempts/reviews là event-like append-only, state tables là cache.

### Alt 4: Separate teacher entity

Cân nhắc `teachers` table tách khỏi `accounts`. Chọn dùng `accounts.role='teacher'` vì teacher vẫn cần login như learner. Thông tin thêm (bio, specialty) có thể thêm `teacher_profiles` sau nếu cần.

## Implementation

- [ ] Migration order (RFC 0006)
- [ ] Seed data cho authoring content (RFC 0006)
- [ ] Model classes với casts, relationships
- [ ] Form requests cho admin CRUD
- [ ] Resources cho API

## Open questions

1. `exam_version_listening_items.options TEXT[]` vs normalized table → giữ TEXT[4] simple.
2. `practice_mcq_answers.question_ref` polymorphic với type string — có cần strict FK constraint không? Postgres không hỗ trợ native. Dùng app-layer validation.
3. `profile_chart_cache` có thực sự cần phase 1? Query live trên 10 rows/profile/skill chắc đủ fast. Có thể bỏ cache, thêm khi benchmark.
4. `teacher_reviews` annotations có cần version như writing_grading_results không? Phase 1: không, teacher viết 1 lần.
5. `exam_sessions.status = 'grading'` có cần riêng hay chỉ dùng 'submitted' rồi check grading_jobs? Có riêng cho UX clarity.
