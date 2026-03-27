# Practice System — Implementation Plan

## Problem

Current `PracticeService` has architectural issues:
- Stores items + attempts in `progress` JSON column → duplicates `Submission` data
- Question data embedded in JSON → bloat, no referential integrity
- All mode logic in one method → conditionals everywhere
- Route `{session}` conflicts with `ExamSession` binding
- No separation between question picking and answer processing

## Architecture

### Data Model

```
PracticeSession (metadata only)
├── id (uuid PK)
├── user_id (FK users)
├── skill (enum: writing|speaking)
├── mode (enum: free|shadowing|drill|guided)
├── level (enum: A2|B1|B2|C1)
├── config (jsonb: {items_count, focus_kp})
├── current_question_id (FK questions, nullable) ← question đang chờ answer
├── started_at
├── completed_at
└── timestamps

Submission (existing — add practice_session_id)
├── practice_session_id (FK practice_sessions, nullable)  ← NEW
├── ...all existing fields...
└── practiceSession() belongsTo

UserWeakPoint (existing — no changes)
└── SM-2 spaced repetition
```

### Services

```
PracticeService (orchestrator)
├── start(userId, skill, mode, options) → session + first question + recommendation
├── submit(session, answer) → result + next question + progress
├── complete(session) → summary with trend comparison
└── list(userId, skill?) → paginated history

QuestionPicker (pure logic, no side effects)
├── pick(context: PickerContext) → Question|null
├── resolveDifficulty(session, itemIndex, totalItems) → Level
├── shouldReview(context) → bool
├── pickReviewItem(context) → Question|null
└── findQuestion(skill, level, excludeIds, focusKp?) → Question|null

PickerContext (value object)
├── skill, level, mode
├── currentIndex, totalItems
├── excludeIds (session questions + recent submissions)
├── focusKp
└── userId (for weak point review)

ModeHandlers/ (strategy pattern)
├── FreeModeHandler
│   ├── processAnswer() → dispatch GradeSubmission job (async)
│   ├── buildResult() → {type: subjective, status: processing}
│   └── supportsRetry() → false
├── ShadowingHandler
│   ├── processAnswer() → PronunciationService.assess (sync, ~3-5s)
│   ├── buildResult() → {type: shadowing, pronunciation: {...}, score}
│   └── supportsRetry() → true
├── DrillHandler
│   ├── processAnswer() → PronunciationService.assess (sync, ~1-2s)
│   ├── buildResult() → {type: drill, pronunciation: {...}, score}
│   └── supportsRetry() → true
└── GuidedHandler
    ├── processAnswer() → dispatch GradeSubmission job (async)
    ├── buildResult() → {type: subjective, status: processing}
    └── supportsRetry() → false

WeakPointService (existing — no changes)
└── recordFromSubmission, getDueForReview, updateAfterPractice, detectPatterns
```

### API Endpoints

```
POST   /v1/practice/sessions                    → start
GET    /v1/practice/sessions                    → list (history)
GET    /v1/practice/sessions/{practiceSession}  → show
POST   /v1/practice/sessions/{practiceSession}/submit   → submit answer
POST   /v1/practice/sessions/{practiceSession}/complete  → end session
```

### Request/Response Examples

#### Start Session
```
POST /v1/practice/sessions
{
  "skill": "speaking",
  "mode": "shadowing",
  "level": "B1",        // optional, defaults to current_level
  "items_count": 8,     // optional, defaults per mode
  "focus_kp": "Word Stress"  // optional
}

→ 201
{
  "data": {
    "session": { id, skill, mode, level, config, started_at },
    "current_item": {
      "question": { id, topic, content, ... },
      "difficulty": "B1",
      "is_review": false,
      "reference_text": "...",         // shadowing only
      "reference_audio_url": "..."     // shadowing only
    },
    "recommendation": {
      "review_due": 3,
      "top_patterns": {"Word Stress": 5, "Articles": 3},
      "suggested_focus": "Word Stress"
    },
    "progress": { "current": 0, "total": 8 }
  }
}
```

#### Submit Answer
```
POST /v1/practice/sessions/{id}/submit
{
  "answer": { "audio_path": "speaking/user123/abc.wav" }
}

→ 200
{
  "data": {
    "result": {
      "type": "shadowing",
      "score": 7.5,
      "pronunciation": {
        "accuracy_score": 86,
        "fluency_score": 90,
        "prosody_score": 89.9,
        "transcript": "...",
        "word_errors": [...]
      }
    },
    "can_retry": true,
    "current_item": { ... next question ... },  // null if last item
    "progress": { "current": 4, "total": 8 }
  }
}
```

#### Submit Retry (same question)
```
POST /v1/practice/sessions/{id}/submit
{
  "answer": { "audio_path": "speaking/user123/def.wav" }
}
→ same response, with comparison to previous attempt
{
  "data": {
    "result": { ... },
    "can_retry": true,
    "previous_score": 6.5,
    "improvement": 1.0,
    "attempt_number": 2,
    "current_item": null,  // still same question until user moves on
    "progress": { "current": 4, "total": 8 }
  }
}
```

#### Complete Session
```
POST /v1/practice/sessions/{id}/complete
→ 200
{
  "data": {
    "session": { ..., completed_at, summary: {
      "items_completed": 8,
      "average_score": 7.5,
      "best_score": 9.0,
      "improvement": 1.5,  // vs last session
      "weak_points": ["Word Stress", "Connected Speech"],
      "mastered": ["Sentence Stress"]
    }}
  }
}
```

### Difficulty Curve

```
Items 1-30%:  Warm-up  → level.prev() (easier)
Items 30-70%: Challenge → level (current)
Items 70%+:   Stretch  → level.next() (harder)
```

### Review Mix

Every 3rd item → check if weak points are due for review.
If due → serve a question linked to that weak KP.
~30% review, ~70% new content.

### Retry Flow

```
User submits answer → Submission created → result returned
  ↓
  can_retry = true (shadowing/drill)
  ↓
User retries → NEW Submission created (same question_id, same practice_session_id)
  → result + comparison with previous attempt
  ↓
User satisfied → POST /submit with next question's answer (or POST /complete)
```

Retry creates a new Submission each time — full audit trail, no mutation.
`current_question_id` stays the same until a non-retry submit happens.

### Migrations

```sql
-- 1. Update practice_sessions: remove progress, add current_question_id
ALTER TABLE practice_sessions DROP COLUMN progress;
ALTER TABLE practice_sessions ADD current_question_id UUID REFERENCES questions(id) ON DELETE SET NULL;

-- 2. Add practice_session_id to submissions  
ALTER TABLE submissions ADD practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL;
CREATE INDEX idx_submissions_practice_session ON submissions(practice_session_id);
```

### Files to Create/Modify

| Action | File |
|--------|------|
| Modify | `database/migrations/0001_01_01_000013_create_practice_tables.php` |
| Create | `database/migrations/0001_01_01_000014_add_practice_session_id_to_submissions.php` |
| Modify | `app/Models/PracticeSession.php` — remove progress, add current_question_id + submissions() |
| Modify | `app/Models/Submission.php` — add practice_session_id + practiceSession() |
| Create | `app/Services/QuestionPicker.php` |
| Create | `app/Services/PracticeHandlers/FreeModeHandler.php` |
| Create | `app/Services/PracticeHandlers/ShadowingHandler.php` |
| Create | `app/Services/PracticeHandlers/DrillHandler.php` |
| Create | `app/Services/PracticeHandlers/GuidedHandler.php` |
| Create | `app/Contracts/PracticeModeHandler.php` (interface) |
| Rewrite | `app/Services/PracticeService.php` |
| Modify | `app/Http/Controllers/Api/V1/PracticeController.php` — route param fix |
| Modify | `routes/api.php` — `{practiceSession}` |
| Keep | `app/Services/WeakPointService.php` — no changes |
| Keep | `app/Enums/PracticeMode.php` — no changes |
| Keep | `app/Models/UserWeakPoint.php` — no changes |

### Implementation Order

1. Migration: update practice_sessions + add practice_session_id to submissions
2. Models: update PracticeSession, Submission
3. Interface: PracticeModeHandler
4. Handlers: Free, Shadowing, Drill, Guided
5. QuestionPicker
6. PracticeService rewrite
7. Controller + routes fix
8. Test
