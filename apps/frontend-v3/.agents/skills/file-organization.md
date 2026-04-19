# Skill: File & Type Organization

## Folder structure

```
src/
  lib/              ← shared utilities (api.ts, utils.ts, create-strict-context.ts, skills.ts)
  types/            ← shared domain types khi cross-feature
  components/       ← shared UI (Sidebar, Header)
  features/
    {feature}/
      components/   ← feature UI
      queries.ts    ← TanStack Query options + response types
      types.ts      ← feature-specific types (nếu cần tách)
  routes/           ← TanStack Router file-based
  assets/icons/     ← SVG icons
  styles.css        ← design tokens
```

## Types placement

| Scope | Location |
|---|---|
| 1 file only | Cùng file (inline interface/type) |
| 1 feature | `features/{name}/types.ts` hoặc cùng `queries.ts` |
| Cross-feature | `types/{domain}.ts` hoặc `lib/{name}.ts` |

Rule: **colocate first, promote khi share.** Không tạo `types/` folder trước khi cần.

## Naming

| What | Convention | Example |
|---|---|---|
| Component file | PascalCase.tsx | `ProfileBanner.tsx` |
| Utility/hook file | kebab-case.ts | `create-strict-context.ts` |
| Query file | queries.ts | `features/dashboard/queries.ts` |
| Type file | types.ts hoặc kebab-case | `features/auth/types.ts` |
| Folder | kebab-case | `features/dashboard/` |

## Exports

- **Named export** cho mọi thứ: `export function`, `export interface`
- **Không default export** trừ route component (TanStack Router convention)
- **Không barrel files** (`index.ts` re-export). Import trực tiếp: `#/features/auth/AuthProvider`

## Type patterns

```tsx
// Props — inline trong component file
interface Props {
  profile: OverviewProfile
}
export function ProfileBanner({ profile }: Props) {}

// API response — cùng queries.ts
export interface OverviewData {
  profile: OverviewProfile
  stats: OverviewStats
}

// Shared domain — lib/ hoặc types/
export type SkillKey = "listening" | "reading" | "writing" | "speaking"
```

## Rules

1. Không `any`. Không `@ts-ignore`.
2. Interface cho object shapes. Type cho unions/intersections.
3. Props interface đặt ngay trên component, không export trừ khi cần.
4. API response types colocate với query function.
5. Re-export type khi promote: `export type { User } from "#/features/auth/AuthProvider"`
