---
RFC: 0015
Title: Admin Panel — Vite + React + Tailwind v4 (no UI library)
Status: Accepted
Created: 2026-04-22
Updated: 2026-04-22
Supersedes: 0014
---

# RFC 0015 — Admin Panel — Vite + Tailwind v4, tự viết primitives

## Summary

Admin panel tại `apps/admin` dùng **Vite + React 19 + TanStack Router/Query + Tailwind v4**,
không dùng UI library. Tự viết primitives trong `src/components/` — mỗi component 1 file,
props tường minh, tailwind inline. Backend vẫn dùng `GET /api/v1/admin/*` group như RFC 0014.

## Motivation

- **RFC 0014 (Umi + Ant Design Pro)** có UX tốt cho end user, nhưng **agent khó làm việc** với
  Pro Components: wrapper sâu, props nhiều, style bị lock, khó override layout.
- **Shadcn đã cân nhắc** — nhưng default theme (zinc + rounded-md + CVA) quá đại trà, agent
  cũng khó điều chỉnh style khi mỗi component có variant system riêng.
- **Admin panel chỉ cần ~10 primitives** (Button, Input, Select, Modal, Table, Card, Badge,
  Sidebar, Tabs, Toast). Tự viết hết → agent grep tên component → ra đúng 1 file → đọc xong
  hiểu luôn. Không indirection.
- Đồng bộ stack với `frontend-v3` giảm switching cost giữa 2 apps.

## Design

### Tech stack

```
apps/admin/
  Vite 8              — dev server + build
  React 19            — UI
  TanStack Router     — file-based routing + type-safe links + beforeLoad guards
  TanStack Query      — server state
  Tailwind v4         — styling (via @tailwindcss/vite)
  Zustand             — auth state (persist via localStorage)
  ky                  — HTTP client
  lucide-react        — icons (thêm khi cần)
  Biome               — lint + format
```

### Không dùng

- Ant Design, shadcn, Mantine, MUI — lý do đã nêu ở Motivation.
- CVA, `class-variance-authority` — props union string đủ cho admin.
- Barrel files, re-export indirection.
- React Hook Form, `@tanstack/react-form` — admin form đơn giản, `useState` đủ.

### Design tokens (`src/styles.css`)

```css
@theme {
  --font-sans: "Inter", ...;
  --color-primary: oklch(0.58 0.18 255);     /* blue */
  --color-foreground: oklch(0.22 0.01 260);
  --color-muted / subtle / border / surface / background
  --color-danger / warning / success (+ tint)
  --radius-button: 8px;
  --radius-card: 10px;
}
```

Component rule: chỉ dùng semantic tokens. Muốn đổi palette → sửa 1 file.

### Auth flow

- Login tại `/login` (public route) — POST `/api/v1/auth/login`, trả `{ token, user }`
- Role check: chỉ `admin | staff | teacher` được vào
- Zustand store persist token + user vào localStorage
- `api.ts` ky client: `beforeRequest` gắn Bearer, `afterResponse` nhận 401 → clear + redirect
- Route guard: `_app.tsx` `beforeLoad` kiểm token + role, throw `redirect({ to: "/login" })`

### Routing (TanStack Router file-based)

```
/login                      → routes/login.tsx (public)
/_app                       → routes/_app.tsx (sidebar + topbar, guarded)
  /                         → routes/_app/index.tsx (Dashboard)
  /vocab, /vocab/:id        → routes/_app/vocab/{index,$id}.tsx
  /grammar, /grammar/:id
  /exams, /exams/:id
  /practice/{listening,reading,writing,speaking-drills,speaking-tasks}
  /users
  /courses, /courses/:id
  /promo
  /settings
```

### Sidebar groups (tiếng Việt)

```
Tổng quan → Dashboard
Nội dung  → Từ vựng, Ngữ pháp
Đề thi    → Danh sách đề
Luyện tập → Nghe, Đọc, Viết, Phát âm, Nói
Quản lý   → Người dùng, Khóa học, Khuyến mãi
Hệ thống  → Cấu hình
```

### Backend admin API (giữ từ RFC 0014)

Route prefix: `GET /api/v1/admin/*`, middleware: `auth:api + role:staff`

| Endpoint | Mô tả |
|----------|-------|
| `GET /admin/stats` | users, sessions, grading, content counts |
| `GET /admin/alerts` | grading failures, stuck sessions, missing audio |
| `GET /admin/action-items` | unpublished exams, failed jobs, unpublished vocab |
| `GET /admin/content-status` | published vs draft per content type |
| `GET /admin/recent-activity` | 5 most recent events |

### Role-based visibility

- **Admin** — tất cả
- **Staff** — ẩn User management, System Config, grading internals
- **Teacher** — chỉ teacher dashboard (RFC 0011 Phase 2)

Guard ở route level, không scatter trong components.

## Rules cho agent (AGENTS.md)

- 1 file = 1 component ở `src/components/*.tsx`
- Không CVA, props union string: `variant: 'primary' | 'ghost'`
- Tailwind inline, token-only (`bg-surface`, `text-foreground`)
- Không import UI library; Radix Primitives chỉ khi thực sự cần a11y
- No `any`, no `!`, no `as` casts ngoài DOM boundary
- Component file: 1 concern. Route page ≤ 100 lines
- Grep `src/components/` trước khi viết mới

## Alternatives considered

1. **Filament PHP (RFC 0013)** — withdrawn. UX kém, antd v6 incompatible.
2. **Umi + Ant Design Pro (RFC 0014)** — accepted rồi superseded. Pro Components agent
   khó control, layout lock.
3. **shadcn/ui** — default theme quá đại trà, CVA variant system làm agent khó debug
   và override.
4. **Tremor** — dashboard-first nhưng "look is Tremor", không identity riêng.
5. **Tailwind Catalyst** — paid ($299), tuned cho admin, đẹp hơn shadcn, nhưng
   bản chất agent-friendly tương đương Hướng 1 (Vite + tự viết). Không cần chi.

## Implementation

- [x] Xóa `apps/admin` (Umi scaffold)
- [x] Scaffold Vite 8 + React 19 + Tailwind v4 + TanStack Router/Query
- [x] Design tokens (`styles.css` @theme)
- [x] Primitives: Button, Input, Card
- [x] Layouts: Sidebar, Topbar, `_app` protected route
- [x] Auth: ky client + Zustand store + 401 redirect + login page
- [x] Dashboard skeleton (4 stat cards)
- [x] `AGENTS.md` riêng cho admin
- [ ] Backend: 5 admin endpoints trong `Admin\DashboardController` (giữ từ RFC 0014)
- [ ] Primitives bổ sung: Modal, Table (TanStack Table headless), Select, Tabs, Badge, Toast
- [ ] Dashboard wire-up data
- [ ] Users CRUD (backend + frontend)
- [ ] Exams CRUD + publish/unpublish
- [ ] Vocab CRUD + inline words/exercises
- [ ] Grammar CRUD + inline structures/examples/exercises
- [ ] Practice CRUD (listening/reading/writing/speaking)
- [ ] Promo codes CRUD
- [ ] System config editor
- [ ] Teacher dashboard (RFC 0011 Phase 2)
