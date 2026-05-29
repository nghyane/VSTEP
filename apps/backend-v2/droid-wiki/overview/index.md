# VSTEP Backend

VSTEP exam practice platform backend — PHP 8.4, Laravel 13, PostgreSQL.

Stack: Laravel 13 · PostgreSQL · Redis · jwt-auth · Octane (FrankenPHP) · Laravel AI.

## Key concepts

- **Profile** — learning unit. 1 user has N profiles. Wallet, progress, streak, enrollments are all scoped to a profile.
- **Streak** — consecutive days of activity, computed from `profile_daily_activity`.
- **Scores** — per-session band timeline from exam sessions.
- **AI Grading** — writing/speaking graded via LLM tool calling in queue jobs.

## Quick links

- [Profile business rules](../primitives/profile.md)
- [Data models](../reference/data-models.md)
