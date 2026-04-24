# VSTEP Admin — Agent Instructions

Stack: bun · Vite 8 · React 19 · TanStack Router + Query v5 · Tailwind v4 · Biome · ky · Zustand.

Commands: `bun run dev` (port 5180) · `bun run build` · `bun run lint`.

## Why no UI library

Agents struggle với wrapped libraries (Ant Design, shadcn CLI, Mantine). Indirection + CVA +
auto-generated variants làm agent khó debug và style. Admin panel tự viết primitives — mỗi
component 1 file, props tường minh, tailwind inline. Agent grep component name → ra đúng 1 file.

## Architecture

- **Route → Component → Hook → Lib.** Không vòng.
- **Server state** = TanStack Query. **Auth state** = Zustand (`lib/auth.ts`).
- **Form state** = `useState` local — form admin đơn giản, không cần react-form.
- **API calls** dùng `#/lib/api.ts` (ky). Không `fetch` trực tiếp.
- **URL state** = TanStack Router search params (filter, pagination, tab).

## Component rules

- **1 file = 1 component.** Export named. Ở `#/components/*.tsx`.
- **Không CVA, không variant wrappers.** Props union string: `variant: 'primary' | 'ghost'`.
- **Tailwind inline**, không tách `const styles = ...`. Muốn reuse style → extract component.
- **Token-only.** Dùng `bg-surface`, `text-foreground`, `border-border`. Không hex trong JSX.
  Token defined ở `src/styles.css` → `@theme`.
- **Không import UI library.** Không `antd`, không `@radix-ui/*` wrapper không cần thiết.
- **Radix Primitives** chỉ pull cái nào thực sự cần a11y (Dialog, Popover, Dropdown) và wrap
  1 file duy nhất trong `components/`. Không dùng `radix-ui` bundle.
- **Icons** từ `lucide-react`. Import trực tiếp, không re-export qua `Icon.tsx`.

## Code rules

- **`declare strict` mindset.** No `any`. No `!` non-null assertion. No `as` casts ngoài DOM
  boundary. Dùng early return + null check.
- **No `console.log`.** Errors → TanStack Query `onError` hoặc throw.
- **No inline helpers.** Format date/number dùng `#/lib/utils.ts` hoặc tạo mới ở đó.
- **No hardcode string cho URL API.** Paths tương đối tới `api.prefixUrl = /api/v1`.
- **ApiResponse<T> wrapper.** Backend luôn `{ data: T }`. Frontend dùng `.json<ApiResponse<T>>()`
  rồi access `.data`.
- **Props ≤ 4.** Nhiều hơn → gom thành object hoặc chia component.
- **Route page ≤ 100 lines.** Chỉ compose. Logic phức tạp → split vào component riêng.

## Roles

- **admin** — full access
- **staff** — ẩn User management, System Config, grading internals
- **teacher** — chỉ teacher dashboard (chưa implement)

Guard ở route level (`beforeLoad` trong `_app.tsx`), không scatter check trong components.

## File structure

```
src/
  components/          # Primitives: Button, Input, Card, Modal, Table, ...
  routes/              # TanStack Router file-based
    __root.tsx
    _app.tsx           # Protected layout (sidebar + topbar)
    _app/
      index.tsx        # /
      vocab/index.tsx  # /vocab
      ...
    login.tsx          # /login (public)
  lib/
    api.ts             # ky client + ApiResponse<T>
    auth.ts            # Zustand auth store
    utils.ts           # cn() + shared helpers
  styles.css           # @theme tokens + base
  main.tsx
```

## Workflow

- **Before coding:** grep `src/components/` first. Reuse primitives.
- **New page:** scaffold empty route → verify navigate works → add data fetch → UI.
- **Styling:** copy pattern từ existing component. Không reinvent radius/spacing.
- **Change ≥ 3 files:** plan trước, confirm, rồi code.
- **After edit:** `bun run lint`. Không commit trừ khi user yêu cầu.

## Hard limits

- Component file: 1 concern. Split khi có 2 concern.
- Route component ≤ 100 lines.
- No barrel files (`index.ts` re-export).
- No commented-out code. Xóa là xóa.
