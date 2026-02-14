# Instructor Review Workflow

> **Version**: 2.0 · SP26SE145

## 1. Overview

When AI confidence is `medium` or `low`, a Writing/Speaking submission enters `review_pending` status. Instructors review the AI result and submit a final score. The instructor's score is always authoritative — no blending with the AI score.

---

## 2. Review Queue

### `GET /api/submissions/review/queue`

Returns submissions in `review_pending` status, ordered by priority then creation time (FIFO within same priority).

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `skill` | `writing` \| `speaking` | Filter by skill |
| `priority` | `low` \| `medium` \| `high` | Filter by review priority |
| `page` | number | Pagination |
| `limit` | number | Page size (default 20) |

**Response:** Paginated list with `{ data, meta }`. Each item includes submission summary, AI score, confidence level, priority, and claim status.

---

## 3. Claim / Release

### `POST /api/submissions/:id/review/claim`

Instructor claims a submission before reviewing. Sets `claimedBy` (instructor user ID) and `claimedAt` (timestamp) on the submission.

- If already claimed by another instructor → `409 Conflict`
- If submission not in `review_pending` → `409 Conflict`

### `POST /api/submissions/:id/review/release`

Releases a claimed submission back to the queue. Clears `claimedBy` and `claimedAt`.

- Only the claiming instructor (or admin) can release
- No automatic timeout-based release (kept simple for capstone scope)

---

## 4. Submit Review

### `POST /api/submissions/:id/review`

Instructor submits their final assessment. Payload:

```typescript
{
  overallScore: number;       // 0-10, 0.5 steps
  band: "B1" | "B2" | "C1";
  criteriaScores: {
    name: string;
    score: number;
    feedback: string;
  }[];
  feedback: string;           // general feedback
  reviewComment?: string;     // internal note for audit
}
```

**Effects:**
1. Submission status → `completed`
2. `gradingMode` → `'human'`
3. `humanScore` stored alongside existing `aiScore`
4. `auditFlag` = true if `|aiScore - humanScore| > 0.5`
5. `reviewedBy` and `reviewedAt` recorded

**Preconditions:**
- Submission must be in `review_pending` status
- Instructor must be the current claimant (or admin)

---

## 5. Admin Assignment

### `POST /api/submissions/:id/review/assign`

Admin directly assigns a reviewer to a submission. Sets `claimedBy` to the specified instructor, bypassing the claim flow.

- Only accessible to admin role
- Overrides any existing claim

---

## 6. Scoring Rules

- **Final score = instructor score.** Always. No weighted merge.
- `gradingMode = 'human'` on all reviewed submissions
- Both AI and human results preserved in `submissionDetails` for audit
- `auditFlag` tracks significant AI-human discrepancies for model improvement

---

## 7. Error Cases

| Scenario | Response |
|----------|----------|
| Review payload missing required fields | `400 Bad Request` |
| Submission not in `review_pending` | `409 Conflict` |
| Submission claimed by another instructor | `409 Conflict` |
| Instructor not authorized | `403 Forbidden` |
| Submission not found | `404 Not Found` |

---

## 8. Cross-references

| Topic | Document |
|-------|----------|
| Confidence routing rules | `hybrid-grading.md` |
| Submission states | `submission-lifecycle.md` |
| API endpoint catalog | `../10-contracts/api-endpoints.md` |
