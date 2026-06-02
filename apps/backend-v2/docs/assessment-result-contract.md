# Assessment result contract

Backend assessment view endpoint:

- `GET /api/v1/assessment-attempts/{assessment_attempt}/view`

The response wraps assessment output in `data.result`. Frontend should prefer the normalized fields below instead of deriving state from raw scores.

## `result.display`

`result.display` is the UI-safe scoring summary.

Key fields:

- `status`: `not_assessable`, `below_b1`, or `passed`.
- `status_label`: localized short label.
- `level`: `B1`, `B2`, `C1`, `below_b1`, or `null`.
- `level_label`: localized level label.
- `is_assessable`: whether the response is valid enough to score.
- `is_passing`: whether the response meets at least B1.
- `score`: value/max/label plus `should_show`.
- `reason`: reason code/source/details for caps or non-assessable states.
- `message`: learner-facing summary.
- `thresholds`: scoring thresholds used by the backend.
- `ui`: UI hints for tone, badge, visibility, and primary action.

Frontend should use `ui.show_score`, `ui.show_criterion_breakdown`, and `ui.show_feedback` before rendering score details.

## `result.diagnostics`

`result.diagnostics` is a normalized diagnostic object for Writing and Speaking.

When a provider or evidence extractor did not produce a diagnostic value, backend returns `null` for that field instead of inventing a numeric fallback. Frontend must render this as “chưa có dữ liệu” and must not treat it as `0` or `100%`.

Common fields:

- `summary`: word/sentence/paragraph counts and language-error counts.
- `annotations`: normalized grammar/spelling/style spans.
- `by_type`: annotations grouped by `spelling`, `grammar`, `punctuation`, `style`, `other`.
- `counts_by_category`: raw category counts.

Writing-specific fields:

- `word_requirement`: minimum, actual, `is_met`, and missing words.
- `task_coverage`: required/covered points, ratio, and per-requirement details when available.
- `format`: Task 1 letter signals and tone signals.
- `cohesion`: linking-word count and sentence variety.
- `vocabulary_profile`: CEFR vocabulary metrics.

Speaking-specific fields:

- `speech`: transcript, confidence, speaking rate, pauses, word count.
- `fluency`: speaking rate, pauses, word count.
- `pronunciation`: normalized overall score plus raw provider payload.
- `content`: content factor from the assessment evidence.
- `cohesion`: linking-word count and sentence variety.

## Examples

Passed:

```json
{
  "result": {
    "overall_band": 6,
    "display": {
      "status": "passed",
      "level": "B2",
      "is_assessable": true,
      "is_passing": true,
      "score": { "value": 6, "max": 10, "label": "6.0/10", "should_show": true },
      "ui": { "tone": "success", "show_score": true, "show_criterion_breakdown": true, "show_feedback": true }
    },
    "diagnostics": {
      "summary": { "word_count": 262, "total_error_count": 3 },
      "word_requirement": { "minimum": 250, "actual": 262, "is_met": true, "missing": 0 }
    }
  }
}
```

Below B1:

```json
{
  "result": {
    "overall_band": 4,
    "display": {
      "status": "below_b1",
      "level": "below_b1",
      "is_assessable": true,
      "is_passing": false,
      "score": { "value": 4, "max": 10, "label": "4.0/10", "should_show": true },
      "ui": { "tone": "warning", "show_score": true, "show_criterion_breakdown": true, "show_feedback": true }
    }
  }
}
```

Not assessable:

```json
{
  "result": {
    "overall_band": 1,
    "display": {
      "status": "not_assessable",
      "level": null,
      "is_assessable": false,
      "is_passing": false,
      "score": { "value": 1, "max": 10, "label": "Không chấm được", "should_show": false },
      "reason": { "code": "non_english", "source": "validation", "details": {} },
      "ui": { "tone": "danger", "show_score": false, "show_criterion_breakdown": false, "show_feedback": false }
    }
  }
}
```
