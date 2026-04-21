---
name: layout-patterns
description: "App shell, sidebar, header, adaptive content width, focus mode, error boundary. Load when creating pages or modifying layout."
---

# Layout Patterns

## App shell

- `src/routes/_app.tsx` — sidebar + outlet, auth guard via useEffect
- Sidebar: `src/components/Sidebar.tsx` — 260px fixed, icon alignment via w-8 h-6 container
- Header: `src/components/Header.tsx` — page title + gem/streak/avatar + ProfileDropdown

## Content width

- Dashboard: full width
- Reading/form: max-w-3xl or max-w-2xl
- Focus mode: max-w-lg centered

## Focus mode

- Layout route: `src/routes/_focused.tsx` — no sidebar, no header
- Shared components: `FocusBar` (progress + close), `FocusComplete`, `FocusEmpty`
- `BackLink` type for navigation props
- Used for: flashcard SRS, exercises, exams
