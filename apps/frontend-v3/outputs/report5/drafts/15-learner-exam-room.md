# 15. Learner Exam Room Test Cases (30 cases — đã lọc)

**Module:** Exam library, exam detail, session start, exam room panels, submit, result  
**Source:** `apps/backend-v2` ExamController; `apps/frontend-v3` thi-thu routes, phong-thi routes, exam features  
**Backend tests:** `Exam/ExamSessionTest.php`

## Exam Library

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-LIB-001 | List published exams with config and sessions | Published exams exist, authenticated learner | GET `exams`, GET `config`, GET `exam-sessions` | Exam cards show with status: not-started/in-progress/submitted | Critical |
| EXAM-LIB-003 | Filter exam by status all/not-started/in-progress/submitted | Mixed status exams | Switch filter tab, URL search param `status` updates | Correct cards displayed, tab counts update | High |

## Exam Detail

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-DET-001 | Show exam detail with sections | Published exam with version | GET `exams/{id}` | 200, exam detail with version, listening/reading/writing/speaking sections, session history | High |
| EXAM-DET-002 | Skill selector expands skill rows | Exam detail page | Toggle Listening/Reading/Writing/Speaking checkboxes | Selected count, skill rows with part info, duration panel update | High |
| EXAM-DET-003 | Full test cost displays correctly | Config pricing loaded | No skill selected | Full-test cost displayed in bottom action bar | High |

## Start Session

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-START-001 | Start full test session charges coins | Wallet balance ≥ 25 coins | POST `exams/{examId}/sessions` mode=full | 201, coins_charged=25, wallet debited, session_id returned | Critical |
| EXAM-START-002 | Start custom session charges per skill | Wallet balance ≥ per-skill cost | POST mode=custom, selected_skills | 201, coins_charged=selected×8, wallet debited | Critical |
| EXAM-START-003 | Insufficient balance rejects session | Wallet balance < cost | POST exam session creation | 422, session not created, balance unchanged | Critical |
| EXAM-START-004 | Frontend shows top-up dialog when low balance | Wallet low | Click start exam | TopUpDialog opens, session start blocked | High |
| EXAM-START-005 | Continue active same-exam session | Active non-expired session exists | Click continue on exam card/detail | Navigate to existing /phong-thi/{sessionId} | High |

## Device Check

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-DC-001 | Device check shows exam structure and media tests | Session includes Listening and Speaking | Enter exam room before start | Structure, duration, audio test, microphone test, notes, start button | High |

## Draft Autosave

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-DRAFT-001 | Save exam draft | Active session, answers exist | PUT `exam-sessions/{id}/draft` | 200, draft saved with skill_idx, mcq_answers, writing_answers, speaking_marks | Critical |
| EXAM-DRAFT-003 | Draft autosave debounce in frontend | Active exam, answers change | Answer MCQ, write text, wait debounce 5s | PUT draft endpoint called | Critical |
| EXAM-DRAFT-004 | Resume active draft skips device check | Active session with draft | Reopen exam room URL | Active phase opens directly with restored skill/answers | Critical |

## Exam Panels

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-PANEL-001 | Listening readiness modal | Listening active | Click audio | Modal shown, confirm → audio plays | High |
| EXAM-PANEL-004 | Reading passage/question split layout | Reading passage + items | Open reading panel | Passage on one side, questions on other, navigation works | High |
| EXAM-PANEL-006 | Writing editor with word count | Writing tasks exist | Type text | Word count, min_word progress, task tabs | High |
| EXAM-PANEL-008 | Speaking panel with recording | Microphone permission granted | Record part, stop, playback, confirm | Recording states, waveform, playback, done marks | High |
| EXAM-PANEL-009 | Speaking microphone denied | Microphone blocked | Attempt recording | Error message shown, recording cannot proceed | High |

## Section Transition

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-TRANS-001 | Next skill confirm dialog | Current skill has answers | Click next | Confirm dialog with warning counts (unanswered, under-minimum, incomplete parts) | High |
| EXAM-TRANS-002 | Next skill locks previous skill | Confirm next | Transition to next skill | Previous skill inaccessible | High |

## Submit

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-SUBMIT-001 | Manual submit posts answers and invalidates caches | All selected skills completed | Click submit, confirm | POST submit called; exam, session, streak, overview, course, booking caches invalidated; result screen shown | Critical |
| EXAM-SUBMIT-002 | Auto-submit after timer expires | Timer reaches 0 | Wait for expiry | Expired overlay appears, submit triggered automatically | Critical |
| EXAM-SUBMIT-003 | Submit with correct MCQ scoring | MCQ answers mixed correct/wrong | Submit | Score calculated, correct/incorrect per item | Critical |

## Result

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| EXAM-RESULT-001 | Submit result summary displays MCQ score | Session submitted | Open result page | Score circle, skill rows, pending AI badges for Writing/Speaking | Critical |
| EXAM-RESULT-002 | Writing feedback displays after grading | Writing graded | Refresh result page | Overall band, rubric dimensions, strengths, improvements, rewrites | High |
| EXAM-RESULT-004 | Result polling while AI grading pending | Writing/Speaking feedback overall_band is null | Open result page | Query polls every 5 seconds until all feedback has band | High |
| EXAM-RESULT-005 | Result detail page shows MCQ answer grid | Session submitted | Click detail link | Selected vs correct answers displayed, per-question accuracy | High |
