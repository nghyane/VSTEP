# Data models

## Core tables

### profiles

See [Profile business rules](../primitives/profile.md) for the full domain model.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `account_id` | UUID FK → users | CASCADE on delete |
| `nickname` | varchar(50) | Unique per account |
| `target_level` | varchar(2) | B1/B2/C1, immutable after create |
| `target_deadline` | date | Extend-only |
| `entry_level` | varchar(2) | Nullable, A1-C1 |
| `avatar_color` | varchar(7) | Nullable, hex color |
| `avatar_key` | varchar | Nullable |
| `avatar_url` | text | Nullable |
| `is_initial_profile` | boolean | Default false |

Unique constraint: `(account_id, nickname)`. Index: `account_id`.

Migration: `database/migrations/2026_04_18_000003_create_profiles_table.php`

### profile_daily_activity

Per-day activity aggregator. Powers streak and heatmap computation.

| Column | Type | Notes |
|--------|------|-------|
| `profile_id` | UUID FK → profiles | CASCADE |
| `date_local` | date | Activity date |
| `listening_exercise_count` | int | |
| `reading_exercise_count` | int | |
| `writing_submission_count` | int | |
| `speaking_submission_count` | int | |
| `vocab_review_count` | int | |
| `exam_session_count` | int | |
| `total_duration_seconds` | int | |

### profile_streak_claims

Idempotent streak milestone claims. 1 claim per (profile, milestone_days).

| Column | Type | Notes |
|--------|------|-------|
| `profile_id` | UUID FK → profiles | |
| `milestone_days` | int | Claimed milestone |
| `coins_granted` | int | Reward amount |
| `coin_transaction_id` | UUID FK → coin_transactions | |
| `claimed_at` | timestamp | |

### profile_reset_events

Audit log for profile resets.

| Column | Type | Notes |
|--------|------|-------|
| `profile_id` | UUID FK → profiles | |
| `reason` | text | Nullable |
| `wiped_entities` | jsonb | Counts pre-wipe |
| `reset_at` | timestamp | |

### profile_onboarding_responses

Onboarding questionnaire answers.

| Column | Type | Notes |
|--------|------|-------|
| `profile_id` | UUID FK → profiles | |
| `weaknesses` | jsonb | Array of skill weaknesses |
| `motivation` | text | Nullable |
| `raw_answers` | jsonb | Full questionnaire data |
| `completed_at` | timestamp | |
