# Content Reference Data

Curated seed content for VSTEP practice. These files are the source of truth for learner-facing practice bank data that should be reproducible, reviewable, and validated before import.

## Pattern

```text
Local reference content → validate → sync/import → runtime tables → learner practice
```

- Reference files are authored and versioned in Git.
- Runtime tables are indexed stores, not the canonical source.
- Every row declares `source_key` and `selection_reason` to explain why it belongs in the seed set.
- Official/sample sources are used for format and task-pattern alignment only; authored rows avoid copying restricted exam content verbatim.

## Commands

```bash
php artisan content:sync --status
php artisan content:sync
```

`content:sync` validates fixtures, imports curated writing prompts and speaking tasks, then reports runtime counts.
