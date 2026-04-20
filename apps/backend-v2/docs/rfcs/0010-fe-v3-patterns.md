---
RFC: 0010
Title: Frontend V3 — Code Patterns & Conventions
Status: Draft
Created: 2025-07-14
Updated: 2025-07-14
---

# RFC 0010 — Frontend V3 Code Patterns

## Summary

Chuẩn hóa patterns cho FE v3. Mọi code phải tuân thủ, không ngoại lệ.

## 1. Data Fetching

### Pattern: useQuery + select

Mỗi component tự fetch data cần. Không prop drilling.

```tsx
// Component tự query, select đúng phần cần
function MyComponent() {
  const { data } = useQuery({ ...overviewQuery, select: selectMyData })
  if (!data) return null
  // render
}
```

- Query functions + selectors: `features/{domain}/queries.ts`
- TanStack dedup cùng queryKey → 1 API call dù nhiều components
- `select` memoized → chỉ re-compute khi raw data đổi
- Page route chỉ compose components, không transform data

### Không được

- Prop drill data qua >1 level
- Transform data trong page route rồi pass props
- `useEffect` + `setState` cho server data
- Mock data trong components (tạo API endpoint nếu chưa có)

## 2. Auth

### Pattern: tokenStorage + AuthProvider

```
tokenStorage (lib/token-storage.ts)
  ↑ single owner of persistence
  ├── api.ts reads token (beforeRequest hook)
  ├── api.ts clears on 401 (afterResponse hook)
  └── AuthProvider reads/writes on login/logout
```

- `tokenStorage` — duy nhất biết localStorage keys
- `api.ts` — dùng `tokenStorage.getAccess()`, không import localStorage
- `AuthProvider` — dùng `tokenStorage`, expose `useAuth()` hook
- 401 → `tokenStorage.clear()` + redirect `/`

### Không được

- `localStorage.getItem/setItem` ngoài `token-storage.ts`
- Token logic trong components
- Hardcode storage key strings ngoài `token-storage.ts`

## 3. Domain Config

### Pattern: Single registry array

```ts
// lib/skills.ts — single source of truth
export const skills: readonly Skill[] = [...]
export const skillByKey = Object.fromEntries(...)
```

- 1 array chứa tất cả: key, label, icon, color, route, desc
- Derive lookup map từ array
- Components import `skills` iterate, hoặc `skillByKey[key]` lookup
- Không tạo local arrays/maps duplicate

### Domain constants

```ts
// lib/vstep.ts — VSTEP-specific values
export const levelToBand = { A2: 3.5, B1: 4.0, B2: 6.0, C1: 8.5 }
export const heatmapLevels = [0, 30, 60, 90]
```

- Tất cả magic numbers → `lib/vstep.ts`
- Components nhận qua select hoặc import trực tiếp
- Không hardcode numbers trong components

### Không được

- `const TARGET = 6.0` trong component file
- `const SKILL_KEYS = [...]` local array
- Duplicate skill definitions

## 4. Icons

### Pattern: SVG as React component

```tsx
import VolumeIcon from "#/assets/icons/volume-small.svg?react"
<VolumeIcon className="h-10 w-auto" style={{ color: config.color }} />
```

- Import `?react` suffix → vite-plugin-svgr → React component
- SVG dùng `currentColor` → control màu qua `style={{ color }}`
- Không dùng `<img src>` cho icons cần dynamic color

### Khi nào dùng `<img src>`

- Icons không cần dynamic color (landing page features, static decorative)
- Icons có nhiều colors hardcode trong SVG (streak, gem — multi-tone)

## 5. Components

### Route page (≤80 lines)

```tsx
function DashboardPage() {
  return (
    <>
      <Header title="Tổng quan" />
      <div className="px-10 pb-12 space-y-8">
        <ProfileBanner />
        <StatsRow />
      </div>
    </>
  )
}
```

- Chỉ compose, không logic
- Không transform data
- Không inline JSX dài

### Feature component

- Self-contained: useQuery + select + render
- `if (!data) return null` cho loading
- Shared utils từ `lib/utils.ts`
- Dynamic colors qua `style={{ color: config.color }}`, không Tailwind class injection

### No-op UI

- Button/link chưa implement → `disabled` + title="Sắp ra mắt"
- Không render clickable element không có handler

## 6. Styling

### Tokens

- `src/styles.css` `@theme` block = source of truth
- Semantic names: `bg-primary`, `text-foreground`, `border-border`
- Không hardcode hex trong components
- Tailwind v4 custom property: `rounded-(--radius-banner)` (parentheses)

### Component classes

- `src/styles.css` `@layer components` cho `.btn`, `.card`
- Dynamic class merging: `cn()` từ `lib/utils.ts`
- Dynamic colors: `style={{ color/background: cssVar }}` — không inject Tailwind class names as data

## 7. File Organization

```
src/
  lib/              ← shared (api, utils, skills, vstep, token-storage, create-strict-context)
  types/            ← shared types (auth.ts)
  components/       ← shared UI (Sidebar, Header)
  features/
    {domain}/
      components/   ← feature UI
      queries.ts    ← queryOptions + selectors
  routes/           ← TanStack Router file-based
  assets/icons/     ← SVG files
  styles.css        ← design tokens
```

- Named exports. No default exports (trừ route).
- No barrel files.
- Types colocate → promote khi share.

## Implementation

Checklist fix existing violations:

- [ ] SkillsSection: tạo API endpoint, bỏ MOCK_PROGRESS
- [ ] FoundationSection: tạo API endpoint, bỏ hardcode ITEMS
- [ ] NextAction: derive từ weakest skill (GapAnalysis data)
- [ ] Landing page: tách sections ≤80 lines
- [ ] LoginPage "Đăng ký": disable + tooltip
- [ ] Sidebar "Xem thêm": disable + tooltip
- [ ] Heatmap: dùng `heatmapLevels` từ vstep.ts
- [ ] main.tsx: fix `undefined!` assertion
- [ ] StatsRow: show band khi chart !== null
- [ ] GapAnalysis: `cn()` thay template literal
- [ ] Remove unused `skillByKey` export nếu không dùng
- [ ] Sidebar/Header/Landing icons: consistent `?react` hoặc `<img>`
- [ ] Error states: skeleton + retry button
