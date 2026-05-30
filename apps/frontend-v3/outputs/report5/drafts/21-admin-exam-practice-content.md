# 21. Admin Exam & Practice Content Test Cases (22 cases — đã lọc)

**Module:** Admin exam management (CRUD, versions, content), admin practice content  
**Source:** `apps/backend-v2` Admin ExamController, ExamVersionController, ExamContentController, ListeningController, ReadingController, WritingController, SpeakingTaskController, SpeakingDrillController, SpeakingScenarioController; `apps/admin` exams, practice routes  
**Backend tests:** `Admin/Practice/AdminListeningTest.php`, `Admin/Practice/AdminReadingTest.php`, `Admin/Practice/AdminWritingTest.php`, `Admin/Practice/AdminSpeakingTaskTest.php`, `Admin/Practice/AdminSpeakingDrillTest.php`

## Exam CRUD

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-EXAM-001 | List all exams | Admin authenticated | GET `admin/exams` | 200, exam list with draft/published status | High |
| ADM-EXAM-002 | Create exam | Admin authenticated | POST `admin/exams` with title/slug/duration | 201, exam created as draft | High |
| ADM-EXAM-003 | Update exam | Exam exists | PATCH `admin/exams/{id}` | 200, exam updated | High |
| ADM-EXAM-004 | Publish exam | Draft exam with complete version and content | POST `admin/exams/{id}/publish` | 200, exam visible to learners | Critical |
| ADM-EXAM-005 | Unpublish exam | Published exam | POST `admin/exams/{id}/unpublish` | 200, exam hidden | High |
| ADM-EXAM-007 | Import exam | Valid import payload | POST `admin/exams/import` | 201, exam created from import | High |
| ADM-EXAM-008 | Frontend admin exam list | Admin logged in | Open exams section | Exam list, version selector, publish actions | High |

## Exam Version & Content

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-EXAM-VER-001 | List exam versions | Exam has versions | GET `admin/exams/{examId}/versions` | 200, version list | High |
| ADM-EXAM-VER-003 | Activate exam version | Multiple versions | POST activate | Active version becomes the visible one | Critical |
| ADM-EXAM-VER-005 | Frontend version selector | Multiple versions | Open exam, switch | Active version highlighted | High |
| ADM-EXAM-CON-001 | Create listening section with items | Version exists | POST listening section + items | 201, content created | High |
| ADM-EXAM-CON-003 | Create reading passage with items | Version exists | POST reading passage + items | 201, content created | High |
| ADM-EXAM-CON-004 | Create writing task | Version exists | POST task with type/min_words/prompt | 201 | High |
| ADM-EXAM-CON-005 | Create speaking part | Version exists | POST part with prompt/duration | 201 | High |
| ADM-EXAM-CON-006 | Frontend exam content editors (4 tabs) | Version selected | Open Listening/Reading/Writing/Speaking tabs | Forms render, content editable | High |

## Practice Content Admin

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-PRAC-LIS-002 | Create listening exercise | Admin authenticated | POST with title/level/audio_url/transcript | 201 | High |
| ADM-PRAC-LIS-005 | Frontend listening exercise editor | Admin logged in | Open practice → listening | Exercise list, form, questions tab | High |
| ADM-PRAC-REA-002 | Create reading exercise | Admin authenticated | POST with title/level/passage | 201 | High |
| ADM-PRAC-REA-004 | Frontend reading exercise editor | Admin logged in | Open practice → reading | Exercise form, questions tab | High |
| ADM-PRAC-WRI-002 | Create writing prompt | Admin authenticated | POST with title/level/task_type/min_words | 201 | High |
| ADM-PRAC-WRI-004 | Frontend writing prompt editor | Admin logged in | Open practice → writing | Prompt form, markers tab | High |
| ADM-PRAC-SPK-004 | Create speaking VSTEP task | Admin authenticated | POST with title/level/part/prompt/duration | 201 | High |
| ADM-PRAC-SPK-008 | Frontend speaking scenario editor | Admin logged in | Open practice → speaking scenarios | Form, publish toggle | High |
