---
RFC: 0019
Title: Profile Relationships, Activity Tracking & UX Gaps
Status: Accepted
Created: 2025-07-18
Updated: 2026-04-23
Superseded by:
---

# RFC 0019 — Profile Relationships, Activity Tracking & UX Gaps

## Summary

Bổ sung relationships còn thiếu trên `Profile` model, mở rộng `ProfileDailyActivity` để track mọi loại activity, thêm streak history log, và hỗ trợ onboarding re-take. Mục tiêu: mở khóa các màn History, Dashboard, Wallet cho frontend.

## Motivation

Hiện tại `Profile` model chỉ có 3 relationships (`account`, `onboardingResponse`, `resetEvents`) trong khi theo thiết kế, mọi activity của learner đều gắn vào profile. Hệ quả:

- Không thể query "Lịch sử thi", "Lịch sử luyện tập" theo profile
- `ProfileDailyActivity` chỉ track speaking drill, bỏ qua MCQ, Reading, Listening, Writing, Vocab review
- `ProfileStreakState` chỉ lưu state hiện tại, không có lịch sử → không thể hiển thị contribution graph
- `ProfileOnboardingResponse` không có versioning → user không thể làm lại onboarding
- Dashboard không có dữ liệu tổng hợp để hiển thị progress

## Design

### 1. Profile model — bổ sung relationships

Thêm các `HasMany` / `HasOne` relationships vào `Profile`:

```php
// Existing
public function account(): BelongsTo
public function onboardingResponse(): HasOne          // → keep for latest only
public function resetEvents(): HasMany

// New relationships
public function onboardingResponses(): HasMany         // all versions
public function streakState(): HasOne
public function dailyActivities(): HasMany
public function examSessions(): HasMany
public function practiceSessions(): HasMany
public function coinTransactions(): HasMany
public function notifications(): HasMany
public function courseEnrollments(): HasMany
public function vocabSrsState(): HasOne
public function grammarMastery(): HasMany
public function teacherBookings(): HasMany
public function teacherReviews(): HasMany
```

### 2. Mở rộng `ProfileDailyActivity`

**Hiện tại:** `(profile_id, date_local)` là composite PK, chỉ có `drill_session_count`, `drill_duration_seconds`.

**Thay đổi:** Thêm các cột mới (tất cả default 0):

| Cột | Type | Mô tả |
|---|---|---|
| `mcq_count` | int unsigned | Số câu MCQ đã làm |
| `mcq_correct_count` | int unsigned | Số câu MCQ đúng |
| `reading_exercise_count` | int unsigned | Số bài Reading đã làm |
| `listening_exercise_count` | int unsigned | Số bài Listening đã làm |
| `writing_submission_count` | int unsigned | Số bài Writing đã nộp |
| `speaking_drill_session_count` | int unsigned | (rename từ drill_session_count) |
| `speaking_drill_duration_seconds` | int unsigned | (rename từ drill_duration_seconds) |
| `speaking_submission_count` | int unsigned | Số bài Speaking practice đã nộp |
| `vocab_review_count` | int unsigned | Số từ đã review qua SRS |
| `exam_session_count` | int unsigned | Số đề thi đã làm |
| `total_duration_seconds` | int unsigned | Tổng thời gian học (giây) |
| `coins_earned` | int unsigned | Xu kiếm được trong ngày |
| `coins_spent` | int unsigned | Xu tiêu trong ngày |

**Migration strategy:** Thêm cột mới, giữ tên cũ làm alias qua accessor, sau đó deprecate.

### 3. Thêm `ProfileStreakLog` table

Table mới để lưu lịch sử streak theo ngày:

```sql
create table profile_streak_logs (
    profile_id uuid not null references profiles(id) on delete cascade,
    date_local date not null,
    active boolean not null default false,
    created_at timestamp not null default now(),
    primary key (profile_id, date_local)
);
```

- `active = true` khi profile có bất kỳ activity nào trong ngày đó
- `ProfileStreakState` vẫn là source of truth cho current/longest streak
- `ProfileStreakLog` dùng để render contribution graph, streak calendar

### 4. Onboarding re-take với versioning

Thêm cột `version` (int, default 1) vào `profile_onboarding_responses`:

```sql
alter table profile_onboarding_responses
    add column version int not null default 1;
```

- `Profile.latestOnboardingResponse()` → lấy version cao nhất
- `Profile.onboardingResponse()` → keep as alias cho latest
- Khi user làm lại onboarding, increment version

### 5. Profile switching (bổ sung RFC 0004)

RFC 0004 đã thiết kế `active_profile_id` trong JWT claim. Bổ sung:

- Endpoint `POST /api/v1/profiles/{id}/switch` → set active profile, issue JWT mới
- `AuthController` trả về `active_profile_id` trong response
- Middleware kiểm tra `active_profile_id` match với resource owner

### 6. Daily Activity increment helper

Thêm static helper trên `ProfileDailyActivity`:

```php
public static function increment(
    Uuid $profileId,
    string $activityType,
    int $count = 1,
    int $durationSeconds = 0,
    int $coinsEarned = 0,
): void;
```

- Upsert vào row của `(profile_id, date_local)`
- Atomic increment qua `increment()` query
- Activity types: `mcq`, `reading`, `listening`, `writing`, `speaking_drill`, `speaking_submission`, `vocab_review`, `exam_session`

### 7. Streak check helper

Thêm method trên `ProfileStreakState`:

```php
public function recordActivity(Date $date): void;
```

- Nếu `last_active_date_local` < hôm nay → increment streak
- Nếu `last_active_date_local` == hôm qua → keep streak
- Nếu `last_active_date_local` < hôm qua → reset streak về 1
- Tạo `ProfileStreakLog` record cho ngày đó
- Cập nhật `longest_streak` nếu cần

## Alternatives considered

### A. Event-driven daily activity aggregation

Dùng Laravel Events + Listeners để aggregate daily activity thay vì gọi trực tiếp `increment()`.

**Không chọn vì:** Overkill cho scope hiện tại. Event system sẽ implement riêng (RFC 0017). Hiện tại gọi trực tiếp đủ đơn giản.

### B. Single activity_log table thay vì per-type columns

Tạo 1 bảng `activity_logs` (profile_id, type, count, date) rồi aggregate khi query.

**Không chọn vì:** Query performance kém hơn khi cần thống kê theo ngày. Bảng `profile_daily_activity` với pre-computed columns phù hợp hơn cho dashboard queries.

### C. Không thêm streak log, chỉ dùng daily_activity

Dùng `profile_daily_activity` để suy ra streak (ngày nào có activity = streak active).

**Không chọn vì:** `daily_activity` có thể bị delete/reset theo chính sách retention. Streak log là lightweight, không bị wipe, phù hợp làm source of truth cho gamification.

## Implementation

- [ ] Migration: thêm columns vào `profile_daily_activity`
- [ ] Migration: tạo `profile_streak_logs` table
- [ ] Migration: thêm `version` vào `profile_onboarding_responses`
- [ ] Model: bổ sung relationships vào `Profile`
- [ ] Model: update `ProfileDailyActivity` với increment helper
- [ ] Model: tạo `ProfileStreakLog` model
- [ ] Model: update `ProfileStreakState` với recordActivity method
- [ ] Model: update `ProfileOnboardingResponse` với version accessor
- [ ] Service: update `ProfileService` với switch profile, streak logic
- [ ] Controller: thêm `POST /profiles/{id}/switch` endpoint
- [ ] Controller: update `OverviewController` để dùng relationships mới
- [ ] Tests: streak calculation, daily activity increment, onboarding versioning

## Amendment 2026-04-25 — Streak source = full-test exam, không còn drill

**Lý do:** luồng tiền của hệ thống nằm ở phòng thi (full test 25 xu, custom 8 xu/skill). Để khuyến khích user vào phòng thi, streak chuyển từ "drill practice" sang "full-test exam" (là điều kiện duy nhất để nâng streak).

### Changes
- `ProgressService::recordPracticeCompletion` không còn gọi `updateStreak` — drill chỉ track `profile_daily_activity` (study time).
- `ProgressService::recordExamCompletion(ExamSession)` mới: skip nếu `is_full_test=false`. Hook tại:
  - `ExamSessionService::submit()` — sau `status='submitted'`, dispatch trong `DB::afterCommit` (RFC 0017).
  - `ForceSubmitExpiredExams::forceSubmit()` — sau `status='auto_submitted'`, cũng `DB::afterCommit`.
  - KHÔNG hook `ExamController::abandon()` — abandon là user chủ động bỏ, không nên tính streak.
- `updateStreak`: đếm nguồn đổi từ `profile_daily_activity.drill_session_count` sang `ExamSession` query (`is_full_test=true`, status ∈ `[submitted, auto_submitted, grading, graded]`, `submitted_at` trong local-day-bounds-utc). Vẫn upsert `ProfileStreakLog.active=true` cho ngày đó (giữ nguyên semantic của RFC 0019 §3).
- `getStreak.today_sessions` = số full test submitted hôm nay (theo timezone config), không phải drill count.
- `getActivityHeatmap`: trả `{date, count}` thay vì `{date, minutes}`. Đếm tất cả exam_session (full + custom) hoàn thành mỗi ngày — intensity theo số bài (1/2/3/4+). Không dùng binary `streak_log.active` vì user muốn thấy mức độ làm bài.
- Migration `2026_04_25_000002_reset_streak_state_for_exam_semantic`: reset `current_streak`/`longest_streak`/`last_active_date_local` về 0/null vì semantic cũ (drill) không tương đương semantic mới (exam).

### Daily goal
`streak.daily_goal = 1`. 1 full test submit/ngày = giữ streak. Set thấp để vừa với cost barrier (full test 25 xu/lần) và không ép user farm exam.

## Amendment 2026-04-25 (2) — entry_level + predicted_level trong /overview

**Lý do:** Banner "Trình độ của bạn" trên dashboard cần 3 mốc Đầu vào → Dự đoán → Mục tiêu. Trước đây chỉ có `target_level` ở `profiles`; entry_level chưa được surface trong response.

### Changes
- `profiles.entry_level` đã có từ migration `2026_04_18_000003_create_profiles_table` (nullable enum VstepLevel A1–C1). Surface từ `ProfileService::createInitialProfile` đã save sẵn.
- `RegisterRequest` + `CompleteOnboardingRequest`: thêm rule `'entry_level' => ['nullable', 'string', Rule::enum(VstepLevel::class)]`. Khác `target_level` (chỉ B1/B2/C1 qua `targetOptions()`) — entry_level chấp nhận cả A1/A2 vì là tự đánh giá ban đầu.
- `AuthController::register/completeOnboarding` pass `entry_level` qua AuthService xuống ProfileService.
- `ProgressService::getOverview()['profile']` thêm 2 key: `entry_level` (raw) + `predicted_level` (computed).

### `predictLevel` algorithm
`ProgressService::predictLevel(?array $chart, ?string $entryLevel)`:
- chart=null (chưa đủ `chart.min_tests`) → fallback `entry_level`.
- chart có data → avg 4 skill band, map:
  - ≥ 8.5 → C1
  - ≥ 6.0 → B2
  - ≥ 4.0 → B1
  - ≥ 3.5 → A2
  - else → A1

Ngưỡng đồng bộ với `frontend-v3/src/lib/vstep.ts levelToBand` để FE/BE thống nhất.

### Tests cần bổ sung
`ProgressStreakTest::test_overview_endpoint` cần assert thêm `entry_level`, `predicted_level` trong profile section. Bổ sung 2 case:
- `predicted_level === entry_level` khi chart=null.
- `predicted_level` khớp band mapping khi đủ data (mock chart avg).
