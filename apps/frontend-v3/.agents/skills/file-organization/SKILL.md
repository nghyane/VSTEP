---
name: file-organization
description: >
  Where files go and how they are named. Load before creating any new file,
  folder, feature module, or route — or when deciding where to put a type,
  component, or utility.
---

# File Organization

## Folder structure

- `src/lib/` — shared modules, flat, short names: `api.ts`, `auth.ts`, `toast.ts`
- `src/features/{name}/` — `types.ts`, `queries.ts`, `actions.ts`, `components/`
- `src/types/` — shared types used cross-feature
- `src/assets/icons/` — SVG icons
- `src/routes/` — TanStack Router file-based routes

## Naming

- Files: kebab-case, no suffix (`-store`, `-handler`, `-service`, `-utils`)
- Hooks: `use-*.ts`
- Exports: functions `camelCase`, types `PascalCase`, constants `UPPER_SNAKE`
- Components: `PascalCase.tsx`
- Routes: Vietnamese no-diacritics kebab-case (`luyen-tap`, `tu-vung`)

## Route conventions

- Layout: `name.tsx` renders `<Outlet />`, content in `name/index.tsx`
- Dynamic: `$paramName.tsx`
- Pathless layout: `_name.tsx` (e.g. `_app.tsx`, `_focused.tsx`)

## Rules

- Named exports only. No default exports (except route components). No barrel files.
- Colocate types first, promote to `types/` when shared cross-feature.
- Reference: `src/features/dashboard/` as canonical example.
