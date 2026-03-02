# AGENTS.md

## Stack

Bun · Vite · React 19 · TypeScript · TanStack Router (file-based, client-side) · Tailwind CSS v4 · shadcn/ui · Biome (format + lint)

## Constraints

- Client-side SPA only. No SSR, SSG, server components, server functions.
- Do not use `"use server"`, `getServerSideProps`, server loaders, or React Server Components.
- Do not suggest migrating to Next.js, Remix, or TanStack Start.
- Use `bun` to run scripts, `bunx` to execute packages. Never use `npm`, `npx`, `yarn`, or `pnpm`.

## MCP Server

Connected to **shadcn/ui MCP Server**. Before writing UI code:

1. Search MCP for component docs, props, and variants. Do not hallucinate props.
2. Check if the component exists in `@/components/ui/` before using it.
3. If missing, install via `bunx --bun shadcn@latest add <component>`.
4. After adding a new shadcn component, replace all `lucide-react` imports with the equivalent `@hugeicons/react` icon. Search hugeicons docs for the correct icon name — do not guess.

## Agentic Workflow

Human only previews. Agent must deliver shippable code.

- Run and fix all issues before presenting:
  ```bash
  bunx tsc --noEmit          # Type check
  bunx biome check --fix .   # Format + lint
  bunx vitest run            # Tests
  ```
- If a command fails, read the error, fix it, re-run. Ask human only after 3 failed attempts on the same error.
- No `TODO`, `FIXME`, placeholder content, `any` types, unused imports, dead code, or commented-out code.
- All interactive states handled: loading, error, empty, success.
- Smallest diff possible. Do not refactor unrelated code.

When presenting: list changed files, rationale for non-obvious decisions, what to click/see to verify. No code explanations. No "would you like me to..." follow-ups.

## Commands

```bash
bun dev
bun build
bunx --bun shadcn@latest add <component-name>
bunx biome check --fix .
bunx tsc --noEmit
```

Follow `biome.json` for all formatting and lint rules. Do not override Biome rules with inline comments (`// biome-ignore`) unless there is a genuine false positive — explain why in the comment.

## Code Rules

### Components

- Functional components with TypeScript. No class components.
- shadcn primitives from `@/components/ui/` — do not edit these files.
- Composite components in `@/components/common/` (used across 2+ routes).
- Feature-specific components in `@/components/features/` (scoped to one route/domain).
- Use `cn()` from `@/lib/utils` for conditional classes.
- `interface` for props. Destructure with explicit types.
- One component per file. File name = component name in PascalCase.

### Styling

- Use Tailwind classes and CSS variable tokens (`bg-background`, `text-primary`). Never hard-code colors.
- Theme extensions in `@theme {}` block in CSS, not a config file.
- Use shadcn component instead of raw `div` when one exists.
- No inline styles.
- No glow effects, neon shadows, colored box-shadows, or glowing borders.
- No AI-style icons (✨ sparkles, 🪄 wands, 🤖 robots) unless explicitly requested.
- Use `@hugeicons/react` for all icons. No `lucide-react` anywhere — including inside `@/components/ui/`. After adding a shadcn component, replace lucide icons immediately.
- No gratuitous gradients, shimmering text, or floating animations.

### Imports

- Use path aliases (`@/`). No relative paths beyond `./`.
- Import directly from source file. No barrel files (`index.ts` re-exports).
- Exception: `types/index.ts` with `export type` only is acceptable.

### State

- Route-critical data: use TanStack Router `loader` to pre-fetch before render. Wrap fetch calls with `queryOptions` so the loader and `useQuery` share the same cache key.
- Post-render data (pagination, search, lazy content): `useQuery` / `useMutation` directly in components.
- Do not duplicate fetching — if data is loaded via `loader`, consume it with `useSuspenseQuery` using the same `queryOptions`, do not call `useQuery` with a separate key.
- Local state: `useState` / `useReducer`. Context only when truly shared.
- No Zustand, Jotai, Redux without approval.

### Routing

- Routes in `app/routes/`. Auto-generated route tree — do not manually register.
- No server-side APIs in route components. Keep route files thin — delegate to feature components.
- Auth checks via `beforeLoad` or wrapper components.

### Naming

- Components: `PascalCase.tsx`
- Hooks: `useXxx.ts`
- Utilities: `camelCase.ts`
- Routes: `kebab-case.tsx`

### Environment

- Client-exposed env vars must use `VITE_` prefix.
- Never put secrets in `VITE_` vars — they are in the bundle.

## Permissions

**Do without asking:** read/list files, type check, lint, format, run tests, fix errors, add shadcn components, create files following existing patterns.

**Ask first:** `bun add` new packages, deleting files, modifying `components.json` / `tsconfig.json` / `vite.config.ts`, changing route structure, introducing new patterns.