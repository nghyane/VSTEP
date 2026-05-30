# VSTEP — Agent Instructions

These instructions are for repository operation only. Do not use this file as a source for product facts, report metrics, architecture documentation, or technology versions; verify those from code and package/config files.

## App Boundaries

- Each app is isolated. Do not import code across apps.
- Work only in the app or docs area relevant to the user request.
- Legacy/deprecated app directories are off-limits unless the user explicitly asks to modify them.

## Git

- `git pull --no-rebase` by default. Never rebase, force-push, or `reset --hard` without explicit approval.
- Stage only files related to the current change.
- Do not commit or push unless the user explicitly asks.

## Conventions

Before writing code, activate the relevant convention skill when applicable:
- `convention-check` — scan for convention violations before commit/review
- `convention-service` — services, refactors, new features
- `convention-ai` — AI agents/gateways/prompts/structured output
- `convention-test` — tests, factories, fakes
