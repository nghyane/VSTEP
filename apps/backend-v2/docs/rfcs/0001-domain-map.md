---
RFC: 0001
Title: Domain Map & Bounded Contexts
Status: Draft
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0001 — Domain Map & Bounded Contexts

## Summary

Chia domain VSTEP thành 7 bounded contexts với ownership rõ ràng, danh sách entity chính per-context, và domain events giữa các context. Đây là nền tảng để viết schema draft (RFC 0002) và API contract (RFC 0003).

Tài liệu này KHÔNG mô tả schema field detail. Mục tiêu: chốt phạm vi và ranh giới domain trước khi xuống bảng.

## Motivation

Frontend-v2 đã có đầy đủ route mock cho toàn bộ tính năng VSTEP. Business rules đã được chốt qua nhiều vòng thảo luận (xem mục Business rules đã chốt). Nếu nhảy thẳng vào schema, sẽ dễ:

- Gom 2 domain khác nhau vào 1 bảng.
- Thiếu ranh giới ownership → state drift.
- API contract bị rò rỉ business logic sang FE.

RFC này giải quyết bằng cách:

1. Đặt tên 7 bounded contexts chính.
2. Với mỗi context: entity chính, ownership, events.
3. Tổng hợp event catalog để thấy flow cross-context.

Sau đó RFC 0002 mới xuống schema, RFC 0003 xuống API.

## Business rules đã chốt

33 quyết định dưới đây là khung cứng. Schema và API phải tuân thủ.

### Identity & profile

1. Account và Profile tách rõ. Account = login shell (email + password). Profile = đơn vị học.
2. 1 account có n profiles, không giới hạn.
3. Profile bắt buộc có target level và target deadline (kỳ thi).
4. Nickname unique trong 1 account, không global.
5. Switch profile không cần password. JWT claim chứa `active_profile_id`.
6. Profile reset: xóa learning data (progress, mastery, SRS), GIỮ xu và enrollments.
7. Roles: `learner`, `teacher`, `staff`, `admin`. Admin/teacher/staff không có profile.

### Economy (xu)

8. Wallet gắn Profile, không gắn Account.
9. Mọi giao dịch in-app dùng xu. VND chỉ xuất hiện ở top-up.
10. Top-up theo gói cố định (admin config).
11. Xu khởi điểm 100 tặng khi tạo profile ĐẦU TIÊN của account. Profile thứ 2+ không được tặng.
12. Promo code redemption track account-level (chống farm), xu cộng vào profile active.
13. Không có refund policy phase 1.
14. Crowdsource đề thi: admin grant xu tay qua `coin_transactions.type = admin_grant` hoặc cấp promo_code.

### Learning tiers

15. Mọi skill có 3 tier: Drill → Custom VSTEP → Full VSTEP.
16. Drill: support tool bật được (tốn xu per-exercise), không timer, AI free grading, KHÔNG drive chart.
17. Custom VSTEP: support OFF, timer có thể nới, tốn xu, AI grading, DRIVE chart.
18. Full VSTEP: support OFF, timer server-authoritative strict, bắt buộc 4 kỹ năng, tốn xu, AI grading, DRIVE chart.
19. Streak drive bởi DRILL, không phải VSTEP. Daily goal = 1 drill session.
20. Tổng thời lượng học tập chỉ cộng từ Drill, không từ VSTEP.
21. Chart/band estimate chỉ hiện khi ≥ 5 bài VSTEP (admin config). Sliding window N bài gần nhất (admin config). Không weight phase 1.
22. Không milestone reward streak phase 1.

### Content

23. Content practice và content exam TÁCH HOÀN TOÀN. Không reuse.
24. Exam có versioning. Đề đã publish immutable. User attempt gắn exam_version_id.
25. Listening play-once enforce client-side + log, không server stream strict.

### Vocab/Grammar

26. Vocab: SRS kiểu Anki (learning, review, relearning, lapses).
27. Grammar: track mastery đơn giản (attempts, correct, computed level), KHÔNG SRS.

### Grading

28. Grading chỉ có AI, free. Không có AI basic/advanced tier.
29. 1 submission có thể chấm nhiều lần (versioning). Latest successful là active.
30. Rubric format cố định: strengths → improvements → rewrites. AI follow rubric Bộ Giáo dục.
31. Teacher KHÔNG sinh grading result. Teacher sinh review (annotation, sửa bài, tips) gắn submission, không có score.

### Course & teacher

32. Course mua bằng xu (2000-5000 theo level). Free slots 1-1 nằm trong course.
33. Course có commitment: N full tests trong M ngày, có cooldown window ở đầu. Commitment không đủ = gate (không unlock teacher slot), KHÔNG penalty khóa tài khoản.

## Bounded contexts overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        VSTEP Backend                             │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐    │
│  │   Identity   │───▶│   Economy    │    │    Authoring     │    │
│  │   & Profile  │    │   (wallet,   │    │    (content)     │    │
│  │              │    │    promo)    │    │                  │    │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘    │
│         │                   │                     │              │
│         │                   │                     │              │
│         ▼                   ▼                     ▼              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Learning Execution                      │    │
│  │  (practice sessions, exam sessions, submissions)         │    │
│  └──────┬───────────────────────────┬───────────────────────┘    │
│         │                           │                            │
│         ▼                           ▼                            │
│  ┌──────────────┐            ┌──────────────┐                    │
│  │  Grading     │            │  Progress    │                    │
│  │  (AI +       │            │  (mastery,   │                    │
│  │   teacher    │            │   SRS, chart │                    │
│  │   review)    │            │   streak)    │                    │
│  └──────┬───────┘            └──────────────┘                    │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                Commerce & Mentoring                      │    │
│  │  (courses, enrollments, teacher slots, bookings)         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Cross-cutting: Notifications, System Config                     │
└──────────────────────────────────────────────────────────────────┘
```

7 bounded contexts:

1. **Identity & Profile** — account, profile, onboarding, role.
2. **Economy** — coin wallet, transactions, promo code, topup.
3. **Authoring** — content catalog (vocab, grammar, practice items, exams).
4. **Learning Execution** — sessions, submissions, attempts.
5. **Grading** — AI grading jobs, grading results, teacher reviews.
6. **Progress** — mastery, SRS, chart, streak, study time.
7. **Commerce & Mentoring** — courses, enrollments, teacher slots, bookings.

2 cross-cutting:

- **Notifications** — unified inbox.
- **System Config** — admin-tunable parameters.

---

## Context 1: Identity & Profile

### Purpose

Quản lý ai là ai trong hệ thống: login, phân quyền, hồ sơ học riêng từng mục tiêu.

### Core entities

| Entity | Purpose |
|---|---|
| `accounts` | Entity login (email, password_hash, role). Teacher/admin không có profile. |
| `profiles` | Đơn vị học tập của learner. Gắn target_level + target_deadline + nickname. |
| `profile_onboarding_responses` | Lưu answers từ onboarding wizard (entry_level, weaknesses, motivation). |
| `profile_reset_events` | Audit log cho mỗi lần profile reset. |
| `refresh_tokens` | JWT refresh token rotation. Đã có sẵn ở backend. |

### Ownership rules

- Account owns profiles (1-n).
- Account role decides: learner → có profiles; teacher/staff/admin → không có profile, login trực tiếp dùng.
- Profile owns mọi learning state (tham chiếu từ context khác).
- Nickname unique trong phạm vi account (application-level check).

### Events published

- `profile.created` → Economy cấp xu khởi điểm nếu là profile đầu.
- `profile.reset` → Progress xóa mastery/SRS/study time.
- `profile.target_updated` → (tương lai) có thể trigger recompute band gap.

### Events consumed

Không consume event từ context khác. Là context gốc.

---

## Context 2: Economy

### Purpose

Quản lý xu (currency in-app), lịch sử giao dịch, top-up VND → xu, promo code. Đơn nguồn xu duy nhất của hệ thống.

### Core entities

| Entity | Purpose |
|---|---|
| `coin_transactions` | Ledger append-only. Mỗi row = 1 delta với type + source_ref. Balance derive. |
| `wallet_topup_packages` | Gói nạp tiền VND → xu (admin config). |
| `wallet_topup_orders` | User order top-up. Trạng thái: pending → paid/failed. |
| `promo_codes` | Admin tạo campaign. Trường: max_uses, per_account_limit, expires_at, amount, partner. |
| `promo_code_redemptions` | 1 redemption = 1 account dùng 1 code. Chống farm. |

### Ownership rules

- Coin transactions gắn `profile_id`. Balance = SUM(delta) WHERE profile_id = X.
- Top-up orders gắn `profile_id` (user chọn profile active lúc nạp).
- Promo redemption gắn `account_id` (chống farm). Xu cộng vào `profile_id` active.
- Không service nào khác được update balance trực tiếp. Chỉ qua `coin_transactions`.

### Transaction types

```
topup              -- nạp tiền, delta dương
onboarding_bonus   -- 100 xu khi tạo profile đầu, dương
promo_redeem       -- redeem promo code, dương
admin_grant        -- admin cấp tay (crowdsource đề, compensation), dương
support_level_use  -- bật highlight/template, âm
exam_custom        -- thi thử custom, âm
exam_full          -- thi thử full, âm
course_purchase    -- mua course, âm
```

### Events published

- `coin.transaction_created` → Notifications push "+100 xu" hoặc "-25 xu" cho user.
- `wallet.topup_completed` → Notifications push success.

### Events consumed

- `profile.created` → grant onboarding_bonus nếu profile đầu.
- `course.purchased` → trừ xu (hoặc reverse: Commerce publish event sau khi Economy đã trừ thành công — xem cross-cutting).

---

## Context 3: Authoring

### Purpose

Quản lý toàn bộ content có thể học/thi. Admin CRUD qua panel. Content practice và exam TÁCH RIÊNG.

### Core entities

#### Foundation

| Entity | Purpose |
|---|---|
| `vocab_topics` | Chủ đề từ vựng. Có level, tasks. |
| `vocab_words` | Từ + phonetic + definition + synonyms + collocations + word family. |
| `vocab_exercises` | MCQ, fill-blank, word-form gắn topic hoặc word. |
| `grammar_points` | Điểm ngữ pháp có name, summary, category (foundation/sentence/task/error-clinic). |
| `grammar_point_levels` | Many-to-many point × level. |
| `grammar_point_tasks` | Many-to-many point × task (WT1, WT2, SP1...). |
| `grammar_point_functions` | Many-to-many point × function (accuracy, range, coherence, register). |
| `grammar_examples` | Ví dụ en/vi per point. |
| `grammar_common_mistakes` | Wrong/correct/explanation per point. |
| `grammar_vstep_tips` | Tip per task per point. |
| `grammar_exercises` | 4 kinds: mcq, error-correction, fill-blank, rewrite. Payload jsonb. |

#### Practice skill (drill + custom)

| Entity | Purpose |
|---|---|
| `practice_listening_exercises` | Exercise với transcript, audio_url, word_timestamps. |
| `practice_listening_questions` | MCQ gắn listening exercise. |
| `practice_reading_exercises` | Exercise với passage, translation. |
| `practice_reading_questions` | MCQ gắn reading exercise. |
| `practice_writing_prompts` | Prompt + min/max words + required_points + keywords + sentence_starters. |
| `practice_writing_outline_sections` | Outline guide (drill tier). |
| `practice_writing_template_sections` | Template (drill tier). |
| `practice_writing_sample_markers` | Sticker annotations cho sample answer. |
| `practice_writing_sample_answers` | Sample answer text. |
| `practice_speaking_drills` | Drill-tier: sentences for dictation/shadowing. |
| `practice_speaking_drill_sentences` | Child of drill. |
| `practice_speaking_tasks` | VSTEP-format practice (part 1/2/3 style). |

#### Exam

| Entity | Purpose |
|---|---|
| `exams` | Metadata đề: title, source_school (HNUE, Văn Lang...), tags. |
| `exam_versions` | Version immutable. Đang publish = 1 version. |
| `exam_version_listening_sections` | Section per exam version. |
| `exam_version_listening_items` | MCQ per section. |
| `exam_version_reading_passages` | Passage per version. |
| `exam_version_reading_items` | MCQ per passage. |
| `exam_version_writing_tasks` | Writing task per version (letter/essay). |
| `exam_version_speaking_parts` | Speaking part 1/2/3 per version. |

### Ownership rules

- Content là read-only với learner. Chỉ admin write.
- Exam version immutable sau publish. Sửa đề = publish version mới.
- Content practice và exam không share bảng. Duplicate schema chấp nhận được để giữ ranh giới rõ.

### Events published

- `content.published` → (tương lai) notify follower/learner.
- `exam_version.published` → Progress reset cache nếu cần.

### Events consumed

Không consume. Context cung cấp source cho Execution.

---

## Context 4: Learning Execution

### Purpose

Khi user nhấn "bắt đầu làm bài", một session được tạo. Session chứa snapshot đang làm + answers + submission. Khi submit → push event sang Grading và Progress.

### Core entities

#### Practice (drill)

| Entity | Purpose |
|---|---|
| `practice_sessions` | Root session: profile_id, skill, module, exercise_ref, started_at, ended_at, duration_seconds, support_level_used. |
| `practice_mcq_answers` | Per item answer cho listening/reading drill. |
| `practice_writing_submissions` | Text user viết. Có support_levels_used jsonb. |
| `practice_speaking_submissions` | Audio URL + duration + transcript (STT). |
| `practice_speaking_drill_attempts` | Dictation/shadowing per sentence: user_text, accuracy. |
| `practice_vocab_reviews` | 1 row = 1 rating event cho vocab card. Source of truth cho SRS. |
| `practice_grammar_attempts` | 1 row = 1 exercise attempt. Answer jsonb + correct boolean. Source of truth cho mastery. |

#### Exam (custom + full)

| Entity | Purpose |
|---|---|
| `exam_sessions` | Root: profile_id, exam_version_id, mode (custom/full), selected_skills, started_at, server_deadline_at, submitted_at, time_extension_factor, status. |
| `exam_mcq_answers` | Per item answer cho listening + reading exam. |
| `exam_writing_submissions` | Text cho từng writing task. |
| `exam_speaking_submissions` | Audio cho từng speaking part. |
| `exam_listening_play_log` | Track play-once: session_id + section_id + played_at. |

### Ownership rules

- Session khởi tạo = tạo row + trừ xu qua Economy (atomic transaction).
- Submission luôn tham chiếu session.
- Exam session status: `active` → `submitted` → `graded`.
- Practice session không có state `graded` (grading có thể pending/done nhưng session kết thúc khi submit).
- Server timer: `server_deadline_at` là ground truth. Client hết giờ = auto-submit.
- Support level use phải log trước khi trừ xu. Nếu trừ xu fail → không enable support.

### Events published

- `practice_session.created` → Economy trừ xu nếu có support level bật. Progress bắt đầu tracking study time.
- `practice_session.completed` → Progress update streak, study time, mastery (grammar), SRS (vocab).
- `practice_writing_submission.created` → Grading enqueue AI job.
- `practice_speaking_submission.created` → Grading enqueue AI job (có STT).
- `exam_session.created` → Economy trừ xu (custom/full cost).
- `exam_session.submitted` → Grading enqueue job cho writing/speaking. MCQ chấm ngay.
- `exam_session.graded` → Progress update chart data.

### Events consumed

- `coin.charge_failed` (từ Economy) → rollback session, user thấy lỗi "không đủ xu".

---

## Context 5: Grading

### Purpose

Chấm bài bằng AI theo rubric Bộ Giáo dục, format strengths → improvements → rewrites. Teacher bổ sung review riêng, không sinh score.

### Core entities

| Entity | Purpose |
|---|---|
| `grading_jobs` | Job async: submission_type (polymorphic), submission_id, status (pending/processing/ready/failed), attempts, started_at, completed_at, error. |
| `writing_grading_results` | AI result cho writing: rubric_scores jsonb, overall_band, strengths[], improvements[], rewrites[], annotations jsonb, version, is_active. |
| `speaking_grading_results` | AI result cho speaking: rubric_scores jsonb, overall_band, strengths[], improvements[], pronunciation_report jsonb, transcript, version, is_active. |
| `teacher_reviews` | Teacher's annotation/sửa bài trên 1 submission: booking_id, submission_ref, content jsonb (corrections, tips, notes), visible_to_student, created_at. |

### Ownership rules

- Grading job polymorphic: `submission_type` ∈ {practice_writing, practice_speaking, exam_writing, exam_speaking}.
- 1 submission có thể có nhiều grading_results (versioning). Mới nhất `is_active = true`, cũ `is_active = false`.
- Teacher review KHÔNG phải grading result. Không có score. Chỉ có annotation/note.
- Teacher review chỉ tồn tại khi có booking (Commerce context).
- AI job retry tối đa 3 lần. Fail sau 3 lần → status `failed`, không refund xu (rule #13).

### Events published

- `grading.completed` → Progress update band estimate (chỉ exam). Notifications push kết quả.
- `grading.failed` → Notifications push lỗi, user có thể request lại.
- `teacher_review.submitted` → Notifications push học viên xem review.

### Events consumed

- `practice_writing_submission.created` → enqueue job.
- `practice_speaking_submission.created` → enqueue job (STT first, then AI).
- `exam_session.submitted` → enqueue job cho writing/speaking submissions; MCQ không qua job (chấm sync).
- `booking.completed` → trigger UI teacher submit review.

---

## Context 6: Progress

### Purpose

Lưu trạng thái học tập của profile: mastery, SRS, chart data, streak, study time. Tất cả derive hoặc cache từ event của Execution và Grading.

### Core entities

| Entity | Purpose |
|---|---|
| `profile_vocab_srs_states` | Cache Anki state per (profile, vocab_word). Cập nhật mỗi review. |
| `profile_grammar_mastery` | Cache attempts/correct per (profile, grammar_point). |
| `profile_daily_activity` | Per day: profile_id, date_local, drill_session_count, drill_duration_seconds. Derive từ practice_sessions. |
| `profile_streak_state` | Cache: profile_id, current_streak, longest_streak, last_active_date. |
| `profile_chart_cache` | (optional) Cache sliding-window band estimate per skill để query fast. Recompute khi exam.graded. |

### Ownership rules

- Source of truth cho mastery/SRS là **attempts** ở Execution. Progress chỉ cache.
- Streak compute từ `profile_daily_activity`. Timezone Asia/Ho_Chi_Minh.
- Chart data compute từ `exam_sessions` (custom + full) status = graded:
  - filter sliding window N gần nhất (admin config).
  - require ≥ 5 bài để show.
  - filter outlier std_dev (admin config).
- Chart NOT derive từ practice.
- Study time tính từ `practice_sessions.duration_seconds`, KHÔNG từ exam_sessions.

### Events published

- `streak.updated` → Notifications push "giữ streak hôm nay" hoặc "mất streak".
- `mastery.level_up` → (tương lai) notify user.

### Events consumed

- `practice_session.completed` → update grammar mastery (nếu có grammar attempts), vocab SRS (nếu có vocab reviews), study time, streak.
- `exam_session.graded` → invalidate chart cache.
- `profile.reset` → wipe SRS, mastery, activity, streak, chart cache.

---

## Context 7: Commerce & Mentoring

### Purpose

Bán khóa học bằng xu. Quản lý enrollment, commitment. Teacher slot 1-1 trong khóa, không sinh grading.

### Core entities

| Entity | Purpose |
|---|---|
| `courses` | Metadata: title, target_level, target_exam, description, price_coins, max_slots, max_slots_per_student, start_date, end_date, required_full_tests, commitment_window_days, exam_cooldown_days, livestream_url, teacher_id. |
| `course_schedule_items` | Lịch livestream tĩnh per course: date, start/end time, topic. |
| `course_enrollments` | profile_id + course_id + enrolled_at + coins_paid + acknowledged_commitment. |
| `course_commitment_status` | Derive snapshot (hoặc query live): phase (pending/met), completed_count, deadline_at. |
| `teacher_slots` | 30-phút slots mở per course: teacher_id, course_id, starts_at, duration_minutes, status (open/booked/completed/cancelled). |
| `teacher_bookings` | slot_id + profile_id + submission_ref (nullable) + meet_url (admin paste) + booked_at + status. |

### Ownership rules

- Enrollment gắn profile, không account.
- Booking gắn profile, chỉ cho phép nếu:
  - profile đã enroll course.
  - commitment status = met.
  - chưa đạt `max_slots_per_student` trong course đó.
- Slot status machine: `open` → `booked` → `completed` (hoặc `cancelled`).
- Meet URL do admin/teacher paste sau khi booking confirm. Student thấy 15 phút trước giờ.
- Booking có thể gắn submission hoặc không (optional). Gắn submission → teacher review attach vào đó.
- Commitment KHÔNG phải penalty. Không đủ = không unlock booking, tài khoản vẫn hoạt động bình thường.

### Events published

- `course.purchased` → Economy trừ xu `course_purchase`. Notifications push.
- `enrollment.created` → Progress reset cooldown counter cho commitment.
- `booking.created` → Notifications push "đã book slot, chờ meet link".
- `booking.meet_url_updated` → Notifications push student.
- `booking.completed` → Grading trigger teacher review UI available.

### Events consumed

- `exam_session.graded` (mode=full) → update commitment progress. Nếu đạt `required_full_tests` trong window → phase = met, unlock booking.

---

## Cross-cutting: Notifications

### Purpose

Inbox unified per profile, các context khác publish events → Notifications fan-out thành app notifications.

### Core entities

| Entity | Purpose |
|---|---|
| `notifications` | profile_id, type, payload jsonb, icon_key, created_at, read_at, dedup_key. |

### Notification types (phase 1)

```
coin_received       -- nhận xu (onboarding, promo, admin_grant, refund)
coin_spent          -- trừ xu lớn (course, exam) — optional
topup_completed     -- top-up success
streak_saved        -- duy trì streak hôm nay
streak_broken       -- mất streak
grading_ready       -- AI chấm xong
grading_failed      -- AI chấm lỗi
teacher_review      -- giáo viên đã review bài
booking_created     -- book slot thành công
booking_meet_url    -- meet URL available
booking_reminder    -- 15 phút trước giờ slot
course_session_soon -- lịch livestream sắp diễn ra
commitment_met      -- đã đạt cam kết, unlock booking
exam_graded         -- đề thi có kết quả
```

### Delivery

- In-app (default, qua bảng `notifications`).
- Email (optional, chỉ cho `booking_reminder`, `course_session_soon`).
- Push mobile (phase 2).

---

## Cross-cutting: System Config

### Purpose

Admin tunable parameters không nên hardcode. Tách 2 nhóm: scalar KV và multi-row config.

### Core entities

| Entity | Purpose |
|---|---|
| `system_configs` | Key-value store cho scalars. |
| `wallet_topup_packages` | Multi-row (đã kể ở Economy). |
| `pricing_rules` | (optional) Cho support level, exam cost, nếu cần variable pricing. |

### Scalar configs

```
chart.min_tests                   -- 5
chart.sliding_window_size          -- 10
chart.std_dev_threshold            -- 2.0
streak.daily_goal                  -- 1
streak.timezone                    -- Asia/Ho_Chi_Minh
grading.max_retries                -- 3
exam.full_test_cost_coins          -- 25
exam.custom_per_skill_coins        -- 8
support.level_1_cost_coins         -- 1
support.level_2_cost_coins         -- 2
onboarding.initial_coins           -- 100
```

### Ownership

- Admin panel CRUD qua route `/admin/config`.
- Runtime: Laravel config cache hoặc query-on-demand.

---

## Domain events catalog

Tổng hợp events cross-context để dễ reference.

| Event | Producer | Consumers |
|---|---|---|
| `profile.created` | Identity | Economy (onboarding bonus) |
| `profile.reset` | Identity | Progress (wipe state), Notifications |
| `coin.transaction_created` | Economy | Notifications |
| `wallet.topup_completed` | Economy | Notifications |
| `practice_session.created` | Execution | Economy (support level charge), Progress (study time start) |
| `practice_session.completed` | Execution | Progress (mastery, SRS, streak, study time) |
| `practice_writing_submission.created` | Execution | Grading |
| `practice_speaking_submission.created` | Execution | Grading |
| `exam_session.created` | Execution | Economy (custom/full charge) |
| `exam_session.submitted` | Execution | Grading |
| `exam_session.graded` | Execution/Grading | Progress (chart), Commerce (commitment) |
| `grading.completed` | Grading | Progress, Notifications |
| `grading.failed` | Grading | Notifications |
| `teacher_review.submitted` | Grading | Notifications |
| `streak.updated` | Progress | Notifications |
| `course.purchased` | Commerce | Economy (course_purchase charge), Notifications |
| `enrollment.created` | Commerce | Progress (commitment counter) |
| `booking.created` | Commerce | Notifications |
| `booking.meet_url_updated` | Commerce | Notifications |
| `booking.completed` | Commerce | Grading (enable teacher review) |
| `commitment.met` | Commerce | Notifications (unlock booking) |

### Transport

Laravel event dispatcher + queue jobs (Horizon) cho async handlers. Không dùng event bus ngoài.

---

## Design

### Bảng tổng hợp context × entity count (ước lượng)

| Context | Tables | Notes |
|---|---|---|
| Identity & Profile | ~5 | accounts, profiles, onboarding, reset_events, refresh_tokens |
| Economy | ~5 | coin_transactions, topup_packages, topup_orders, promo_codes, redemptions |
| Authoring | ~25 | nhiều vì tách content type; xem chi tiết trong section Context 3 |
| Learning Execution | ~10 | practice sessions, exam sessions, answers, submissions, logs |
| Grading | ~4 | jobs, writing_results, speaking_results, teacher_reviews |
| Progress | ~5 | srs_states, mastery, daily_activity, streak_state, chart_cache |
| Commerce & Mentoring | ~6 | courses, schedule, enrollments, commitment, slots, bookings |
| Notifications | ~1 | notifications |
| System Config | ~2 | system_configs, pricing_rules |

**Tổng ước lượng: ~63 tables.** Cao hơn CRUD thông thường vì:
- Event sourcing nhẹ (attempts là source, mastery/SRS là cache).
- Content tách theo skill (practice ≠ exam).
- Authoring có nhiều child tables cho grammar/vocab enriched.

### Technology mapping

- **Event dispatch**: Laravel events + queue jobs (Horizon).
- **Coin ledger**: append-only, Postgres table. Spend dùng `DB::transaction` + `SELECT FOR UPDATE` trên balance view để chống race.
- **SRS**: port Anki algorithm, lưu state trong `profile_vocab_srs_states` + reviews history. Index `(profile_id, due_at)` cho queue query.
- **Server timer exam**: `server_deadline_at` set khi session created. Enforce 2 lớp:
  1. Client submit sau deadline → server reject và force-submit với current answers.
  2. Scheduled job `ForceSubmitExpiredExams` chạy mỗi 5 phút quét sessions quá hạn chưa submit → auto submit.
- **Grading AI**: queue job gọi `laravel/ai` SDK, timeout 60s, retry 3x với exponential backoff.
- **Speaking STT**: Azure Speech API async, callback tới backend endpoint, trigger AI grading sau khi có transcript.
- **Audio storage**: R2 (S3-compatible) với pre-signed URLs scoped theo profile_id. Upload qua presigned PUT từ client.

### Concurrency & integrity rules

- Coin spend: optimistic concurrency sẽ fail dưới race. Dùng `SELECT FOR UPDATE` trên latest transaction của profile_id, kiểm tra balance đủ, insert transaction mới trong cùng tx.
- Booking slot: unique constraint `(slot_id) WHERE status IN ('booked', 'completed')` đảm bảo 1 slot 1 booking.
- Active grading result: partial unique index `(submission_type, submission_id) WHERE is_active = true`.
- Promo redemption: unique `(promo_code_id, account_id)` cho `per_account_limit = 1` case.

## Alternatives considered

### Alt 1: Gộp practice và exam content vào 1 schema

Cân nhắc có `content_items` chung + `item_context` = practice/exam. Nhược: authoring admin workflow khác, reuse không thực tế (đã chốt rule #23). Bỏ.

### Alt 2: Generic SRS cho mọi subject type

Cân nhắc `srs_cards` polymorphic (vocab, grammar, phrase, sentence). Hiện chỉ vocab dùng SRS. Grammar không dùng SRS (rule #27). Phase 1 không cần polymorphic. Bỏ, làm simple.

### Alt 3: Grading result polymorphic universal

Cân nhắc `grading_results` 1 bảng chung (writing + speaking). Nhược: payload khác nhau lớn (pronunciation_report chỉ có speaking; annotations chỉ có writing). Giữ 2 bảng riêng.

### Alt 4: Streak từ exam

Đã thảo luận kỹ. Rule #19 chốt streak từ drill. Không thực tế nếu bắt user 1 full test/ngày. Bỏ.

### Alt 5: Wallet per account thay vì per profile

Cân nhắc share wallet giữa các profile. Nhược: context rõ wallet gắn profile (rule #8). Mỗi profile là 1 mục tiêu/kỳ thi, có ngân sách riêng. Bỏ.

### Alt 6: Gộp practice listening/reading MCQ questions

Cân nhắc dùng 1 bảng `practice_mcq_questions` với `skill` column thay vì tách per skill. Giảm 2 tables. Nhược: listening question có word timestamps attach vào parent exercise, reading question không. Tách ra giữ clarity. Phase 1 giữ tách — RFC 0002 sẽ chốt lại.

## Implementation

RFC này là tài liệu khung, không có code.

Tiến trình tiếp theo:

- [ ] RFC 0002 — Database schema draft (bảng + field + relationships, chưa migration)
- [ ] RFC 0003 — API contract (endpoint list, request/response shape)
- [ ] RFC 0004 — Auth & JWT claim for active profile
- [ ] RFC 0005 — Grading pipeline (queue, retry, rubric parsing)
- [ ] RFC 0006 — Migration plan (order, seed data, rollback)

## Open questions

Những điểm nhỏ chưa quyết, sẽ giải quyết ở RFC 0002:

1. `grammar_exercises` payload jsonb vs separate tables per kind — nghiêng jsonb.
2. `vocab_words` polymorphic topic_id (many-to-many) vs 1-n — phase 1 nghiêng 1-n.
3. Exam version snapshot có copy nội dung practice không — không (rule #23), exam version có content riêng.
4. `profile_chart_cache` có thực sự cần hay query live đủ nhanh — benchmark sau.
5. Teacher account model: dùng `users.role = teacher` với `profiles IS NULL`, hay bảng `teachers` riêng — nghiêng role-based trên `users` (accounts).
6. Meet URL field trong booking: nullable string hay bảng riêng `booking_meet_links` — nghiêng nullable string.
7. `admin_grant` coin transaction có cần ghi note/reason không — nên có, thêm `metadata jsonb`.
