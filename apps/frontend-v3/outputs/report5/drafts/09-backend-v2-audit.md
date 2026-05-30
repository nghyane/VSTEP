# Backend V2 Audit for Report 5

## Audit Source

- `apps/backend-v2/routes/api.php`
- `apps/backend-v2/app/Http/Controllers/Api/V1/**/*.php`
- `apps/backend-v2/tests/Feature/**/*Test.php`
- `apps/backend-v2/tests/Unit/**/*Test.php`

## Backend Roles

| Role | Evidence | Required Report 5 Coverage |
|---|---|---|
| Guest | Public auth routes | Register, login, Google login, refresh, email check, payment callback without auth |
| Authenticated user without active profile | Protected auth/profile routes | Logout, switch profile, complete onboarding, auth/me, change password, profile CRUD |
| Learner with active profile | `auth:api` + `active-profile` routes | Wallet, vocab, grammar, practice, exams, grading, audio, overview, feedback, courses, notifications |
| Staff/Admin | `/api/v1/admin/*` under `role:staff` and nested `role:admin` | Dashboard, analytics, content CRUD, exams, users, promo codes, top-up packages, settings, courses, leave requests |
| Teacher | `/api/v1/teacher/*` and admin notifications under `role:teacher` | Teacher dashboard, schedule, slots, bookings, leave requests, notifications |
| System/AI | Grading services, jobs, callbacks, console commands | Grading jobs, feedback completion, study reminders, payment callbacks, AI scoring formulas |

## Backend Modules That Must Have Test Cases

### 1. Auth and Profile

Evidence:

- `AuthController`
- `AccountController`
- `ProfileController`
- Tests: `Auth/LoginTest.php`, `Auth/RegisterTest.php`, `Auth/GoogleLoginTest.php`, `Auth/SwitchProfileTest.php`, `Profile/ProfileCrudTest.php`, `Middleware/RoleHierarchyTest.php`

Required cases:

- Register learner and create initial profile.
- Login learner returns tokens and active profile.
- Login admin returns `profile: null`.
- Reject bad credentials.
- Google login success/conflict/onboarding path.
- Refresh/logout/token lifecycle.
- Switch active profile.
- Complete onboarding.
- Profile CRUD ownership checks.
- Change password.
- Role hierarchy blocks learner from admin APIs.

### 2. Wallet, Payment, Promo

Evidence:

- `WalletController`
- `PaymentCallbackController`
- Admin `TopupPackageController`
- Admin `PromoCodeController`
- Tests: `Wallet/TopupFlowTest.php`, `Wallet/WalletServiceTest.php`, `Wallet/PromoRedeemTest.php`, `Admin/Topup/AdminTopupPackageTest.php`

Required cases:

- List active top-up packages only.
- Create pending top-up order.
- Confirm top-up credits coins.
- Confirm top-up is idempotent.
- Wallet balance/transactions.
- Promo redeem success.
- Promo invalid/expired/used/limit cases.
- Admin top-up package CRUD/activate/deactivate.
- Payment callback accepts provider callback without auth.

### 3. Vocabulary and SRS

Evidence:

- `VocabController`
- Admin `VocabController`
- Tests: `Vocab/VocabExerciseTest.php`, `Vocab/VocabSrsFlowTest.php`, `Vocab/VocabCurriculumSeederTest.php`, `Admin/Vocab/*Test.php`, `Unit/Srs/FsrsSchedulerTest.php`

Required cases:

- Learner lists topics and opens topic detail.
- Learner attempts vocab exercise.
- SRS queue returns due cards.
- SRS review updates scheduling/mastery.
- Admin topic CRUD/publish/unpublish.
- Admin word CRUD/reorder.
- Admin exercise CRUD/reorder and validation by exercise type.

### 4. Grammar

Evidence:

- `GrammarController`
- Admin `GrammarController`
- Tests: `Grammar/GrammarPracticeTest.php`, `Grammar/GrammarCurriculumSeederTest.php`, `Admin/Grammar/*Test.php`

Required cases:

- Learner lists grammar points and opens detail.
- Learner submits grammar exercise attempt.
- Admin grammar point CRUD/publish/unpublish.
- Admin structures/examples/mistakes/tips CRUD/reorder.
- Admin grammar exercise CRUD/reorder.

### 5. Practice Listening and Reading

Evidence:

- `McqPracticeController`
- Admin `ListeningController`
- Admin `ReadingController`
- Tests: `Practice/ListeningPracticeTest.php`, `Practice/ReadingPracticeTest.php`, `Admin/Practice/AdminListeningTest.php`, `Admin/Practice/AdminReadingTest.php`

Required cases:

- Learner lists exercises by skill.
- Learner starts session.
- Learner submits MCQ answers.
- Progress endpoint updates.
- Admin listening/reading exercise CRUD.
- Admin question CRUD/reorder.
- Publish/unpublish exercise.

### 6. Writing Practice and Feedback

Evidence:

- `WritingPracticeController`
- `WritingFeedbackController`
- `FeedbackController`
- Admin `WritingController`
- Tests: `Practice/WritingPracticeTest.php`, `Validation/VstepWritingValidationTest.php`, `Admin/Practice/AdminWritingTest.php`

Required cases:

- Learner lists prompts/detail/history.
- Learner starts writing session.
- Learner submits writing answer.
- Feedback job generation.
- Writing validation rejects invalid/too-short/off-topic answer where applicable.
- Admin writing prompt CRUD/publish/unpublish.
- Admin writing marker CRUD.
- New exercise feedback endpoint: learner submits and lists feedback.

### 7. Speaking Practice, Conversation, Shadowing

Evidence:

- `SpeakingPracticeController`
- `SpeakingConversationController`
- `ShadowingProgressController`
- Admin `SpeakingTaskController`, `SpeakingDrillController`, `SpeakingScenarioController`
- Tests: `Practice/SpeakingPracticeTest.php`, `Practice/ConversationPracticeTest.php`, `Validation/VstepSpeakingValidationTest.php`, `Unit/Conversation/SpeakingConversationServiceTest.php`, `Admin/Practice/AdminSpeakingTaskTest.php`, `Admin/Practice/AdminSpeakingDrillTest.php`

Required cases:

- List/show speaking drills and VSTEP tasks.
- Start drill session and submit attempts.
- Start VSTEP speaking session and submit.
- Conversation start/show/turn/end/review.
- Pronunciation review throttling.
- Shadowing progress get/store.
- Admin speaking drill/task/scenario CRUD and publish/unpublish.

### 8. Exam Sessions and Results

Evidence:

- `ExamController`
- Admin `ExamController`, `ExamVersionController`, `ExamContentController`
- Tests: `Exam/ExamSessionTest.php`

Required cases:

- List/show published exams.
- Start full session charges full-test coins.
- Start custom session charges per-skill coins.
- Reject insufficient balance.
- Answer MCQ answers and calculate score.
- Reject already-submitted session.
- Active session lookup.
- Draft get/save.
- Listening played log/list summary.
- Session results/writing/speaking result endpoints.
- Admin exam CRUD/import/publish/unpublish.
- Admin exam version create/activate/delete.
- Admin listening/reading/writing/speaking exam content CRUD.

### 9. Grading and AI

Evidence:

- `GradingController`
- `GradingStreamController`
- AI service contracts and services
- Tests: `Grading/GradingPipelineTest.php`, `Unit/Grading/*Test.php`, `Unit/Ai/*WireTest.php`, `Unit/SyntaxAnalyzerTest.php`

Required cases:

- Grading job status/show/stream.
- Writing result lookup by submission type.
- Speaking result lookup by submission type.
- SSE stream emits progress/scores/feedback.
- Writing scoring formula.
- Speaking scoring formula.
- Rule-based scoring service.
- LLM grading service/fakes.
- AI request/response wire format.
- Syntax analyzer behavior.

### 10. Overview, Progress, Learning Path, Streak

Evidence:

- `OverviewController`
- `LearningPathController`
- `ProgressService`
- `StreakMilestoneService`
- Tests: `Progress/ProgressStreakTest.php`, `Progress/StreakMilestoneTest.php`, `Progress/LearningPathServiceTest.php`, `LearningPathApiTest.php`

Required cases:

- Overview returns profile/skill/streak/progress data.
- Practice summary returns learner activity.
- Learning path returns weak-skill recommendations.
- Streak endpoint reflects current state.
- Claim streak milestone grants coins and updates wallet.
- Activity heatmap returns current practice/exam activity.
- New progress implementation after pull must be tested against updated streak semantics.

### 11. Courses, Booking, Teacher

Evidence:

- `CourseController`
- Admin `CourseController`
- Admin `TeacherController`
- Tests: `Commerce/CourseEnrollmentTest.php`, `Admin/AdminCourseServiceDecompositionTest.php`

Required cases:

- Learner lists/shows courses.
- Create enrollment order and confirm enrollment.
- Risk students endpoint.
- Learner lists/book course slots.
- Booking cost/balance behavior.
- Admin course CRUD/publish/unpublish.
- Admin schedule item CRUD.
- Admin enrollment add/remove/commitment override.
- Admin slot CRUD/bulk create.
- Admin booking update/cancel/refund.
- Teacher dashboard/schedule/slots/bookings.
- Teacher leave request create/list.
- Staff approves/rejects leave request.

### 12. Notifications and Study Reminder

Evidence:

- `NotificationController`
- Admin `AdminNotificationController`
- `StudyReminderCommand`
- Tests: `Notification/NotificationFlowTest.php`

Required cases:

- Learner notification list/unread count/read/read-all/delete.
- Teacher/admin notifications list/unread/mark-all-read.
- Notification type coverage including top-up, booking, feedback, study reminder.
- Study reminder command creates expected notifications.

### 13. System Config, Analytics, Health, Audio

Evidence:

- `ConfigController`
- `HealthController`
- `AudioController`
- Admin `SystemConfigController`
- Admin `AnalyticsController`
- Tests: `Config/EconomyConfigTest.php`, `Admin/AdminDashboardTest.php`

Required cases:

- Health endpoint returns OK.
- Config endpoint returns pricing/system config.
- Admin system config list/show/update is admin-only.
- Audio presign upload/download for learner.
- Admin audio presign upload for staff.
- Admin analytics revenue/user/activity/grading/profile/streak/promo/top-content endpoints.

## Report 5 Implication

Report 5 cannot be only frontend. If it claims to cover the whole VSTEP project, Excel must include backend/system test sheets for the modules above. Frontend/mobile/admin UI cases should be linked to these backend API groups so every testcase is traceable to real routes and tests.
