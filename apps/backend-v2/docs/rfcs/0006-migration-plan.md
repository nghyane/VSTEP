---
RFC: 0006
Title: Migration Plan & Implementation Phases
Status: Draft
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0006 — Migration Plan & Implementation Phases

## Summary

Lộ trình implement từ rỗng → production-ready phase 1, chia thành 10 vertical slices. Mỗi slice có: deliverables, migration order, seed data, test plan, done criteria.

Mục tiêu: ship được feature vertical end-to-end trước khi horizontal expansion.

## Strategy

### Vertical slice approach

Mỗi slice = 1 feature hoạt động đầy đủ (DB + Model + Service + Controller + Resource + Tests + seed). Không làm "all migrations first, all models next".

### Phase 1 boundaries

In scope phase 1:
- 10 slices dưới đây
- Toàn bộ 7 bounded contexts với functionality minimal
- FE có thể wire API thật cho tất cả features hiện có

Out of scope phase 1:
- Admin panel UI (backend có endpoint, UI sau)
- Teacher panel UI (tương tự)
- Payment gateway thật (mock)
- Push mobile notifications
- Advanced analytics/reports

---

## Slice 1 — Auth & Profile Foundation

**Depends on**: nothing

**Migrations**:
```
20260418_0001_alter_users_add_role_verified_at
20260418_0002_create_profiles
20260418_0003_create_profile_onboarding_responses
20260418_0004_create_profile_reset_events
20260418_0005_create_system_configs
```

**Seed**:
- Config: `onboarding.initial_coins=100`, `streak.*`, `chart.*`, `grading.max_retries=3`, exam costs, support level costs

**Deliverables**:
- User model update (role enum)
- Profile model + relationships
- AuthService: register with profile, login, switch-profile
- ActiveProfile middleware
- AuthController endpoints
- FormRequests: Register, Login, SwitchProfile

**Tests**:
- Register creates account + initial profile
- Second profile doesn't get initial flag
- Profile switch reissues JWT
- Role middleware blocks wrong role

**Done**:
- FE có thể: register với nickname + target, login, switch profile
- pint + test pass

---

## Slice 2 — Coin Wallet & Transactions

**Depends on**: Slice 1

**Migrations**:
```
20260418_0006_create_coin_transactions
20260418_0007_create_wallet_topup_packages
20260418_0008_create_wallet_topup_orders
20260418_0009_create_promo_codes
20260418_0010_create_promo_code_redemptions
```

**Seed**:
- 3 topup packages: 50k=500, 200k=2500+200, 500k=7000+500
- 2 promo codes demo: DEAR_VSTEP (50 xu), WELCOME (100 xu)

**Deliverables**:
- CoinTransaction model (append-only guard via observer)
- WalletService: getBalance, spend (atomic), credit
- Event listener: ProfileCreated → grant onboarding_bonus
- PromoService: redeem
- TopupController: list packages, create order, mock callback
- WalletController: balance, history, redeem

**Tests**:
- Onboarding bonus cấp đúng 100 xu, chỉ profile đầu
- Spend atomic: concurrent spend nhiều không âm balance
- Promo redeem unique per account
- Topup order mock success → cấp xu + transaction

**Done**:
- FE wallet button show balance thật
- Redeem promo hoạt động
- Top-up mock end-to-end

---

## Slice 3 — Vocabulary Foundation

**Depends on**: Slice 1

**Migrations**:
```
20260418_0011_create_vocab_topics
20260418_0012_create_vocab_topic_tasks
20260418_0013_create_vocab_words
20260418_0014_create_vocab_exercises
20260418_0015_create_practice_sessions
20260418_0016_create_practice_vocab_reviews
20260418_0017_create_profile_vocab_srs_states
```

**Seed**:
- Port full mock vocab data từ FE mock (~10 topics, ~100 words)
- Vocab exercises ~30 items

**Deliverables**:
- Vocab content models (Topic, Word, Exercise)
- PracticeSession model
- VocabReview + SrsState
- VocabService: getTopics, getTopic (with SRS states), buildQueue, review, attemptExercise
- SrsScheduler service (port Anki từ FE)
- Controllers + resources

**Tests**:
- SRS scheduler port correctness (learning → review → relearning)
- Review event updates state correctly
- Queue excludes mastered

**Done**:
- FE tu-vung page dùng data thật + SRS state per profile
- Reset profile wipes SRS

---

## Slice 4 — Grammar Foundation

**Depends on**: Slice 1

**Migrations**:
```
20260418_0018_create_grammar_points
20260418_0019_create_grammar_point_levels
20260418_0020_create_grammar_point_tasks
20260418_0021_create_grammar_point_functions
20260418_0022_create_grammar_structures
20260418_0023_create_grammar_examples
20260418_0024_create_grammar_common_mistakes
20260418_0025_create_grammar_vstep_tips
20260418_0026_create_grammar_exercises
20260418_0027_create_practice_grammar_attempts
20260418_0028_create_profile_grammar_mastery
```

**Seed**:
- Port 8 grammar points từ FE mock
- Structures, examples, mistakes, tips, exercises

**Deliverables**:
- Grammar models + relationships
- GrammarService
- MasteryService: recordAttempt, computeLevel
- Controllers

**Tests**:
- Mastery computation (new/learning/practicing/mastered)
- Attempt updates mastery cache

**Done**:
- FE ngu-phap page dùng data thật

---

## Slice 5 — Practice Listening & Reading (MCQ)

**Depends on**: Slice 2 (support level charges)

**Migrations**:
```
20260418_0029_create_practice_listening_exercises
20260418_0030_create_practice_listening_questions
20260418_0031_create_practice_reading_exercises
20260418_0032_create_practice_reading_questions
20260418_0033_create_practice_mcq_answers
```

**Seed**:
- Port 6 listening + 6 reading exercises từ FE mock

**Deliverables**:
- Models
- PracticeSessionService: start, use support, submit, compute score
- Controllers: list, detail, start session, toggle support, submit
- Storage abstraction cho audio URL (R2 hoặc URL external mock)

**Tests**:
- Submit MCQ scoring
- Support level trừ xu atomic, fail nếu không đủ
- Session duration tracked

**Done**:
- FE nghe/đọc dùng data thật + progress sync server

---

## Slice 6 — Practice Writing & Speaking Drill

**Depends on**: Slice 2, Slice 5 (shared PracticeSession)

**Migrations**:
```
20260418_0034_create_practice_writing_prompts
20260418_0035_create_practice_writing_outline_sections
20260418_0036_create_practice_writing_template_sections
20260418_0037_create_practice_writing_sample_markers
20260418_0038_create_practice_writing_submissions
20260418_0039_create_practice_speaking_drills
20260418_0040_create_practice_speaking_drill_sentences
20260418_0041_create_practice_speaking_tasks
20260418_0042_create_practice_speaking_submissions
20260418_0043_create_practice_speaking_drill_attempts
```

**Seed**:
- 6 writing prompts + templates + sample markers
- 6 speaking drills
- 3 speaking tasks (VSTEP format)

**Deliverables**:
- Models
- WritingService, SpeakingService
- Audio upload presigned URL endpoint
- Controllers

**Tests**:
- Writing submission create with word count
- Speaking audio upload + submission metadata
- Drill attempt accuracy computation

**Done**:
- FE viết/nói có submission record thật (grading chưa, Slice 8)
- Support level bật được trong writing/speaking drill

---

## Slice 7 — Exam (Mock test)

**Depends on**: Slice 2, Slice 5

**Migrations**:
```
20260418_0044_create_exams
20260418_0045_create_exam_versions
20260418_0046_create_exam_version_listening_sections
20260418_0047_create_exam_version_listening_items
20260418_0048_create_exam_version_reading_passages
20260418_0049_create_exam_version_reading_items
20260418_0050_create_exam_version_writing_tasks
20260418_0051_create_exam_version_speaking_parts
20260418_0052_create_exam_sessions
20260418_0053_create_exam_mcq_answers
20260418_0054_create_exam_writing_submissions
20260418_0055_create_exam_speaking_submissions
20260418_0056_create_exam_listening_play_log
```

**Seed**:
- 3 exam với full version content (mock level, đủ demo)

**Deliverables**:
- Models
- ExamService: startSession (atomic coin charge), saveAnswer, logListeningPlay, submit
- Server timer: `ForceSubmitExpiredExams` scheduled job every 5 min
- Controllers
- MCQ scoring sync tại submit

**Tests**:
- Start session trừ xu đúng cost
- Listening play-once enforced (unique constraint)
- Server deadline force-submit
- Custom mode với time_extension_factor tính đúng deadline
- Full test mark `is_full_test=true`

**Done**:
- FE /thi-thu và /phong-thi dùng data thật
- Custom/full cost trừ xu
- Timer server-side enforce

---

## Slice 8 — Grading Pipeline (AI)

**Depends on**: Slice 6, Slice 7

**Migrations**:
```
20260418_0057_create_grading_jobs
20260418_0058_create_writing_grading_results
20260418_0059_create_speaking_grading_results
```

**Seed**:
- Rubric markdown stored in `system_configs`:
  - `grading.rubric_writing_markdown`
  - `grading.rubric_speaking_markdown`

**Deliverables**:
- Models + migrations
- Jobs: GradeWritingJob, GradeSpeakingJob
- Services: WritingGrader, SpeakingGrader, AzureSpeechClient
- laravel/ai SDK setup với Gemma provider
- Event: SubmissionCreated dispatch job
- Event: GradingCompleted notify + update progress
- Controllers: job status, retry
- Exam session status machine update ('grading' → 'graded')

**Tests**:
- Job retry 3 lần fail → status=failed
- Versioning: regrade tạo version 2, is_active flip
- MCQ-only exam → status='graded' ngay
- Mixed exam → 'grading' → 'graded' khi last job done

**Done**:
- FE /viet, /noi, /phong-thi hiển thị grading result thật từ AI
- Status polling hoạt động

---

## Slice 9 — Progress, Streak, Overview

**Depends on**: Slice 3-8

**Migrations**:
```
20260418_0060_create_profile_daily_activity
20260418_0061_create_profile_streak_state
20260418_0062_create_profile_chart_cache
```

**Seed**: none

**Deliverables**:
- Models
- ProgressService: recordPracticeSession, recomputeDailyActivity, updateStreak
- ChartService: getOverviewData, computeBandEstimate với sliding window + std_dev filter + min_tests guard
- OverviewController
- StreakController
- Listeners: PracticeSessionCompleted → update activity/streak; ExamGraded → invalidate chart cache

**Tests**:
- Streak tăng 1 khi có drill session trong ngày mới
- Streak giữ nguyên 2 session cùng ngày
- Streak reset khi skip 1 ngày
- Chart trả null khi < min_tests
- Sliding window lấy đúng N bài gần nhất
- Std_dev filter loại outlier

**Done**:
- FE /overview dùng data thật
- Chart hiện khi đủ 5 bài VSTEP
- Streak counter thật

---

## Slice 10 — Courses, Enrollment, Teacher Bookings, Notifications

**Depends on**: Slice 2, Slice 7 (commitment counter)

**Migrations**:
```
20260418_0063_create_courses
20260418_0064_create_course_schedule_items
20260418_0065_create_course_enrollments
20260418_0066_create_teacher_slots
20260418_0067_create_teacher_bookings
20260418_0068_create_teacher_reviews
20260418_0069_create_notifications
```

**Seed**:
- 1 teacher account
- 2 courses linked to teacher
- Course schedule items
- Teacher slots open

**Deliverables**:
- Models
- CourseService: enroll (atomic coin charge + bonus), getCommitmentStatus
- BookingService: book (atomic slot lock), listMy
- TeacherService (teacher panel): mySlots, myBookings, pasteMeetUrl, submitReview
- NotificationService: push, markRead, dedup
- Event listeners: CoursePurchased, EnrollmentCreated, BookingCreated, GradingCompleted, etc.
- Controllers for learner + teacher panel
- Admin endpoint: grant teacher role

**Tests**:
- Enroll atomic: concurrent enrolls don't both succeed when 1 slot
- Commitment status: pending → met khi đủ full tests trong window
- Booking gate: commitment chưa met → 422
- Slot unique booking
- Notification dedup

**Done**:
- FE /khoa-hoc dùng data thật
- Teacher panel có endpoint
- Commitment gate booking hoạt động
- Notifications thật

---

## Cross-cutting tasks

### Tests strategy

- Feature tests cho mỗi controller endpoint
- Unit tests cho services có logic phức tạp (SRS, Mastery, CoinWallet, Chart)
- Integration tests cho jobs (Fake queue)
- Không test mock data seeder — test via feature tests

### Observability

- Log mọi coin transaction, mọi grading job lifecycle
- Metrics: grading job success rate, average duration
- Alerts: grading job failure rate > 10% trong 1 giờ

### Security audit trước production

- Policies cho mọi endpoint
- Rate limits verified
- SQL injection: Eloquent-only (project rule)
- XSS: không render user content trong email
- JWT secret rotation plan

### Documentation

- API docs: OpenAPI spec generated từ controllers
- Seeding guide: how to add new vocab/grammar/exam
- Admin panel user guide (when UI ready)

---

## Dependency graph

```
Slice 1 (Auth)
  ├── Slice 2 (Wallet)
  │     ├── Slice 5 (Listening/Reading)
  │     │     └── Slice 7 (Exam)
  │     │           └── Slice 8 (Grading)
  │     │                 └── Slice 9 (Progress)
  │     │                       └── Slice 10 (Courses/Bookings)
  │     └── Slice 6 (Writing/Speaking drill)
  │           └── Slice 8 (Grading)
  ├── Slice 3 (Vocab)
  └── Slice 4 (Grammar)
```

Critical path: 1 → 2 → 5 → 7 → 8 → 9 → 10.

## Timeline estimate (rough)

Đồ án capstone 1 dev, 2-3h/day:

| Slice | Complexity | Days |
|---|---|---|
| 1 Auth + Profile | Medium | 3 |
| 2 Wallet | Medium | 3 |
| 3 Vocab + SRS | High | 4 |
| 4 Grammar | Medium | 2 |
| 5 Listening/Reading | Medium | 3 |
| 6 Writing/Speaking drill | Medium | 3 |
| 7 Exam | High | 5 |
| 8 Grading AI | High | 6 |
| 9 Progress/Overview | Medium | 4 |
| 10 Courses/Bookings | High | 5 |

Total ≈ 38 days, buffer 20% → 6 tuần full-time intensity.

## Alternatives considered

### Alt 1: Horizontal layering
Làm xong all migrations → all models → all services. Bỏ: 1 lỗi schema break toàn bộ work.

### Alt 2: Gộp Slice 3+4 (vocab + grammar)
Cân nhắc. Bỏ: mỗi cái phức tạp riêng (SRS vs mastery), tách clearer.

### Alt 3: Slice 8 trước Slice 7
Grading trước exam. Bỏ: exam vừa cần grading vừa có MCQ sync. Làm exam trước với MCQ, thêm grading sau cho writing/speaking tự nhiên hơn.

## Implementation

Khi start, track per-slice progress trong `docs/rfcs/0006-migration-plan.md` bằng checkboxes.

- [x] Slice 1 — Auth & Profile
- [x] Slice 2 — Coin Wallet
- [x] Slice 3 — Vocabulary
- [x] Slice 4 — Grammar
- [x] Slice 5 — Listening/Reading
- [x] Slice 6 — Writing/Speaking Drill
- [ ] Slice 7 — Exam
- [ ] Slice 8 — Grading Pipeline
- [ ] Slice 9 — Progress & Overview
- [ ] Slice 10 — Courses, Bookings, Notifications

## Open questions

1. FE sẵn sàng adopt real API slice-by-slice hay đợi all done? Nghiêng slice-by-slice (query layer đã được tách, đổi queryFn là đủ).
2. Seed data có cần fixtures JSON lưu version-control không? Nên có, để CI test dùng được.
3. R2 bucket test vs prod có tách không? Nên có: `vstep-backend-dev`, `vstep-backend-prod`.
4. Azure Speech key rotation: secret manager hay env? Env với rotation plan manual.
5. Horizon dashboard expose port 9000 hay đằng sau auth? Dev: open; prod: jwt:admin middleware.
