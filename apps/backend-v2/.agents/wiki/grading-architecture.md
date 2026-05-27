# Grading Architecture

Pipeline 5-layer, evidence extraction + rubric-driven formula.
LLM extracts evidence — never scores. Formula reads rubric params from DB.

## Flow

```
[User submit] → GradingService::enqueue() → GradingJob (pending)
                  → GradeJob queue worker
                    → GradingService::process()
                      → strategy->grade() (pure compute, no DB)
                      → strategy->persistResult() (transaction + advisory lock)
```

- **Controller mỏng**: FormRequest → Service → Resource.
- **Strategy pattern**: `GradingStrategyResolver` resolves by `submission_type`.
- **Pure compute**: `grade()` calls external APIs but never writes DB.
- **DB writes**: `persistResult()` in transaction + advisory lock.

## Strategies

| Strategy | `supports()` | Layers |
|----------|-------------|--------|
| `WritingGradingStrategy` | `practice_writing`, `exam_writing` | LanguageTool → Metrics+Syntax → LLM Evidence → Formula → Penalty |
| `SpeakingGradingStrategy` | `practice_speaking`, `exam_speaking` | STT → Metrics+Syntax → [Exam: LLM Evidence] → Formula (5 criteria) |

## Writing Pipeline (5 layers)

### Layer 1: LanguageTool
- Docker: `erikvl87/languagetool:8081`
- If unavailable: log WARNING, continue with empty `[]`.
- File: `app/Services/LanguageToolService.php`

### Layer 2: Metrics + Syntax
- `RuleBasedScoringService`: word/sentence/paragraph counts, unique_ratio, avg_word_length, sentence_variety (std dev), linking words, error counts. 10 metrics total.
- `SyntaxAnalyzer`: 10 complex structure types detected via regex. No external dependency. <1ms.
- Files: `app/Services/RuleBasedScoringService.php`, `app/Services/SyntaxAnalyzer.php`

### Layer 3: LLM Evidence Extraction
- **Role**: extract evidence, NOT score. Output: `requirements_met`, `requirements_total`, `has_clear_position`, `has_irrelevant_content`.
- **Model**: deepseek-v4-flash (messages wire), temperature=0, timeout=60s.
- **Requirements**: from `ExamVersionWritingTask.requirements` or `PracticeWritingPrompt.required_points` (admin-configured).
- **Fallback**: retry 3x, then GradingFailedException.
- Files: `app/Services/Grading/LlmGradingService.php`, `resources/ai/grading/writing-evidence.blade.php`

### Layer 4: Formula
- `WritingScoringFormula`: reads params from `GradingRubric.criteria[].params` (v4).
- Injected via container → rubric is source of truth.
- 4 formulas: grammar, vocabulary, organization, task_fulfillment.
- All deterministic. Change rubric params → change behavior. No code change.
- File: `app/Services/Grading/WritingScoringFormula.php`

### Layer 5: Sanity Penalty
- `W × min(1, words/120)` — continuous penalty below VSTEP minimum.
- Source: Thông tư 23/2017 Task 1 minimum.

## Speaking Pipeline

### Layer 1: STT
- Interface: `SpeechToText` → `{text, confidence, speaking_rate, pause_count, pronunciation}`.
- Azure Speech (primary): text + word timing + pauses + pronunciation assessment (mandatory).
- No fallback — pronunciation assessment missing → `GradingFailedException`.
- File: `app/Services/SpeechToText.php`

### Layer 2: Metrics + Syntax
- Same as writing: `SyntaxAnalyzer` (10 structure types) + `RuleBasedScoringService` (word/sentence counts, unique_ratio, linking words, sentence_variety).
- Files: `app/Services/SyntaxAnalyzer.php`, `app/Services/RuleBasedScoringService.php`

### Layer 3: LLM Evidence (Exam only)
- **Exam submissions only**: LLM checks transcript against task prompt + `ExamSpeakingPart.requirements`.
- Extracts: `points_covered`, `points_required` → contentFactor (0.5-1.0).
- Practice submissions skip this layer (contentFactor = 1.0).
- LLM failure falls back to 1.0 (defensive, does not fail grading).
- Files: `app/Services/Grading/SpeakingGradingStrategy.php` (`checkContentRelevance`)

### Layer 4: Formula
- `SpeakingScoringFormula`: reads params from `GradingRubric.criteria[].params` (v4).
- 5 formulas: grammar, vocabulary, fluency, discourse_management, pronunciation.
- Discourse: structural score × contentFactor (from Layer 3 for exam).
- File: `app/Services/Grading/SpeakingScoringFormula.php`

### Layer 5: Overall band
- `GradingRubric::computeOverallBand()` → `round(mean(5), 0.5)`.

## Rubric (v4)

- `GradingRubric`: skill, version, criteria[] (each with `band_descriptors` + `params`).
- **Params**: quantitative thresholds, bonuses, penalties. Source: operationalized from VSTEP descriptors, calibrated via validation.
- Each param has `_sources` documentation in seeder tracing derivation.
- `RubricResolver`: scoped singleton, caches active rubric per request.
- Files: `app/Models/GradingRubric.php`, `app/Services/Grading/RubricResolver.php`, `database/seeders/GradingRubricSeeder.php`

## WritingScoringFormula

```php
// Injected: rubric → params → thresholds
G = clampRound((structureBand(typeCount) + accuracy(penalty, maxAcc)) / 2, 0.5)
V = min(cap, clampRound(base + uniqueBonus(ratio) + lengthBonus(avg_len), 0.5))
T = clampRound((met/total) × M + positionB - irrelevantP, 0.5)
O = clampRound(base + paraBonus + linkingBonus + varietyBonus - compactP, 0.5)
```

See [[scoring-formulas]] for full specification.

## Data Model

| Table | Key Fields |
|-------|-----------|
| `grading_rubrics` | `skill`, `version`, `criteria` (jsonb with params + band_descriptors), `is_active` |
| `exam_version_writing_tasks` | `requirements` (jsonb, required for import) |
| `practice_writing_prompts` | `required_points` (json) |
| `grading_jobs` | `submission_type`, `submission_id`, `status`, `attempts` |
| `writing_grading_results` | `rubric_scores`, `overall_band`, `strengths`, `improvements`, `version`, `is_active` |
| `speaking_grading_results` | `rubric_scores`, `overall_band`, `transcript`, `pronunciation_report` |

## Queue & Concurrency

- **Idempotent**: partial unique index on `(submission_type, submission_id)` WHERE `status IN (pending, processing)`.
- **Transaction safety**: `DB::afterCommit()` defers dispatch when inside transaction.
- **Advisory lock**: `pg_advisory_xact_lock(crc32(submissionType:submissionId))` prevents concurrent result persistence.
- **Versioning**: each regrade creates new version, deactivates old.

## DTOs

| DTO | Fields |
|-----|--------|
| `GradingResultData` (base) | `rubricScores`, `overallBand`, `strengths`, `improvements`, `rubricId` |
| `WritingGradingData` | + `rewrites`, `annotations` |
| `SpeakingGradingData` | + `transcript`, `pronunciationReport` |

## Files

| Component | File |
|-----------|------|
| GradingService | `app/Services/Grading/GradingService.php` |
| WritingStrategy | `app/Services/Grading/WritingGradingStrategy.php` |
| SpeakingStrategy | `app/Services/Grading/SpeakingGradingStrategy.php` |
| Formula | `app/Services/Grading/WritingScoringFormula.php` |
| LlmGradingService | `app/Services/Grading/LlmGradingService.php` |
| LlmGrader (interface) | `app/Services/Grading/LlmGrader.php` |
| RubricResolver | `app/Services/Grading/RubricResolver.php` |
| SyntaxAnalyzer | `app/Services/SyntaxAnalyzer.php` |
| RuleBasedScoring | `app/Services/RuleBasedScoringService.php` |
| LanguageTool | `app/Services/LanguageToolService.php` |
| GradingRubric | `app/Models/GradingRubric.php` |
| RubricSeeder | `database/seeders/GradingRubricSeeder.php` |
| Evidence prompt | `resources/ai/grading/writing-evidence.blade.php` |

---

See also: [[scoring-formulas]] · [[vstep-exam-structure]]
