# Frontend V3 — Agent Instructions

These instructions are for code operation only. Do not use this file as documentation evidence for product scope, report metrics, UI status, or dependency versions; verify those from source and package/config files.

## Commands

- Dev: `bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`

## Architecture

- Keep route files thin; compose components/hooks and delegate logic.
- Server state belongs in TanStack Query. Shared client state belongs in the existing store pattern. Local-only state can stay local.
- Avoid circular dependencies.
- Audit existing components, hooks, types, and utilities before creating new ones.

## Code Rules

- No `any`, no `console.log`, no commented-out code.
- No non-null assertions unless a framework boundary leaves no cleaner option.
- Avoid casts in business logic; prefer narrowing and early returns.
- Keep API response typing centralized; do not inline ad-hoc JSON shapes when shared types exist.
- Do not put mock data in production components.
- Use shared utilities for formatting/date/math when they exist.
- Comments explain why, not what.

## Workflow

- Change touching more than 3 files: plan briefly before editing.
- Run `bun run lint` after code edits when feasible.
- Do not commit unless the user requests it.
