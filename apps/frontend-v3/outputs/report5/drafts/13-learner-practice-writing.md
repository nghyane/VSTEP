# 13. Learner Practice Writing Test Cases (10 cases — đã lọc)

**Module:** Writing practice prompts, submission, AI feedback  
**Source:** `apps/backend-v2` WritingPracticeController, WritingFeedbackController; `apps/frontend-v3` writing routes/features  
**Backend tests:** `Practice/WritingPracticeTest.php`, `Validation/VstepWritingValidationTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| WRI-001 | List writing prompts | Prompts exist | GET `practice/writing/prompts` | 200, list with title, level, task type, estimated minutes | High |
| WRI-004 | Submit writing answer | Active session | POST `practice/writing/sessions/{id}/submit` with text | 200, submission accepted, feedback job triggered | Critical |
| WRI-005 | Submit writing answer below min_words | Active session, min_words config exists | Submit text shorter than min_words | 422, validation error for word count | High |
| WRI-007 | Generate AI feedback for writing submission | Submitted writing, AI service available | POST `practice/writing/submissions/{id}/feedback` | 201 or 200, grading job created, SSE stream available | Critical |
| WRI-008 | Writing feedback SSE receives completion | Grading job active | Connect to grading job stream | Progress events, scores event, feedback event, done event | Critical |
| WRI-010 | Frontend writing editor with word count | Prompt detail page | Type text | Word count updates, min_word progress bar, validation messages | High |
| WRI-011 | Frontend writing grading screen | Submitted writing, grading in progress | Wait for feedback | Pending → scoring → feedback phases, overall band, rubric dimensions | Critical |
| WRI-012 | Frontend writing result displays sections | Graded writing with feedback | Open writing result | Strengths, Improvements, Rewrites sections displayed | High |
