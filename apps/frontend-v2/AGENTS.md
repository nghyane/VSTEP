# Frontend-v2 — Agent Instructions

React 19, TypeScript, TanStack Router, Tailwind v4, shadcn/ui. Mọi PR phải pass `pnpm exec tsc --noEmit` và `pnpm exec biome check`.

## Architecture

- **Mock-first, API-later.** Mock data: `lib/mock/*.ts`. Query layer: `lib/queries/*.ts`. Replace `queryFn: mockFetch*` → `apiFetch*` when backend ready. Components never import mock directly.
- **Data in the model, not in lookup files.** Data that varies per exercise (e.g., `sampleMarkers`) lives in the exercise interface, not in a separate `Record<id, ...>` file.
- **Match-string over character offset.** When storing text positions (highlight markers), store `{ match, occurrence }` and compute offset at render via `matchToRange()`. Never store hand-typed `{ start, end }`.
- **State split.** TanStack Query for server state. `localStorage` for user preferences. `sessionStorage` for ephemeral results (submit → result page).
- **Dependency flow is downward.** `route → component → hook → lib`. No reverse dependencies. No circular imports.

## Code

- **TypeScript strict.** No `any`. No `@ts-ignore`. `@ts-expect-error` only with explanation.
- **Biome clean.** `pnpm exec biome check` must pass. No disable comments without explanation.
- **Comments explain why, not what.** If a comment restates the code, delete it and rename instead.
- **No console.log.** Remove before commit.
- **No barrel files** (`index.ts` re-export). Use `#/` alias for imports, not `../../../`.

## Operations

- **No tests unless explicitly requested.**
- **No README/docs files unless explicitly requested.**
- **Stage only files related to the current change.**
- **No `git commit` unless user explicitly asks.**
- **Always run `biome check` after editing code.**

## Hard limits

- Line length ≤ 100 chars. **[biome]**
- Cognitive complexity ≤ 15 per function.
- File ≤ 300 lines. Split if exceeded.
- Function ≤ 50 lines. Extract helper if exceeded.
- Function parameters ≤ 3. Use object if more.
- Route page file ≤ 80 lines. Page only composes layout + component + hook.

## Guardrails — auto-reject

- No `setTimeout(() => setState(...), 0)` to "fix" render order.
- No `setInterval` polling to wait for state.
- No global mutable state outside query cache and router.
- No inline business logic in JSX event handler. Extract named function.
- No `dangerouslySetInnerHTML` with user data.
- No secrets in client code.
- No commented-out code. Git remembers.
- No unused imports, variables, parameters. **[tsc + biome]**
- No consumer = delete. Component, hook, util, type with zero imports → remove.

## Skills

Khi gặp pattern/convention mới chưa có trong skill: **dừng lại**, báo user và đề xuất. Chỉ cập nhật skill file khi user đồng ý.

## Definition of done

1. `tsc --noEmit` pass.
2. `biome check .` pass.
3. `build` pass.
4. Four states handled: loading, error, empty, success.
5. Keyboard navigable end-to-end.
6. Dark mode renders correctly.
7. No unused dependencies.
