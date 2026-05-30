# 24. Backend Grading & AI Test Cases (12 cases — đã lọc)

**Module:** Grading jobs, scoring formulas, AI services, grading pipeline  
**Source:** `apps/backend-v2` GradingController, GradingStreamController, AI service contracts and implementations  
**Backend tests:** `Grading/GradingPipelineTest.php`, `Unit/Grading/WritingScoringFormulaTest.php`, `Unit/Grading/SpeakingScoringFormulaTest.php`, `Unit/Ai/*WireTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| GRD-WF-003 | Writing result lookup by submission type | Graded writing submission exists | GET `grading/writing/{submissionType}/{submissionId}` | 200, writing result with band, rubric scores, feedback | Critical |
| GRD-WF-004 | Speaking result lookup by submission type | Graded speaking submission exists | GET `grading/speaking/{submissionType}/{submissionId}` | 200, speaking result with band, rubric scores, transcript | Critical |
| GRD-WF-005 | Grading SSE stream emits progress/scores/feedback | Active grading job | GET `grading-jobs/{id}/stream` | SSE events: progress, scores, feedback, done/completed | Critical |
| GRD-WF-006 | FeedbackCompleted event fires after grading | Grading completes | Grading pipeline finishes | Event dispatched, notification sent | High |
| GRD-WRI-001 | Writing scoring formula with valid rubric parameters | Valid rubric data | Run scoring formula | Deterministic score based on rubric weights and evidence | High |
| GRD-WRI-005 | Writing validation: VSTEP requirements | Writing submission | Validate submission against VSTEP criteria | Valid/invalid based on task type, word count, content | High |
| GRD-SPK-001 | Speaking scoring formula with rubric parameters | Valid rubric data | Run scoring formula | Band score based on pronunciation, fluency, grammar, vocabulary | High |
| GRD-SPK-002 | Conversation turn handling | User audio and text | Process conversation turn | Content relevance, task fulfillment assessed | High |
| GRD-AI-001 | LLM grading service handles request/response | Grading request | Send to LLM, receive response | Correct wire format, parsed grading result | High |
| GRD-AI-005 | Grading pipeline end-to-end (test) | Full grading pipeline test | Submit writing/speaking, observe pipeline | Grading job created, processing, result persisted, event fired | Critical |
