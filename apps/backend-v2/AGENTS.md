# Backend V2 — Agent Instructions

These instructions are for code operation only. Do not use this file as documentation evidence for product scope, report metrics, or dependency versions; verify those from source, tests, composer files, and runtime config.

## Commands

- Dev: `php artisan serve`
- Format: `./vendor/bin/pint`
- Test: `php artisan test`
- Migrate: `php artisan migrate`

## Architecture

- Controller stays thin: FormRequest → Service → Resource.
- Service owns one domain concern. Avoid cross-service calls unless the dependency is explicit.
- Model contains casts, relationships, scopes, and accessors only.
- Put domain transitions/scoring helpers on enums when they belong to enum values.
- Dependency flow: Controller → Service → Model. Avoid circular dependencies.

## Code

- Every PHP file uses `declare(strict_types=1)`.
- Naming: snake_case for DB/API fields, PascalCase for classes, camelCase for methods/variables.
- Avoid magic numbers; extract constants or enums.
- No silent fallback. Missing or invalid required config/input must fail visibly.
- Use Laravel exceptions/validation. Do not catch broad exceptions to hide failures.
- Comments explain why, not what.

## Operations

- Run `./vendor/bin/pint` before commit.
- New behavior or bugfixes need behavior tests unless the user explicitly scopes otherwise.
- Be careful running tests in containers: verify the database target first to avoid wiping dev data.
- Use Eloquent/Query Builder; no raw SQL unless explicitly justified and approved.
- No soft deletes unless an existing domain pattern requires it.
- YAGNI: do not add abstractions without a real consumer.
