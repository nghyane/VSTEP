# VSTEP Frontend

React SPA for the VSTEP exam practice platform. Currently a skeleton -- directories exist but source files are not yet implemented.

- Use Bun, not Node. `bun run`, `bun install` -- never npm/yarn.
- All commands run from `apps/frontend/`.
- Follow the same coding standards as the backend where applicable.

## Commands

- **Install:** `bun install`
- **Dev server:** `bun run dev` (Vite, http://localhost:5173)
- **Build:** `bun run build` (runs `tsc && vite build`)
- **Preview:** `bun run preview` (serve production build locally)

No lint, test, or format scripts configured yet. When adding:
- Use Biome (same as backend) for lint + format.
- Use `bun:test` for testing (same as backend).

## Stack

React 19 . Vite 7.2+ . TypeScript 5.9+ . Bun 1.3+

**Planned (from README):** Tailwind CSS . Zustand or React Query . bun:test

## Architecture

```
src/
  assets/       # Static assets (images, fonts, icons)
  components/   # Reusable UI components
  pages/        # Page-level components (route targets)
  hooks/        # Custom React hooks
  services/     # API service layer (fetch calls to backend)
  types/        # TypeScript type definitions
```

## Environment

- `VITE_API_URL=http://localhost:3000` -- backend API base URL.
- Vite auto-loads `VITE_*` prefixed vars from `.env`. No dotenv needed.

## Style Guidelines

Follow backend conventions where applicable:

- **PascalCase:** components, types, interfaces, enums.
- **camelCase:** functions, variables, hooks (`useAuth`, `useFetchExams`).
- **CONSTANT_CASE:** global constants.
- Never use `console.log` in production code -- use a structured logger or remove before commit.
- Throw errors, don't return error objects.
- No trivial wrappers. No speculative code (YAGNI).
- Prefer `import type { X }` for type-only imports.

## Patterns (When Implementing)

- **Components:** Functional components with hooks. Props typed with interfaces. Export component and its props type.
- **Services:** Plain `async function`s that call `VITE_API_URL`. Handle auth via Bearer token in headers.
- **Hooks:** Custom hooks for data fetching, auth state, form handling.
- **Types:** Share with backend via type sync (`bun run sync-types` planned). Until then, define manually in `src/types/`.
- **No barrel re-exports.** Import directly from the source file.
