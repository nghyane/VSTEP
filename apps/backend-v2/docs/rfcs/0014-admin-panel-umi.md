---
RFC: 0014
Title: Admin Panel — Umi + Ant Design Pro
Status: Accepted
Created: 2026-04-22
Updated: 2026-04-22
Superseded by:
---

# RFC 0014 — Admin Panel — Umi + Ant Design Pro

## Summary

Admin panel riêng tại `apps/admin` dùng Umi v4 + Ant Design v5 + Pro Components. Panel phục vụ 3 roles: Admin, Staff, Teacher — mỗi role thấy UI phù hợp với nhiệm vụ. Backend có thêm group routes `GET /api/v1/admin/*` bảo vệ bởi `role:staff` middleware.

## Motivation

- RFC 0013 (Filament) đã withdraw — Filament v5 không compatible tốt với Ant Design v6, UX auto-generated kém
- Admin panel cần tiếng Việt, role-based view, dashboard thực tế (không phải CRUD generic)
- Cần tách biệt hoàn toàn khỏi API — admin app là SPA riêng, gọi JWT API, không dùng session auth

## Design

### Tech stack

```
apps/admin/
  Umi v4              — convention routing, dev server, proxy
  Ant Design v5.29    — component library
  @ant-design/pro-components v2.8  — ProLayout, ProTable, PageContainer, StatisticCard
  Inter font          — Google Fonts với subset Vietnamese
```

### Auth flow

- Login tại `/login` (layout: false) — POST `/api/v1/auth/login`
- Role check: chỉ `admin | staff | teacher` được vào
- Token lưu `localStorage`, tự clear + redirect `/login` khi nhận 401
- Layout guard: `useEffect` check token mỗi khi pathname thay đổi

### Routing convention

```
/login                    → login/index (layout: false)
/                         → index (Dashboard)
/vocab, /vocab/:id        → Từ vựng list + detail
/grammar, /grammar/:id    → Ngữ pháp list + detail
/exams, /exams/:id        → Đề thi list + detail
/practice/listening       → Bài nghe
/practice/reading         → Bài đọc
/practice/writing         → Bài viết
/practice/speaking-drills → Bài phát âm
/practice/speaking-tasks  → Bài nói
/users                    → Người dùng
/courses, /courses/:id    → Khóa học list + detail
/promo                    → Mã khuyến mãi
/settings                 → Cấu hình hệ thống
```

### ProLayout sidebar

```
Tổng quan
Nội dung      → Từ vựng, Ngữ pháp
Đề thi        → Danh sách đề
Luyện tập     → Nghe, Đọc, Viết, Phát âm, Nói
Quản lý       → Người dùng, Khóa học, Mã khuyến mãi
Hệ thống      → Cấu hình
```

### Dashboard — 4 zones theo role

| Zone | Admin | Staff | Teacher |
|------|-------|-------|---------|
| Alerts (conditional) | ✓ | ✓ | ✗ |
| Key metrics (users, sessions, grading, content) | ✓ | ✓ (no users) | ✗ |
| Action items + Content status + Recent activity | ✓ | ✓ | ✗ |
| Lịch dạy hôm nay + Yêu cầu nghỉ phép | ✗ | ✗ | ✓ |

### Backend admin API

Route prefix: `GET /api/v1/admin/*`, middleware: `auth:api + role:staff`

| Endpoint | Mô tả |
|----------|-------|
| `GET /admin/stats` | users (total/today/week), sessions (active/stuck), grading, content counts |
| `GET /admin/alerts` | grading failures, stuck sessions, missing audio |
| `GET /admin/action-items` | unpublished exams, failed jobs, unpublished vocab |
| `GET /admin/content-status` | published vs draft per content type |
| `GET /admin/recent-activity` | 5 most recent events across users/exams/vocab/grammar |

### Role-based visibility

- **Admin** — tất cả
- **Staff** — không thấy: User management, System Config, Topup packages, grading zone
- **Teacher** — chỉ thấy: lịch dạy hôm nay, yêu cầu nghỉ phép (teacher API chưa implement — RFC 0011 Phase 2)

## Alternatives considered

1. **Filament PHP** — tried, removed (RFC 0013 Withdrawn). UX kém, antd v6 incompatible
2. **SvelteKit + Linear tokens** — tried, removed. UX không đạt, thiếu Pro components ecosystem
3. **Next.js** — overkill cho internal tool, SSR không cần thiết

## Implementation

- [x] Scaffold Umi v4 + antd@5 + pro-components@2
- [x] Auth: login page, token storage, 401 auto-redirect, role guard
- [x] ProLayout: sidebar tiếng Việt, dark mode off, Inter font
- [x] Dashboard: 4 zones, role-based, real API data
- [x] Backend: 5 admin endpoints in `Admin\DashboardController`
- [x] Skeleton pages: 19 pages (list + detail + config)
- [ ] Users CRUD (backend + frontend)
- [ ] Exams CRUD + publish/unpublish
- [ ] Vocab CRUD + inline words/exercises
- [ ] Grammar CRUD + inline structures/examples/exercises
- [ ] Practice CRUD (listening/reading/writing/speaking)
- [ ] Promo codes CRUD
- [ ] System config editor
- [ ] Teacher dashboard (RFC 0011 Phase 2)
