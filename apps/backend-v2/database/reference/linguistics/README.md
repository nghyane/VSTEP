# Linguistic Reference Data

These reference files are the source of truth for deterministic linguistic signals used by assessment services.

## Pattern

```text
Local reference data → sync/import → PostgreSQL runtime table → cache → scoring service → diagnostic evidence
```

- Bootstrap JSONL and vendored CSV snapshots are versioned and reviewable in Git.
- PostgreSQL is a runtime/indexed store, not the canonical data source.
- Services may fall back to JSONL when runtime tables are not migrated or seeded.
- Every scoring signal must have source metadata in `sources.json`.

## Layout

- `manifest.json` — dataset version and purpose.
- `sources.json` — citation/source metadata.
- `bootstrap/lexical-signals.jsonl` — curated linking devices, collocations, discourse/topic signals.
- `bootstrap/cefr-vocabulary.jsonl` — small CEFR vocabulary bootstrap fallback.
- `bootstrap/grammar-patterns.jsonl` — active regex grammar range patterns.
- `vendor/open-language-profiles/` — local CEFR-J/Open Language Profiles CSV snapshots.
- `golden/` — VSTEP writing probe samples.

## Validation

Reference integrity is covered by `Tests\Unit\Grading\LinguisticFixtureTest`.

Validation checks include required fields, duplicate identities, CEFR levels, positive weights, known source keys and grammar regex compilation.

## Sync and probe

Use one public workflow command:

```bash
php artisan linguistics:sync --status
php artisan linguistics:sync
php artisan linguistics:probe
```

- `--status` prints runtime table counts and CEFR distribution.
- `linguistics:sync` validates fixtures, imports local Open Language Profiles snapshots, seeds bootstrap reference data and warms cache.
- `linguistics:probe` runs VSTEP golden writing probes and compares expected vs actual signals/scores.

`linguistics:sync` imports local vendored snapshots:

- CEFR-J Vocabulary Profile v1.5 into `cefr_vocabulary`.
- Octanove C1/C2 Vocabulary Profile into `cefr_vocabulary`.
- CEFR-J Grammar Profile into `grammar_patterns` when the runtime table is migrated.

The command invalidates linguistic lookup caches after import.
