# AI Grading & Confidence Routing

> **Version**: 2.0 · SP26SE145

## 1. Overview

Writing and Speaking submissions are graded by AI (Gemini). The AI produces a structured result with a self-assessed confidence level. Confidence determines whether the result is auto-accepted or routed to an instructor for review. Listening/Reading are auto-graded locally and are not covered here.

---

## 2. Grading Pipelines

### 2.1 Writing

```
Submission text
  ├─> Gemini (structured rubric prompt)
  │     → Task Achievement, Coherence, Lexical Resource scores + feedback
  ├─> Grammar model
  │     → Grammar errors list + Grammatical Range score
  └─> Merge
        → AIGradeResult
```

Single Gemini call with structured output. Grammar model runs in parallel for detailed error detection. Results are merged into one `AIGradeResult`.

**VSTEP Writing Criteria** (each scored 0-10):
- Task Achievement
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy

### 2.2 Speaking

```
Audio file
  ├─> Whisper (STT)
  │     → Transcript text
  └─> Gemini (transcript + audio context)
        → Fluency, Pronunciation, Content, Vocabulary scores + feedback
        → AIGradeResult
```

Whisper transcribes audio first. Gemini grades the transcript against the rubric.

**VSTEP Speaking Criteria** (each scored 0-10):
- Fluency & Coherence
- Pronunciation
- Content & Relevance
- Vocabulary & Grammar

---

## 3. AI Result Contract

```typescript
type AIGradeResult = {
  overallScore: number;         // 0-10, 0.5 steps
  band: "B1" | "B2" | "C1";    // derived via scoreToBand()
  criteriaScores: {
    name: string;
    score: number;              // 0-10
    feedback: string;
  }[];
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  grammarErrors?: {             // writing only
    sentence: string;
    error: string;
    correction: string;
  }[];
  confidence: "high" | "medium" | "low";
};
```

---

## 4. Confidence

### 4.1 How It's Determined

3 levels, not a numeric 0-100 score. Derived from two signals:

1. **AI self-assessment**: Gemini is prompted to rate its own confidence as part of the structured output.
2. **Schema validation**: if the AI output fails structural checks (missing criteria, scores out of range), confidence is downgraded.

| Level | Meaning |
|-------|---------|
| `high` | AI is confident, output well-structured |
| `medium` | AI reports uncertainty or minor schema issues |
| `low` | AI explicitly uncertain, or significant schema/content problems |

### 4.2 Routing Rules

| Confidence | Submission Status | Review Priority |
|------------|-------------------|-----------------|
| `high` | `completed` (auto-accept) | — |
| `medium` | `review_pending` | `medium` |
| `low` | `review_pending` | `high` |

No spot-check system. No 4-factor weighted formula. No N=3 LLM consistency runs.

---

## 5. Instructor Review

### 5.1 What the Instructor Sees

- Original question + rubric
- Learner's submission (text or audio + transcript)
- Full AI result: scores, criteria breakdown, feedback, grammar errors
- AI confidence level

### 5.2 Review Outcome

The instructor submits their own scores. **Instructor score is always final.**

- `gradingMode` is set to `'human'`
- No weighted blending (no 40/60 merge)
- Both `aiScore` and `humanScore` are preserved in `submissionDetails`

### 5.3 Audit Flag

```
auditFlag = |aiScore - humanScore| > 0.5
```

When flagged, the discrepancy is recorded for future model analysis. This helps track AI accuracy over time but has no effect on the final score.

---

## 6. Score Computation

- `overallScore` = weighted average of criteria scores (equal weights)
- Rounded to nearest 0.5 via `calculateScore()`
- Band derived via `scoreToBand()`:
  - 8.5-10 → C1
  - 6.5-8.0 → B2
  - 4.0-6.0 → B1
  - Below 4.0 → null (below VSTEP threshold)

---

## 7. Cross-references

| Topic | Document |
|-------|----------|
| Submission states & transitions | `submission-lifecycle.md` |
| Review queue & claim workflow | `review-workflow.md` |
| Redis task format | `../10-contracts/queue-contracts.md` |
