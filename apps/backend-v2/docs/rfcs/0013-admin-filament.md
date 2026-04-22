---
RFC: 0013
Title: Admin Panel with Filament PHP
Status: Draft
Created: 2026-04-22
Updated: 2026-04-22
Superseded by:
---

# RFC 0013 — Admin Panel with Filament PHP

## Summary

Thêm admin panel bằng Filament v3 chạy tại `/admin`, session auth riêng, không ảnh hưởng API (JWT). Implement đầy đủ screen flows từ `docs/capstone/screen-flow/03-admin.drawio` và `04-staff.drawio`.

## Motivation

- Hiện tại không có admin panel — quản lý content, users, exams phải qua tinker hoặc raw SQL.
- Frontend SPA custom tốn thời gian design + implement, đã thử và xóa 2 lần.
- Filament là standard trong Laravel ecosystem (20k+ GitHub stars), cung cấp CRUD, forms, tables, widgets out-of-the-box.
- Đồ án cần demo quản lý hệ thống — Filament cho phép ship nhanh với UI professional.

## Design

### Auth

- Filament dùng Laravel session auth tại `/admin/login`.
- API giữ JWT auth tại `/api/*` — không conflict.
- `User` model implement `FilamentUser` interface, method `canAccessPanel()` check role `admin` hoặc `staff`.
- Staff thấy subset resources (không thấy System Config, User Role Change).

### Filament Resources (từ screen flows)

**Admin + Staff shared:**

| Resource | Model | Features |
|----------|-------|----------|
| UserResource | User | List, View, Change Role, Grant Coins |
| ExamResource | Exam | CRUD, Publish/Unpublish |
| ExamVersionResource | ExamVersion | Manage versions, content editor (L/R/W/S tabs) |
| VocabTopicResource | VocabTopic | CRUD topics + inline words + exercises |
| GrammarPointResource | GrammarPoint | CRUD points + structures, examples, exercises |
| PracticeListeningResource | PracticeListeningExercise | CRUD + questions |
| PracticeReadingResource | PracticeReadingExercise | CRUD + questions |
| PracticeWritingResource | PracticeWritingPrompt | CRUD |
| PracticeSpeakingDrillResource | PracticeSpeakingDrill | CRUD + sentences |
| PracticeSpeakingTaskResource | PracticeSpeakingTask | CRUD |
| CourseResource | Course | CRUD + schedule, enrollments, slots |
| PromoCodeResource | PromoCode | CRUD + redemption history |
| NotificationResource | Notification | Send to users/profiles |

**Admin only:**

| Resource | Model | Features |
|----------|-------|----------|
| SystemConfigResource | SystemConfig | Key-value editor |
| TopupPackageResource | TopupPackage | CRUD packages |
| TopupOrderResource | TopupOrder | View orders, transaction log |
| GradingJobResource | GradingResult | View jobs, retry failed |

### Dashboard Widgets

- Stats: Total Users, Active Exams, Vocab Topics, Grammar Points
- Recent Activity: latest registrations, exam submissions, grading jobs
- Grading Queue: pending/failed/completed counts

### Role-based access

```php
// User model
public function canAccessPanel(Panel $panel): bool
{
    return in_array($this->role, [Role::Admin, Role::Staff]);
}

// Per-resource policy
// Staff: no access to SystemConfig, cannot change roles, cannot manage topup packages
```

### Route

```
/admin          → Filament dashboard
/admin/login    → Filament login (session auth)
/api/*          → Existing JWT API (unchanged)
```

### Dependencies

```
filamentphp/filament: ^3.3
```

Filament pulls in Livewire, Alpine.js, Tailwind (scoped to admin panel, no conflict with API).

## Alternatives considered

1. **Custom SvelteKit admin** — đã thử, tốn thời gian design, xóa 2 lần. Không phù hợp timeline.
2. **Laravel Nova** — paid ($199), closed source. Filament free + open source.
3. **React Admin** — cần build API endpoints riêng cho admin. Filament dùng Eloquent trực tiếp.
4. **No admin panel** — quản lý qua tinker/SQL. Không demo được cho đồ án.

Chọn: **Filament v3** — zero-cost, ships fast, professional UI, Laravel-native.

## Implementation

- [ ] Install `filamentphp/filament`
- [ ] Configure AdminPanelProvider (path `/admin`, auth guard)
- [ ] User model: implement `FilamentUser`, `canAccessPanel()`
- [ ] Dashboard widgets (stats, recent activity)
- [ ] UserResource (list, view, change role, grant coins)
- [ ] ExamResource + ExamVersionResource (CRUD, content editor)
- [ ] VocabTopicResource (CRUD + inline words/exercises)
- [ ] GrammarPointResource (CRUD + structures/examples/exercises)
- [ ] Practice Resources (Listening, Reading, Writing, Speaking)
- [ ] CourseResource (CRUD + schedule/enrollments)
- [ ] PromoCodeResource + TopupPackageResource
- [ ] SystemConfigResource (admin only)
- [ ] GradingJobResource (view, retry)
- [ ] NotificationResource
- [ ] Role-based policies (staff restrictions)
- [ ] Tests
