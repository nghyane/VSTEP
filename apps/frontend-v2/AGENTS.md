# VSTEP Frontend v2

VSTEP exam practice platform -- Learner-facing SPA.
Target: Vietnamese university students preparing for the VSTEP English proficiency exam.

## Stack

TanStack Start (RC) + React 19 + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui (new-york) + Biome + Bun

## Domain

VSTEP is a 4-skill English exam (Listening, Reading, Writing, Speaking) with CEFR levels B1/B2/C1.

### Learning Flow (priority order for building)

```
Vocabulary (Anki SRS) → Grammar (theory + practice) → Skill Practice (4 skills) → Mock Exam → Progress
```

This is both the user learning path AND the build priority. Do not build later modules before earlier ones are solid.

### Reference Docs

| Doc | Path | Use when |
|-----|------|----------|
| Improvement plan | `docs/improvement-plan.md` | Feature planning, priority decisions |
| Anki SRS algorithm | `docs/anki-srs-algorithm.md` | Any SRS/vocabulary changes |
| API types | `src/types/api.ts` | Backend contract |

### Feature Modules (independent, no cross-imports)

| Module | Route prefix | Status |
|--------|-------------|--------|
| Auth | `/_auth/` | Copy from v1 |
| Dashboard | `/_app/dashboard` | New |
| Vocabulary | `/_app/vocabulary/` | Port SRS from v1 |
| Grammar | `/_app/grammar/` | New module |
| Practice | `/_app/practice/` | Rebuild |
| Exam | `/_app/exams/` | Rebuild |
| Progress | `/_app/progress/` | Rebuild |
| Classroom | `/_app/classes/` | Rebuild (simplify) |
| Profile | `/_app/profile` | Rebuild |

## Constraints

- Backend is Laravel 13 REST API at `VITE_API_URL` (default `http://localhost:8000`). Frontend is a client that calls this API.
- No server functions for business logic. Server functions only for: proxying external APIs, hiding secrets.
- Use `bun` to run scripts, `bunx` to execute packages. Never `npm`, `npx`, `yarn`, `pnpm`.
- UI language is Vietnamese. Code and comments in English.

## Architecture Rules

### Route pages

- **< 80 lines.** A page imports layout + components + hooks, composes them, nothing else.
- Logic lives in hooks (`src/hooks/`) and co-located components (`-components/`).
- No inline `api.get()` calls in pages. Always go through a custom hook.

### Components

- Co-located: each route folder has `-components/` for route-specific components.
- Shared across 2+ routes: `src/components/common/`.
- shadcn primitives: `src/components/ui/` -- customize freely, preserve accessibility.
- One component per file. File name = PascalCase.
- `interface` for props. Destructure with explicit types.
- Use `cn()` from `#/lib/utils` for className merging.

### Data flow

```
API (snake_case) → lib/api.ts (transform) → hook (camelCase) → component → UI
```

- `api.ts` transforms snake_case ↔ camelCase automatically.
- Pagination: `{ data: T[], meta: { page, limit, total, totalPages } }`.
- Error shape: `{ message: string, errors?: Record<string, string[]> }`.
- Auth: JWT Bearer token in `Authorization` header. Stored in localStorage.

### State management

- Server state: TanStack Query (`useQuery` / `useMutation`). Configure via `queryOptions` for loader+query sharing.
- Local state: `useState` / `useReducer`. Context only when shared across 3+ components.
- No Zustand, Jotai, Redux without explicit approval.

### Feature module isolation

- Modules (vocabulary, grammar, practice, exam, progress) must NOT import from each other.
- Shared utilities go in `src/lib/`. Shared types go in `src/types/`. Shared components go in `src/components/common/`.

### Level system

- Backend returns CEFR levels (`B1`, `B2`, `C1`) in API responses.
- Vocabulary UI displays CEFR labels directly (`B1`, `B2`, `C1`).
- Practice UI maps to display labels: B1 → "Cấp 1", B2 → "Cấp 2", C1 → "Cấp 3".
- Create a shared helper for this mapping. Do not hardcode in components.

## Styling

- Tailwind CSS v4 with `@theme inline` block in `src/styles.css`.
- Use CSS variable tokens (`bg-background`, `text-primary`, `text-muted-foreground`). Never hardcode colors.
- Font: Inter (loaded via Google Fonts in styles.css).
- Use shadcn component instead of raw `div` when one exists.
- No inline styles. No glow effects, neon shadows, gradients unless explicitly requested.
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons`. **No lucide-react anywhere.**
- After adding a shadcn component via CLI, replace any lucide-react imports with hugeicons equivalents immediately.
- Dark mode: supported via `.dark` class on `<html>`. All tokens have dark variants in styles.css.

## Routing

- File-based routing in `src/routes/`. Route tree auto-generated.
- Layout routes: `_auth.tsx` (login/register), `_app.tsx` (authenticated, sidebar layout).
- Auth guard via `beforeLoad` on `_app.tsx`.
- Keep route files thin -- delegate to feature components.

## Imports

- Use path alias `#/` (configured in tsconfig + package.json imports). Example: `#/lib/api`, `#/components/ui/button`.
- `@/` also works (tsconfig paths). Prefer `#/` for new code (Node subpath imports, no plugin needed).
- No relative paths beyond `./` (co-located files only).
- No barrel files (`index.ts` re-exports). Exception: `types/index.ts` with `export type` only.

## Quality

- TypeScript strict mode with `noUncheckedIndexedAccess: true`.
- No `any`. No `as` casts without a comment explaining why.
- No `TODO`, `FIXME`, placeholder content, unused imports, dead code, commented-out code.
- All interactive states: loading (skeleton), error (message + retry), empty (illustration + CTA), success.
- Accessibility baseline: keyboard navigation, ARIA labels for interactive elements, focus management for dialogs/modals.
- Biome handles format + lint. Follow `biome.json` rules. No `// biome-ignore` unless genuine false positive with explanation.

## Agentic Workflow

Human only previews. Agent must deliver shippable code.

### Before presenting code

```bash
bunx --bun tsc --noEmit      # Type check
bunx biome check --fix .      # Format + lint
```

- If a command fails, read the error, fix it, re-run. Ask human only after 3 failed attempts on the same error.
- When presenting: list changed files, what to verify. No code explanations unless asked. No "would you like..." follow-ups.

### Commands

```bash
bun dev                             # Dev server (port 3000)
bun build                           # Production build
bunx --bun shadcn@latest add <name> # Add shadcn component
bunx biome check --fix .            # Format + lint
bunx --bun tsc --noEmit             # Type check
```

## Permissions

**Do without asking:** read/list files, type check, lint, format, fix errors, add shadcn components, create files following existing patterns.

**Ask first:** `bun add` new packages, delete files, modify `components.json` / `tsconfig.json` / `vite.config.ts`, change route structure, introduce new architectural patterns.

## MCP Server

Connected to **shadcn/ui MCP Server**. Before writing UI code:

1. Search MCP for component docs, props, variants. Do not hallucinate props.
2. Check if component exists in `#/components/ui/` before using.
3. If missing, install via `bunx --bun shadcn@latest add <component>`.
4. After adding, replace all `lucide-react` imports with `@hugeicons/react` equivalents.
