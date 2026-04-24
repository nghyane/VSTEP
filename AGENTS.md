# VSTEP

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145).

## Apps

| Directory | Status | Stack |
|-----------|--------|-------|
| `apps/backend-v2/` | Active | PHP 8.4 · Laravel 13 |
| `apps/frontend-v3/` | Active | React 19 · Vite · TanStack Router |
| `apps/admin/` | Active | React 19 · Vite · TanStack Router |
| `apps/mobile-v2/` | Active | Expo · React Native |
| `apps/frontend-v2/` | Legacy | Do not touch |
| `apps/frontend/` | Legacy | Do not touch |
| `apps/mobile/` | Legacy | Do not touch |
| `apps/_deprecated/` | Legacy | Do not touch |

Each active app has its own `AGENTS.md` with commands, architecture, and code rules. Read that first before working in that directory.

## Boundaries

- Never import code between apps. Each app is fully isolated.
- API contract owned by `backend-v2`. Frontend and mobile are consumers only.
- UI mockup source of truth: `apps/mockup/`

## Git

- `git pull --no-rebase` (merge) by default. Never rebase, force-push, or `reset --hard` without asking.
- Stage only files related to the current change.
