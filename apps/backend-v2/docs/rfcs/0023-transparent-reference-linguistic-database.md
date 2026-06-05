---
RFC: 0023
Title: Transparent Reference Linguistic Database
Status: Draft
Created: 2026-06-02
Updated: 2026-06-02
Superseded by:
---

# RFC 0023 — Transparent Reference Linguistic Database

## Summary

Chuẩn hóa dữ liệu ngôn ngữ dùng cho chấm Writing/Speaking thành reference database minh bạch: nguồn cố định dạng JSONL trong repository, seed vào PostgreSQL để query runtime, và luôn trả được evidence/trace khi một bài được cộng điểm vì linking devices, collocations, CEFR vocabulary hoặc grammar patterns.

## Motivation

Hệ thống chấm Writing hiện có các rule deterministic như `linking_word_count` và `complex_vocab_count`. Khi các list này hardcode trong service, có bốn vấn đề:

1. **Thiếu minh bạch**: khó giải thích vì sao `Unfortunately`, `Once again`, `To make up for...` không được tính là linking devices.
2. **Khó audit**: đồ án cần chứng minh nguồn dữ liệu, rule, phiên bản dữ liệu và lý do điểm số.
3. **Khó mở rộng theo task**: Task 1 letter cần apology/request/complaint phrases; Task 2 essay cần academic/discourse phrases.
4. **PG không nên là source of truth**: nếu sửa trực tiếp trong database thì khó review, khó reproducible, khó rollback.

Do đó cần tách rõ:

- **Reference source**: JSONL cố định trong repo, có `source`, `level`, `category`, `task_type`, `weight`.
- **Runtime store**: PostgreSQL tables được seed/upsert từ JSONL để service query nhanh.
- **Scoring evidence**: metrics trả ra không chỉ là count mà còn có danh sách phrase matched và nguồn dữ liệu.

## Design

### 1. Source hierarchy

```text
database/reference/linguistics/
├── README.md
├── manifest.json
├── sources.json
├── bootstrap/
│   ├── lexical-signals.jsonl
│   ├── grammar-patterns.jsonl
│   └── cefr-vocabulary.jsonl
├── vendor/open-language-profiles/
│   ├── cefr-j-vocabulary-profile-1.5.csv
│   ├── octanove-vocabulary-profile-c1c2-1.0.csv
│   └── cefr-j-grammar-profile-20180315.csv
└── golden/
    ├── writing-task1-apology-b2.json
    └── writing-task2-opinion-b2.json
```

JSONL là format chính vì mỗi dòng là một record độc lập, dễ append, dễ review diff, dễ validate từng dòng và có thể stream khi seed.

### 2. Lexical signal record

```json
{"phrase":"to make up for","type":"linking","category":"solution","level":"B2","skill":"writing","task_type":"writing_task_1_letter","weight":1,"source":"cefr_companion_cohesion_descriptors","evidence_note":"Used as a solution/repair transition in personal letters."}
```

Fields:

| Field | Meaning |
|---|---|
| `phrase` | Surface form to match, lowercased during seed/query. |
| `type` | `linking`, `collocation`, `discourse_marker`, `topic_lexis`. |
| `category` | Rhetorical/function group: `contrast`, `result`, `apology`, `solution`, `argument`. |
| `level` | CEFR estimate: `A2`, `B1`, `B2`, `C1`; nullable if not levelled. |
| `skill` | Usually `writing`; can support `speaking`. |
| `task_type` | Nullable for global; task-specific for `writing_task_1_letter`, `writing_task_2_essay`. |
| `weight` | Integer count weight. Default `1`; higher only with rubric justification. |
| `source` | Stable source key from `sources.json`. |
| `evidence_note` | Human-readable reason for reports/admin UI. |

### 3. Source metadata

`sources.json` stores citation-level metadata:

```json
{
  "cefr_companion_cohesion_descriptors": {
    "title": "CEFR Companion Volume — Coherence and Cohesion / Vocabulary Range descriptors",
    "publisher": "Council of Europe",
    "url": "https://rm.coe.int/chapter-5-communicative-language-competences/1680a084c3",
    "accessed_at": "2026-06-02",
    "usage": "Descriptor-aligned categories and CEFR-level rationale; not copied as proprietary wordlist."
  }
}
```

Minimum source groups:

- CEFR Companion Volume: descriptors for vocabulary range and coherence/cohesion.
- English Profile / English Vocabulary Profile: CEFR vocabulary alignment reference.
- Cambridge sample writing commentaries: evidence categories for lexical resource/cohesion.
- VSTEP/IELTS-style Task 1 writing phrase banks: task-specific letter functions such as apology, explanation, repair offer.

### 4. Runtime schema

`lexical_signals`:

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `phrase` | varchar(120) | unique with type/skill/task_type |
| `type` | varchar(30) | linking/collocation/etc. |
| `category` | varchar(50) | function group |
| `level` | varchar(3), nullable | CEFR estimate |
| `weight` | tinyint | scoring count weight |
| `skill` | varchar(20) | writing/speaking |
| `task_type` | varchar(40), nullable | global or task-specific |
| `source` | varchar(80) | source key |
| `is_active` | boolean | allows safe disable without deleting fixture data |
| timestamps | | |

Indexes:

- unique: `phrase,type,skill,task_type`
- query index: `type,skill,task_type,is_active`

### 5. Scoring flow

```text
JSONL fixtures
  → Seeder validates + upserts into PostgreSQL
  → Seeder invalidates Laravel reference cache
  → RuleBasedScoringService loads active signals
  → Lookup maps are cached with stable linguistic cache keys
  → Text matcher counts phrase occurrences
  → Metrics include counts + matched evidence
  → WritingScoringFormula consumes counts
  → Diagnostics/API can explain matched phrases and sources
```

Initial metrics remain backward-compatible:

```php
[
    'linking_word_count' => 5,
    'complex_vocab_count' => 7,
]
```

Future transparent metrics:

```php
[
    'linking_word_count' => 5,
    'complex_vocab_count' => 7,
    'lexical_signal_matches' => [
        [
            'phrase' => 'unfortunately',
            'type' => 'linking',
            'category' => 'stance',
            'level' => 'B1',
            'count' => 1,
            'source' => 'cefr_companion_cohesion_descriptors',
        ],
    ],
]
```

### 6. Matching rules

Use deterministic matching before adding NLP complexity:

- Case-insensitive.
- Word-boundary phrase match to avoid matching inside longer words.
- Count each configured phrase occurrence.
- Prefer longest phrase when future overlapping conflicts matter, e.g. `make up for` vs `to make up for`.
- Do not infer meaning from context in deterministic layer; LLM/rubric assessor can handle nuance separately.

### 7. Grammar pattern database

Use a separate JSONL/table later because grammar patterns are not just phrase matches.

Proposed `grammar_patterns.jsonl` record:

```json
{"key":"first_conditional","label":"First conditional","level":"B1","skill":"writing","regex":"\\bif\\b[^.!?]+\\b(will|can|may)\\b","category":"conditional","weight":1,"source":"english_profile_grammar"}
```

Runtime table can be `grammar_patterns` with:

- `key`, `label`, `level`, `category`, `pattern_type`, `pattern`, `weight`, `source`, `is_active`.

This should feed grammar range diagnostics, not grammar accuracy. Accuracy still comes from LanguageTool/error annotations.

### 8. Transparency in product/report

Admin/report screens should be able to show:

- Which linking devices were detected.
- Which collocations contributed to vocabulary depth.
- Which CEFR level/source each signal belongs to.
- Which version/date of fixture seeded the data.
- Whether a signal is global or task-specific.

This supports an explanation like:

> Organization received linking credit because the text used `Unfortunately`, `As a result`, `To make up for`, `Once again`, and `Hopefully`. These are configured as B1–B2 writing cohesion signals for Task 1 letters.

## Alternatives considered

### Hardcode arrays in service

Rejected as long-term design. It is simple but opaque, difficult to audit, and not suitable for an academic đồ án where data provenance matters.

### PostgreSQL-only manual data

Rejected as source of truth. It supports admin editing but loses Git review, reproducibility and clear source/version history.

### XML fixtures

Acceptable but not preferred. XML supports metadata but is verbose, harder to diff, and needs more parsing code.

### One large JSON file

Acceptable for small data, but JSONL is better for append-only reference rows and line-level validation.

## Implementation

- [x] Migration: `lexical_signals` table.
- [x] Model: `LexicalSignal`.
- [x] Bootstrap reference: `database/reference/linguistics/bootstrap/lexical-signals.jsonl`.
- [x] Bootstrap reference: `database/reference/linguistics/bootstrap/cefr-vocabulary.jsonl`.
- [x] Bootstrap reference: `database/reference/linguistics/bootstrap/grammar-patterns.jsonl`.
- [x] Manifest/README for common linguistic fixture pattern.
- [x] Source metadata: `database/reference/linguistics/sources.json`.
- [x] Seeder: read JSONL fixture and upsert runtime DB rows.
- [x] Service integration: `RuleBasedScoringService` reads DB with JSONL fallback.
- [x] CEFR vocabulary seeder reads JSONL baseline.
- [x] CEFR vocabulary classifier falls back to JSONL when runtime table is empty.
- [x] Grammar pattern migration/model/seeder using the same JSONL pattern.
- [x] Grammar regex validation.
- [x] Unified reference workflow command: `php artisan linguistics:sync`.
- [x] Local Open Language Profiles / CEFR-J snapshot import in `php artisan linguistics:sync`.
- [x] VSTEP golden probe command: `php artisan linguistics:probe`.
- [x] Reference data cache keys and cache invalidation in seeders.
- [x] CEFR level-map lookup cached to avoid repeated vocabulary-level DB queries.
- [x] Lexical signal lookup cached to avoid repeated linking/collocation DB queries.
- [x] Tests: linking/collocation detection for Task 1 apology letter.
- [x] JSONL validation test.
- [x] Source citation validation.
- [x] Extend metrics with `lexical_signal_matches` evidence.
- [ ] Add grammar pattern evidence into diagnostics after syntax analyzer calibration.
