# VSTEP Scoring System

> Last updated: 2026-05-27

## Source attribution

| Component | Source | Type |
|-----------|--------|------|
| MCQ formula `C/total × 10` | Thông tư 23/2017, vstep.ftu.edu.vn | **Official** |
| Level mapping B1/B2/C1 | Thông tư 23/2017 | **Official** |
| Overall rounding to 0.5 | vstep.ftu.edu.vn | **Official** |
| Writing composite (W₁+2W₂)/3 | ULIS-VNU (VNU J. Foreign Studies, 2018) | **Research paper** |
| Band descriptors (text) | Thông tư 23/2017, Phụ lục III | **Official** |
| Rubric params (thresholds, bonuses, penalties) | Operationalization — design decision | **Our design** |
| Formula logic (structureBand, accuracy_factor, contentFactor) | Operationalization — design decision | **Our design** |
| SyntaxAnalyzer structure types | Heuristic — regex patterns | **Our design** |

**Disclaimer**: Tất cả rubric params, thresholds, và bonus/penalty values là thiết kế của hệ thống, không trích từ nghiên cứu học thuật. Chúng được dẫn xuất từ VSTEP band descriptors và calibrate qua validation dataset (10 essays). Đổi rubric params → đổi behavior — không cần code.

---

## Architecture

### LLM role: evidence extractor, never scorer

```
LLM does NOT assign scores.
LLM extracts: requirements_met(int), requirements_total(int),
              has_clear_position(bool), has_irrelevant_content(bool)
              + strengths, improvements, rewrites (text feedback)

Formula computes all scores deterministically from evidence + objective features.
```

### LLM — detail

| Property | Value |
|----------|-------|
| Model | deepseek-v4-flash (messages wire) |
| Temperature | 0 (deterministic, reproducible) |
| Timeout | 60s |
| Role | Extract observable facts. Never score. |
| Output schema | `requirements_met`, `requirements_total`, `has_clear_position`, `has_irrelevant_content`, `strengths[]`, `improvements[]`, `rewrites[]` |
| Prompt template | `resources/ai/grading/writing-evidence.blade.php` |
| Service | `LlmGradingService::extractEvidence()` |
| Interface | `LlmGrader` (contract, FakeLlmGrader for tests) |

**Callers:**

| Strategy | Calls LLM? | Purpose |
|----------|:--:|---------|
| `WritingGradingStrategy` | Yes | Check `requirements[]` per task → task fulfillment formula |
| `SpeakingGradingStrategy` | Exam only | Check transcript vs task prompt → contentFactor for discourse |
| `ValidateScoring` command | Yes | End-to-end validation with real LLM |

**Flow:**

```
Text/Transcript → view('ai.grading.writing-evidence')
  → Blade template renders: text + metrics + syntax + requirements[]
  → LLM (deepseek-v4-flash, T=0) structured tool call
  → evidenceSchema: 4 numbers + 3 text arrays
  → Formula reads evidence, never raw LLM output
```

**Requirements source:**

| Submission type | Requirements from |
|----------------|-------------------|
| `exam_writing` | `ExamVersionWritingTask.requirements` (jsonb, admin-configured) |
| `practice_writing` | `PracticeWritingPrompt.required_points` |
| `exam_speaking` | `ExamSpeakingPart.requirements` |

**Defensive design:**
- Writing LLM fail → retry 3x, then `GradingFailedException`
- Speaking LLM fail → contentFactor = 1.0 (no penalty, does not fail grading)

### Scoring pipeline (5 layers)

| Layer | Component | Deterministic |
|:--:|-----------|:--:|
| 1 | LanguageTool (Docker) — grammar error detection | ✅ |
| 2 | RuleBasedScoring + SyntaxAnalyzer — metrics, 10 structure types | ✅ |
| 3 | LLM Evidence (deepseek-v4-flash, temp=0) — requirements check | ⚠️ LLM input |
| 4 | WritingScoringFormula / SpeakingScoringFormula — rubric params from DB | ✅ |
| 5 | Sanity penalty — W × min(1, words/120) | ✅ |

### Rubric-driven

```
GradingRubric (DB, v4) — single source of truth
  ├── band_descriptors (text, Thông tư 23/2017)
  └── params (quantitative, operationalized)
        ├── grammar: band_thresholds, accuracy_factor, max_accuracy
        ├── vocabulary: base, cap, unique_thresholds, length_thresholds
        ├── task_fulfillment: coverage_multiplier, position_bonus, irrelevant_penalty
        └── organization: base, para_bonus, linking_factor, linking_cap, variety_thresholds, compact_threshold, compact_penalty

WritingScoringFormula / SpeakingScoringFormula read params via constructor injection.
Change params → change scoring behavior — no code change.
```

---

## Writing

### Pipeline

```
Text → LanguageTool → SyntaxAnalyzer + RuleBasedScoring
  → LLM Evidence (requirements[] check)
  → WritingScoringFormula (4 criteria)
  → Sanity penalty (W × min(1, w/120))
```

### Criteria

| Criterion | Deterministic | Input |
|-----------|:--:|-------|
| Grammar | ✅ | SyntaxAnalyzer (10 types) + LanguageTool errors |
| Vocabulary | ✅ | unique_ratio + avg_word_length + readability + complex_vocab |
| Task Fulfillment | ⚠️ | LLM checks requirements[] per task |
| Organization | ✅ | paragraph_count + linking_words + sentence_variety |

### Formulas

**Grammar**: $G = \text{clampRound}((\text{structureBand} + \text{accuracy}) / 2, 0.5)$
- structureBand: 0 types→5, 1→6, 3→7, 5→8, 6→9, 7→10
- accuracy: $10 - \min(10, \text{errors}/\text{sentences} \cdot 5)$, capped by range (0-2→7, 3-4→9, 5+→10)

**Vocabulary**: $V = \min(\text{cap}, \text{clampRound}(\text{base} + B_u + B_l + B_r + B_c, 0.5))$
- $B_u$: unique_ratio > 0.45→1, > 0.55→2, > 0.65→3
- $B_l$: avg_word_len > 4.5→1, > 5.5→2
- $B_r$: readability_grade > 8→1, > 10→2
- $B_c$: complex_vocab_count > 2→1, > 5→2

**Task Fulfillment**: $T = \text{clampRound}((\text{met}/\text{total}) \cdot M + \text{position} - \text{irrelevant}, 0.5)$
- Requirements[] configured by admin per task (`ExamVersionWritingTask.requirements`)
- Practice tasks use `PracticeWritingPrompt.required_points`

**Organization**: $O = \text{clampRound}(\text{base} + B_p + B_l + B_v - P_c, 0.5)$
- $B_p$: 1 paragraph→1, 2→3, 3+→4
- $B_l$: $\min(\text{cap}, \text{linking\_count} \cdot \text{factor})$
- $B_v$: sentence_variety > 4→1, > 6→2
- $P_c$: >8 sentences in 1 paragraph → -1

### Per-task + composite

$$W_i = \text{round}(\text{mean}(G,V,T,O), 0.5) \cdot \min(1, w/120)$$

$$W = \text{round}\left(\frac{W_1 + 2W_2}{3}, 0.5\right)$$

Source: ULIS-VNU (VNU J. Foreign Studies, 2018).

---

## Speaking

### Pipeline

```
Audio → Azure STT (text, confidence, word timing, pauses)
  → SyntaxAnalyzer + RuleBasedScoring
  → [Exam only] LLM Evidence (content relevance check)
  → SpeakingScoringFormula (5 criteria)
```

### Criteria

| Criterion | Deterministic | Input |
|-----------|:--:|-------|
| Grammar | ✅ | SyntaxAnalyzer on transcript |
| Vocabulary | ✅ | unique_ratio + word_length + readability + complex_vocab |
| Fluency | ✅ | Azure word timing (speaking_rate, pause_count) |
| Discourse | ⚠️ | linking_words + sentence_variety × contentFactor (LLM for exam) |
| Pronunciation | ✅ | Azure Pronunciation Assessment overall score |

### STT

| Provider | Interface | Features |
|----------|-----------|----------|
| Azure Speech (primary) | `SpeechToText` | text, confidence, word timing, pauses, **pronunciation assessment (required)** |

Pronunciation assessment là mandatory — nếu Azure không trả về PA score → `GradingFailedException`.

4/5 criteria fully deterministic. Discourse uses LLM content relevance check for exam submissions (practice defaults to 1.0).
Grammar, vocabulary, fluency, pronunciation: no LLM.

- Azure key not configured → `GradingFailedException("AZURE_SPEECH_KEY not configured")`
- STT returns null → `GradingFailedException("Audio corrupted or Azure unavailable")`

### Content Relevance (Exam only)

For exam submissions, LLM checks transcript against task prompt + `part.requirements`.
Returns `contentFactor = 0.5 + (points_covered / points_required) × 0.5`, range [0.5, 1.0].

$$D = \text{clampRound}((\text{base} + B_l + B_v) \times \max(0.5, \text{contentFactor}))$$

- Practice submissions: contentFactor = 1.0 (no LLM call)
- Exam submissions with no task requirements: contentFactor = 1.0 (graceful skip)
- LLM failure: falls back to 1.0 (defensive, does not fail grading)

---

## MCQ (Listening + Reading)

$$L = \text{round}\left(\frac{C_L}{35} \times 10,\ 1\right) \quad
R = \text{round}\left(\frac{C_R}{40} \times 10,\ 1\right)$$

Source: vstep.ftu.edu.vn.

---

## Overall + Level

$$O = \text{round}\left(\frac{L + R + W + S}{4},\ 0.5\right)$$

| Band | Level |
|------|-------|
| 0.0 – 3.5 | Không đạt |
| 4.0 – 5.5 | B1 (Bậc 3) |
| 6.0 – 8.0 | B2 (Bậc 4) |
| 8.5 – 10.0 | C1 (Bậc 5) |

---

## Validation

### Writing: 10/10 CEFR match

5 model answers + 5 student essays. `php artisan validate:scoring`.

### Speaking: pipeline verified

303 tests (3 pipeline + 7 formula unit). End-to-end probed with real WAV audio (TTS, B1-level transcript → score 5.5/B1).

---

## Configurability

| What | Where |
|------|-------|
| Rubric params | `grading_rubrics.criteria[].params` (DB, seeded) |
| AI model | `config/ai.php` → `services.grading.model` |
| Temperature | `config/ai.php` → `services.grading.temperature = 0.0` |
| Exam task requirements | `exam_version_writing_tasks.requirements` (required on import) |
| Practice task requirements | `practice_writing_prompts.required_points` |
| LanguageTool URL | `config/services.php` → `languagetool.url` |

---

## Determinism

| Component | Method |
|-----------|--------|
| Grammar, Vocabulary, Organization | Formula reads rubric params — deterministic |
| Task Fulfillment | Formula + LLM at temperature=0 — deterministic |
| Fluency | Azure word timing — deterministic per API call |
| Pronunciation | Azure PA score or STT confidence — deterministic per API call |
| MCQ | Pure math |
| Overall | Pure math |

Tested: 3/3 identical LLM runs with same input.

---

## Files

| Component | File |
|-----------|------|
| Wiki (this) | `.agents/wiki/scoring-formulas.md` |
| Architecture wiki | `.agents/wiki/grading-architecture.md` |
| Exam structure wiki | `.agents/wiki/vstep-exam-structure.md` |
| Demo script wiki | `.agents/wiki/demo-slide-script.md` |
| WritingScoringFormula | `app/Services/Grading/WritingScoringFormula.php` |
| SpeakingScoringFormula | `app/Services/Grading/SpeakingScoringFormula.php` |
| SyntaxAnalyzer (10 types) | `app/Services/SyntaxAnalyzer.php` |
| RuleBasedScoringService | `app/Services/RuleBasedScoringService.php` |
| LanguageToolService | `app/Services/LanguageToolService.php` |
| WritingGradingStrategy | `app/Services/Grading/WritingGradingStrategy.php` |
| SpeakingGradingStrategy | `app/Services/Grading/SpeakingGradingStrategy.php` |
| LlmGradingService | `app/Services/Grading/LlmGradingService.php` |
| LlmGrader (interface) | `app/Services/Grading/LlmGrader.php` |
| RubricResolver | `app/Services/Grading/RubricResolver.php` |
| GradingService | `app/Services/Grading/GradingService.php` |
| ExamScoringService | `app/Services/ExamScoringService.php` |
| SpeechToText (interface) | `app/Services/SpeechToText.php` |
| SpeechToTextService (Azure) | `app/Services/SpeechToTextService.php` |
| GradingRubric (model) | `app/Models/GradingRubric.php` |
| Rubric v4 seeder | `database/seeders/GradingRubricSeeder.php` |
| AI config | `config/ai.php` |
| Service bindings | `app/Providers/AppServiceProvider.php` |
| Evidence prompt | `resources/ai/grading/writing-evidence.blade.php` |
| Validation command | `app/Console/Commands/ValidateScoring.php` |
| Writing validation test | `tests/Feature/Validation/VstepWritingValidationTest.php` |
| Speaking validation test | `tests/Feature/Validation/VstepSpeakingValidationTest.php` |
| Writing formula tests | `tests/Unit/Grading/WritingScoringFormulaTest.php` |
| Speaking formula tests | `tests/Unit/Grading/SpeakingScoringFormulaTest.php` |
