# Mobile V2 — Agent Instructions

These instructions are for code operation only. Do not use this file as documentation evidence for product scope, report metrics, feature status, UI details, or dependency versions; verify those from source and package/config files.

## Commands

- Start: `bun run start`
- Android: `bun run android`
- iOS: `bun run ios`
- Lint: `bun run lint`
- Typecheck: `bun run typecheck`

## Architecture

- Keep route/screen files thin; delegate logic to components, hooks, and lib modules.
- Server state belongs in TanStack Query. Shared client state follows existing app patterns.
- Avoid circular dependencies.
- Check existing frontend/backend/mobile patterns before creating new abstractions.

## Code Rules

- No `any`, no `console.log`, no commented-out code.
- No non-null assertions unless a framework boundary leaves no cleaner option.
- Avoid casts in business logic; prefer narrowing and early returns.
- Do not store secrets in insecure client storage.
- Do not put mock data in production components.
- Use shared theme/tokens/utilities where they exist; avoid hardcoded styling values.
- Comments explain why, not what.

## Workflow

- Change touching more than 3 files: plan briefly before editing.
- Run `bun run lint` and `bun run typecheck` after code edits when feasible.
- Do not commit unless the user requests it.
