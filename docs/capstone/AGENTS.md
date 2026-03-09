# Capstone Documentation Rules

These rules apply to SRS, SDD, project reports, and related documentation under `docs/capstone/`.

## Scope and Status

- Distinguish **current implementation** from **planned scope**.
- Do not claim a feature is implemented unless it is verified in the current codebase.
- Do not remove approved product scope from documents solely because it is not yet implemented.
- When a feature exists in scope but is not part of the current delivery increment, use explicit wording such as:
  - `planned`
  - `deferred`
  - `not in current increment`
  - `beyond MVP`

## Accuracy

- Architecture, integrations, storage, queueing, and data-flow descriptions must match the current system design and codebase.
- Avoid vendor-specific claims unless the implementation is intentionally locked to that vendor.
- If a statement is implementation-specific, phrase it as current behavior rather than long-term product scope.

## Consistency

- Keep feature lists, actor descriptions, diagrams, use cases, and detailed requirement sections semantically consistent.
- If a capability is planned or deferred, reflect that status consistently across all sections that mention it.
- Keep English and Vietnamese versions semantically aligned.

## Editing Principle

- Prefer the smallest documentation change that restores correctness and preserves approved scope.
- Do not downgrade a requirements document into a pure implementation snapshot.
