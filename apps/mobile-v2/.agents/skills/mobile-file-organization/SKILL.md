---
name: mobile-file-organization
description: "Folder structure, naming conventions, route conventions, export rules for mobile-v2. Load when creating new features or files."
---

# Mobile File Organization

## Folder Structure

```
apps/mobile-v2/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx              # Root layout (auth + query providers)
│   ├── index.tsx                # Entry redirect
│   ├── (auth)/                  # Auth group (login, register)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/                   # Main app group
│       ├── _layout.tsx          # App stack layout
│       ├── (tabs)/              # Bottom tabs
│       │   ├── _layout.tsx
│       │   ├── index.tsx        # Dashboard
│       │   ├── practice.tsx
│       │   ├── exams.tsx
│       │   └── profile.tsx
│       ├── practice/            # Practice routes
│       │   ├── index.tsx
│       │   ├── skills.tsx
│       │   ├── listening/
│       │   ├── reading/
│       │   ├── writing/
│       │   └── speaking/
│       ├── vocabulary/
│       └── exam/
├── src/
│   ├── components/              # Shared UI components
│   ├── features/                # Feature modules
│   │   ├── coin/
│   │   ├── streak/
│   │   └── notification/
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Shared utilities
│   ├── theme/                   # Design tokens
│   └── types/                   # TypeScript types
├── assets/                      # Images, fonts, icons
└── .agents/                     # Skills & docs
```

## Naming Conventions

- **Files**: kebab-case (`depth-button.tsx`, `use-auth.ts`)
- **Components**: PascalCase (`DepthButton`, `Mascot`)
- **Hooks**: `use-*.ts` (`use-auth.ts`, `use-exams.ts`)
- **Types**: `types.ts` in feature folder
- **Exports**: functions `camelCase`, types `PascalCase`, constants `UPPER_SNAKE`
- **Routes**: Vietnamese with diacritics where applicable, kebab-case

## Route Conventions

- Layout route: `name.tsx` renders `<Stack>` or `<Tabs>`
- Index route: `name/index.tsx` for tab content
- Dynamic route: `name/[id].tsx`
- Group: `(groupname)/` — doesn't appear in URL
- Hidden route: `options={{ href: null }}` in layout

## Feature Structure

```
src/features/{name}/
  types.ts       # Types for this feature
  queries.ts     # TanStack Query hooks (read)
  actions.ts     # API actions (write)
  use-*.ts       # Complex hooks (useReducer + useMutation)
  components/    # Feature-specific components
  {name}-store.ts # Zustand store (if needed)
```

## Type Organization

- Colocate in `features/{name}/types.ts` first
- Promote to `src/types/` when shared cross-feature
- API response types in `src/types/api.ts`
- No inline types in `.json<>()` calls — define and import

## Export Rules

- Named exports only. No default exports (except route components).
- Barrel files: OK in `src/components/index.ts` for convenience, but not in features.
- Re-export from `src/index.ts` if truly shared across app.

## Shared Components

Move to `src/components/` when:
- Used in ≥ 2 different route groups
- Has no feature-specific dependencies
- Can work with theme tokens alone

Keep in feature folder when:
- Only used by one feature
- Tightly coupled to feature data types
- Has feature-specific business logic
