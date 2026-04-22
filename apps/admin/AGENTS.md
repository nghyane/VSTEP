# VSTEP Admin — Agent Instructions

Stack: bun · Vite · SvelteKit · Tailwind v4 · Biome.

Commands: `bun run dev` · `bun run build` · `bun run lint`.

## Architecture

- Route → Component → Store/API. Không vòng.
- Server state: `fetch` + Svelte 5 `$state` + `$derived`. Không dùng thư viện query.
- Auth: `src/lib/auth.svelte.ts` — Svelte 5 runes store.
- No UI library. Custom components theo design tokens trong `app.css`.

## Design tokens

Xem `src/app.css`. Rule:
- Components dùng CSS variables (`var(--color-primary)`), KHÔNG hardcode hex.
- Sidebar: dark (`--color-sidebar-*`). Content: light (`--color-surface`, `--color-background`).
- Radius flat hơn learner app: `--radius-md` (6px) cho buttons/inputs, `--radius-lg` (8px) cho cards.

## Layout

- Sidebar 240px fixed, dark. Content area adaptive.
- Sidebar items: icon + label. Active = `--color-sidebar-active`.
- Page header: title + actions (right-aligned).
- Tables: `.table` class, không border ngoài, hover row.

## Code rules

- Function ≤ 40 lines. Component ≤ 80 lines.
- No `any`. No `console.log`. No inline styles.
- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`. Không dùng Svelte 4 syntax.
- API calls qua `src/lib/api.ts`. Không fetch trực tiếp trong components.
- Auth guard: check `auth.isAuthenticated` trong `+layout.svelte`, redirect `/login` nếu không có token.

## API

Backend: `VITE_API_URL` (default `http://localhost:8000`).
Auth: Bearer token trong header.
Response shape: `{ data: T }`.

## Roles

Admin dashboard chỉ cho role `admin` và `staff`. Check từ JWT claim sau login.
