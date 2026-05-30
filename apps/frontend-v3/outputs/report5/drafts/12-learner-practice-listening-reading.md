# 12. Learner Practice Listening & Reading Test Cases (12 cases — đã lọc)

**Module:** MCQ practice for Listening and Reading skills  
**Source:** `apps/backend-v2` McqPracticeController; `apps/frontend-v3` luyen-tap routes (nghe, doc)  
**Backend tests:** `Practice/ListeningPracticeTest.php`, `Practice/ReadingPracticeTest.php`

## Listening Practice

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| PRAC-LIS-001 | List listening exercises | Listening exercises exist | GET `practice/listening/exercises` | 200, exercise list with level/estimated minutes | High |
| PRAC-LIS-002 | Show listening exercise detail | Exercise exists with audio | GET `practice/listening/exercises/{id}` | 200, exercise with audio_url, transcript, questions | High |
| PRAC-LIS-004 | Answer listening MCQ questions | Active session | POST `practice/listening/sessions/{id}/submit` with answers | 200, score calculated, correct/incorrect per question | Critical |
| PRAC-LIS-006 | Frontend listening exercise list with filters | Exercises with different levels | Open listening page, apply level filter | Filtered list, exercise cards with progress | High |
| PRAC-LIS-007 | Frontend listening answers show results | Active session | Answer questions in focused screen | Correct/wrong feedback, score, transcript shown | Critical |

## Reading Practice

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| PRAC-REA-001 | List reading exercises | Reading exercises exist | GET `practice/reading/exercises` | 200, exercise list with metadata | High |
| PRAC-REA-002 | Show reading exercise detail | Exercise exists with passage + questions | GET `practice/reading/exercises/{id}` | 200, passage, questions, options | High |
| PRAC-REA-004 | Answer reading MCQ questions | Active session | POST `practice/reading/sessions/{id}/submit` | 200, score + correct/incorrect per question | Critical |
| PRAC-REA-005 | Frontend reading exercise with passage | Exercise has passage | Open reading exercise | Passage displayed, questions alongside, answer selection | High |
| PRAC-REA-007 | Frontend reading answers show results | Active session, all questions answered | Submit | Score, per-question results, passage with highlights | High |

## Practice Skills Page

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| PRAC-SKILLS-001 | Practice skills page renders all skills | Authenticated learner | Open `/luyen-tap` | Listening, Reading, Writing, Speaking, Vocab, Grammar sections visible | High |
