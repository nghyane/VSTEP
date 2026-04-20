# Backend Architecture Overview

Tài liệu tổng quan kiến trúc backend cho hội đồng chấm đồ án. Tham chiếu chi tiết tại các RFC trong `docs/rfcs/`.

## Stack

| Component | Technology |
|-----------|-----------|
| Language | PHP 8.4 |
| Framework | Laravel 13 |
| Database | PostgreSQL |
| Cache/Queue | Redis + Laravel Horizon |
| Auth | JWT (tymon/jwt-auth) |
| AI Grading | laravel/ai SDK (Gemini) |
| Speech Assessment | Azure Speech API |
| Storage | Cloudflare R2 (S3-compatible) |
| Server | Octane (FrankenPHP) |

## Quy mô

- 71 tables, 7 bounded contexts + 2 cross-cutting
- 96 API routes (learner + teacher + admin)
- 100 feature tests
- 4 roles: Learner → Teacher → Staff → Admin

## Kiến trúc tổng quan

```
Client (FE/Mobile)
    │
    ▼ REST API (JWT Bearer)
┌─────────────────────────────────────────────┐
│  Controller (mỏng)                          │
│    → FormRequest (validation)               │
│    → Service (business logic)               │
│    → Resource (response shape)              │
├─────────────────────────────────────────────┤
│  Models: casts, relationships, scopes       │
│  Enums: domain logic (Role, CoinType, etc.) │
├─────────────────────────────────────────────┤
│  Queue Jobs (Horizon)                       │
│    → AI Grading Pipeline (3 layers)         │
│    → Notification dispatch                  │
├─────────────────────────────────────────────┤
│  PostgreSQL          Redis          R2      │
│  (data)              (cache/queue)  (audio) │
└─────────────────────────────────────────────┘
```

## 7 Bounded Contexts

| # | Context | Tables | Chức năng chính |
|---|---------|--------|----------------|
| 1 | Identity & Profile | 5 | Account, profile, onboarding, role |
| 2 | Economy | 5 | Coin wallet, topup, promo code |
| 3 | Authoring | ~25 | Vocab, grammar, practice content, exam content |
| 4 | Learning Execution | ~10 | Practice/exam sessions, submissions, answers |
| 5 | Grading | 4 | AI grading jobs, writing/speaking results, teacher reviews |
| 6 | Progress | 5 | SRS, mastery, streak, chart, study time |
| 7 | Commerce & Mentoring | 6 | Courses, enrollment, teacher slots, bookings |

Chi tiết: [RFC 0001 — Domain Map](rfcs/0001-domain-map.md)

## Phân quyền

Level-based, 4 roles:

| Role | Level | Phạm vi |
|------|-------|---------|
| Learner | 0 | Học, thi, luyện tập. Có profile. |
| Teacher | 1 | Xem lịch, xin nghỉ, chấm bài. Không có profile. |
| Staff | 2 | Quản lý content, courses, scheduling. Không có profile. |
| Admin | 3 | Toàn quyền: users, system, exam publish. Không có profile. |

Middleware: `role.level >= required_level` → pass. Admin access mọi thứ.

Chi tiết: [RFC 0004 — Auth](rfcs/0004-auth-active-profile.md), [RFC 0011 — Role-Based Features](rfcs/0011-role-based-features.md)

## AI Grading Pipeline

3-layer architecture:

```
Layer 0: Heuristic (sync, PHP)     → word count, keyword coverage, basic regex
Layer 1: LanguageTool (async)      → grammar/spelling errors
Layer 2: LLM (async, laravel/ai)   → rubric scoring, feedback, annotations
```

- Rubric theo Bộ Giáo dục (VSTEP B1-C1)
- Output: rubric_scores + strengths + improvements + rewrites + annotations
- Retry 3 lần, exponential backoff
- Speaking: Azure Speech API (STT + pronunciation) → LLM grading

Chi tiết: [RFC 0005](rfcs/0005-grading-pipeline.md), [RFC 0007](rfcs/0007-grading-layers.md)

## Coin Economy

- Virtual currency (xu) cho mọi giao dịch in-app
- Append-only ledger (`coin_transactions`), balance = SUM(delta)
- Atomic spend: `SELECT FOR UPDATE` chống race condition
- Polymorphic `source_type` với `CoinSourceType` enum whitelist
- Topup VND → xu qua gói cố định

Chi tiết: [RFC 0001 §Economy](rfcs/0001-domain-map.md), [Design Decisions §2](design-decisions.md)

## Implementation Status

10/10 vertical slices hoàn thành (xem [RFC 0006](rfcs/0006-migration-plan.md)):

| Slice | Feature | Status |
|-------|---------|--------|
| 1 | Auth & Profile | ✅ |
| 2 | Coin Wallet | ✅ |
| 3 | Vocabulary + SRS | ✅ |
| 4 | Grammar + Mastery | ✅ |
| 5 | Listening/Reading Practice | ✅ |
| 6 | Writing/Speaking Drill | ✅ |
| 7 | Exam (Mock test) | ✅ |
| 8 | AI Grading Pipeline | ✅ |
| 9 | Progress, Streak, Overview | ✅ |
| 10 | Courses, Bookings, Notifications | ✅ |

Chưa implement: Staff/Admin/Teacher panel APIs (RFC 0011 — Draft).

## Tài liệu tham chiếu

| Doc | Nội dung |
|-----|---------|
| [Design Decisions](design-decisions.md) | Giải thích các quyết định thiết kế quan trọng |
| [RFC Index](rfcs/README.md) | Danh sách toàn bộ RFC |
| [AGENTS.md](../AGENTS.md) | Coding conventions, architecture rules |
