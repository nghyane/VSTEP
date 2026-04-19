---
name: layout-patterns
description: "App shell, sidebar, header, adaptive content width, focus mode. Load when creating pages or modifying layout."
---

# Layout Patterns

- App shell: `src/routes/_app.tsx` (sidebar + outlet)
- Sidebar: `src/components/Sidebar.tsx` — 260px fixed
- Header: `src/components/Header.tsx` — page title + gem/streak/avatar
- Adaptive width: dashboard=full, reading=max-w-3xl, form=max-w-2xl
- Focus mode: separate layout route — no sidebar, no header
