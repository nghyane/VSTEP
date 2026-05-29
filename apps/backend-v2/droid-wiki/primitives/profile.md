# Profile

Active contributors: nghyane

## Purpose

Profile is the learner's learning unit. Each user can have up to 5 profiles. Wallet (xu), progress, streak, and enrollments are all scoped to the profile. A profile has a target level, deadline, and optional entry level.

## Business rules

### Rule 1: Max 5 profiles per user

Each account can have at most 5 profiles. Attempting to create a 6th returns HTTP 422.

**Enforcement:** `ProfileService::MAX_PROFILES_PER_USER` (constant = 5), checked in `createProfile()` before insertion.

**Source:** `app/Services/ProfileService.php:38`, `app/Services/ProfileService.php:252`

### Rule 2: Target level is immutable after creation

Once a profile is created, its `target_level` cannot be changed. To switch targets, the user must create a new profile. Attempting to change via the update endpoint returns HTTP 422.

**Enforcement:**
- `UpdateProfileRequest::withValidator()` — after-hook validation in the form request rejects changes
- `ProfileService::update()` — service-level guard as defense in depth

**Source:** `app/Http/Requests/Profile/UpdateProfileRequest.php:32-44`, `app/Services/ProfileService.php:79`

### Rule 3: Deadline can only be extended, not shortened

The `target_deadline` can be moved further into the future but cannot be moved closer. Attempting to shorten the deadline returns HTTP 422.

**Enforcement:** `ProfileService::update()` compares the new deadline against the current one via `Carbon::lt()`.

**Source:** `app/Services/ProfileService.php:81-87`

### Rule 4: Cannot delete last profile

An account must always have at least one profile. Deleting the last profile returns HTTP 422.

**Enforcement:** `ProfileService::delete()` counts remaining profiles before deletion.

**Source:** `app/Services/ProfileService.php:119-130`

### Rule 5: Nickname unique per account

Profile nicknames must be unique within the same account. Duplicate nicknames return HTTP 422.

**Enforcement:** Database unique constraint on `(account_id, nickname)` + `ProfileService::assertNicknameUnique()`.

**Source:** `app/Services/ProfileService.php:264`, `database/migrations/2026_04_18_000003_create_profiles_table.php:30`

### Rule 6: Reset wipes learning data, preserves wallet

Profile reset deletes all learning state (SRS, mastery, practice sessions, daily activity) but keeps wallet (coin_transactions) and course enrollments intact.

**Enforcement:** `ProfileService::reset()` runs inside a DB transaction, deletes 7 learning tables, logs a `ProfileResetEvent` for audit.

**Source:** `app/Services/ProfileService.php:139-172`

## Data model

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK | Profile identifier |
| `account_id` | UUID | FK → users, CASCADE | Owning user |
| `nickname` | string(50) | UNIQUE with account_id | Display name |
| `target_level` | string(2) | B1/B2/C1, immutable | Target VSTEP level |
| `target_deadline` | date | extend-only | Exam deadline |
| `entry_level` | string(2) | nullable, A1-C1 | Self-assessed starting level |
| `avatar_key` | string | nullable | Preset avatar identifier |
| `avatar_url` | string | nullable | Uploaded avatar URL |
| `is_initial_profile` | boolean | default false | First profile per account |

**Migration:** `database/migrations/2026_04_18_000003_create_profiles_table.php`

## Key source files

| File | Purpose |
|------|---------|
| `app/Models/Profile.php` | Model: casts, relationships, fillable attributes |
| `app/Services/ProfileService.php` | Business logic: create, update, delete, reset, onboarding |
| `app/Http/Controllers/Api/V1/ProfileController.php` | REST endpoints: CRUD + reset + onboarding |
| `app/Http/Requests/Profile/CreateProfileRequest.php` | Validation for profile creation |
| `app/Http/Requests/Profile/UpdateProfileRequest.php` | Validation + target_level immutability guard |
| `app/Http/Resources/ProfileResource.php` | API response shape |
| `app/Enums/VstepLevel.php` | Level taxonomy: A1-C1 |
| `app/Services/ProgressService.php` | Streak, heatmap, score computation per profile |
| `app/Services/StreakMilestoneService.php` | Streak milestone rewards per profile |
| `tests/Feature/Profile/ProfileCrudTest.php` | Tests for all profile business rules |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/profiles` | List user's profiles |
| POST | `/api/v1/profiles` | Create additional profile |
| GET | `/api/v1/profiles/{profile}` | Show profile |
| PATCH | `/api/v1/profiles/{profile}` | Update profile (immutable target_level, extend-only deadline) |
| DELETE | `/api/v1/profiles/{profile}` | Delete profile (not last one) |
| POST | `/api/v1/profiles/{profile}/reset` | Reset learning data |
| POST | `/api/v1/profiles/{profile}/onboarding` | Save onboarding responses |

## Integration points

- **ProgressService** — reads `ProfileDailyActivity` scoped to profile for streak/heatmap/scores
- **StreakMilestoneService** — credits wallet per-profile on streak milestones
- **WalletService** — coin transactions scoped to profile
- **ExamSession / PracticeSession** — all sessions belong to a profile
- **AuthController::switchProfile** — user switches active profile via JWT refresh
