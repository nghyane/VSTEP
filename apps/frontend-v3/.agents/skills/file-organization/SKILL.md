---
name: file-organization
description: "Folder structure, type placement, naming conventions, route conventions, export rules. Load when creating new features or files."
---

# File Organization

## Folder structure

- `src/lib/` — shared modules, flat, short names: `api.ts`, `auth.ts`, `toast.ts`
- `src/features/{name}/` — `types.ts`, `queries.ts`, `actions.ts`, `use-*.ts`, `components/`
- `src/types/` — shared types used cross-feature
- `src/assets/icons/` — SVG icons
- `src/routes/` — TanStack Router file-based routes

## Naming

- Files: kebab-case, no suffix (`-store`, `-handler`, `-service`, `-utils`)
- Hooks: `use-*.ts` (in feature folder, not lib — unless truly shared)
- Exports: functions `camelCase`, types `PascalCase`, constants `UPPER_SNAKE`
- Components: `PascalCase.tsx`
- Routes: Vietnamese no-diacritics kebab-case (`luyen-tap`, `tu-vung`)

## Route conventions

- Layout: `name.tsx` renders `<Outlet />`, content in `name/index.tsx`
- Dynamic: `$paramName.tsx`
- Pathless layout: `_name.tsx` (e.g. `_app.tsx`, `_focused.tsx`)
- Route pages ≤ 80 lines — compose only, logic in hooks/components

## Types

- Colocate in `features/{name}/types.ts` first
- Promote to `src/types/` when shared cross-feature
- Shared prop types (e.g. `BackLink`) go in feature `types.ts`
- No inline types in `.json<>()` calls or component props — define and import

## Rules

- Named exports only. No default exports (except route components). No barrel files.
