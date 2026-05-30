# 11. Learner Vocab & Grammar Test Cases (12 cases — đã lọc)

**Module:** Vocabulary topics, SRS, exercises; Grammar points and exercises  
**Source:** `apps/backend-v2` VocabController, GrammarController; `apps/frontend-v3` vocab/grammar features/routes  
**Backend tests:** `Vocab/VocabExerciseTest.php`, `Vocab/VocabSrsFlowTest.php`, `Grammar/GrammarPracticeTest.php`, `Unit/Srs/FsrsSchedulerTest.php`

## Vocabulary: Topic Browsing

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| VOC-001 | List vocabulary topics | Topics seeded in DB | GET `vocab/topics` | 200, topics list with publish status, word count | High |
| VOC-002 | Show vocabulary topic detail | Published topic exists | GET `vocab/topics/{id}` | 200, topic with words list, progress info | High |

## Vocabulary: Exercises

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| VOC-EX-004 | Frontend exercise flow (MCQ + fill-blank) | Topic has exercises | Open exercise, answer, submit | Result displayed, progress updated | High |

## Vocabulary: SRS Review

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| VOC-SRS-001 | SRS queue returns due cards | Words previously learned, due for review | GET `vocab/srs/queue` | 200, list of due review items | High |
| VOC-SRS-002 | SRS review updates scheduling | Due word in queue | POST `vocab/srs/review` with word_id and rating (good/again) | 200, due date updated via FSRS algorithm | High |
| VOC-SRS-004 | Frontend SRS review flow | Due cards exist | Open focused SRS review, rate cards | Cards rated, queue updated, progress saved | High |
| VOC-SRS-006 | FSRS scheduler computes correct intervals | Unit test | Call scheduler with new/learning/review states | Intervals match FSRS formula, state transitions correct | High |

## Grammar: Point Browsing

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| GRAM-001 | List grammar points | Points seeded in DB | GET `grammar/points` | 200, points list with publish status | High |
| GRAM-002 | Show grammar point detail | Published point exists | GET `grammar/points/{id}` | 200, point with structures/examples/mistakes/tips | High |

## Grammar: Exercises

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| GRAM-EX-002 | Frontend grammar exercise flow | Point with exercise | Open exercise, answer questions, submit | Instant feedback, result summary, retry option | High |
| GRAM-EX-004 | Grammar exercise handles retry | Previously completed exercise | Click retry | New session started, fresh answers | Medium |
