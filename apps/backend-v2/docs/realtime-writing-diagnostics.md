# Realtime writing diagnostics

Endpoint:

- `POST /api/v1/practice/writing/diagnostics`
- Authenticated learner route with active profile.
- Throttled at `30` requests per minute.

This endpoint is a lightweight readiness helper for the practice editor. It does not use the full assessment pipeline, does not enqueue grading jobs, and does not return a final score.

## Request

```json
{
  "prompt_id": "uuid",
  "text": "Dear John, I am writing to..."
}
```

Validation:

- `prompt_id`: required UUID for an existing writing prompt.
- `text`: present, nullable string, maximum `5000` characters.

## Response

```json
{
  "data": {
    "text_hash": "sha1-of-text",
    "language": {
      "is_english": true,
      "confidence": 0.98,
      "non_ascii_letter_ratio": 0
    },
    "diagnostics": {
      "summary": {
        "word_count": 42,
        "sentence_count": 3,
        "paragraph_count": 1,
        "total_error_count": 0
      },
      "word_requirement": {
        "minimum": 120,
        "actual": 42,
        "is_met": false,
        "missing": 78
      },
      "task_coverage": {
        "required_points": 3,
        "covered_points": 1,
        "coverage_ratio": 0.333,
        "has_requirement_details": true,
        "source": "heuristic",
        "requirements": [
          { "text": "Apologize for missing the party", "met": true }
        ]
      },
      "format": {
        "letter_format_expected": true,
        "has_salutation": true,
        "has_closing": false,
        "tone": {
          "formal_count": 0,
          "informal_count": 0,
          "informal_words": []
        }
      },
      "annotations": [],
      "by_type": {
        "spelling": [],
        "grammar": [],
        "punctuation": [],
        "style": [],
        "other": []
      },
      "counts_by_category": {},
      "service_status": {
        "language_tool": {
          "available": true,
          "message": null
        }
      }
    },
    "readiness": {
      "status": "needs_work",
      "label": "Cần hoàn thiện trước khi nộp",
      "reasons": [
        { "code": "word_count", "message": "Cần viết thêm 78 từ để đạt yêu cầu tối thiểu." }
      ]
    }
  }
}
```

## Frontend usage

Recommended editor behavior:

- Debounce requests by about `1000ms`.
- Do not call the endpoint for very short text.
- Use `AbortSignal` or equivalent cancellation for stale requests.
- Compare the latest editor value with the debounced value before rendering diagnostics.
- Use `text_hash` as an extra stale-response guard if the client computes the same hash.

## Heuristic vs final grading

`diagnostics.task_coverage.source` is `heuristic` for realtime checks. Show this as a soft checklist, not a grading conclusion.

The final assessment result can include stronger task evidence from the grading pipeline. Frontend should use final `result.diagnostics` on the result page and realtime diagnostics only inside the editor.

## Service availability

If LanguageTool is unavailable, the endpoint still returns word/task/format diagnostics and sets:

```json
{
  "service_status": {
    "language_tool": {
      "available": false,
      "message": "Language diagnostics are temporarily unavailable: ..."
    }
  }
}
```

This outage should not be counted as a learner language error.
