# Admin — Agent Instructions

These instructions are for code operation only. Do not use this file as documentation evidence for product scope, report metrics, UI status, or dependency versions; verify those from source and package/config files.

## Commands

- Dev: `bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`

## Architecture

- Keep route files thin; delegate logic to feature components, hooks, API modules, and utilities.
- Server state belongs in TanStack Query. Shared client state follows existing app patterns.
- Avoid cross-feature imports unless the dependency is intentionally shared.
- Audit existing components, hooks, types, and utilities before creating new ones.

## UI Code

- Follow the current UI/component system already used in the app; verify from existing source before adding patterns.
- Use theme tokens and shared components where they exist.
- Do not introduce a new UI library or design system without explicit approval.
- Keep forms and API error handling consistent with nearby feature code.

## Code Rules

- No `any`, no `console.log`, no commented-out code.
- No non-null assertions unless a framework boundary leaves no cleaner option.
- Avoid casts in business logic; prefer narrowing and early returns.
- Keep API response typing centralized; do not inline ad-hoc JSON shapes when shared types exist.
- Do not put mock data in production components.
- Comments explain why, not what.

## Workflow

- Change touching more than 3 files: plan briefly before editing.
- Run `bun run lint` after code edits when feasible.
- Do not commit unless the user requests it.
