# 17. Learner Dashboard & Progress Test Cases (12 cases — đã lọc)

**Module:** Overview, progress tracking, streak, learning path  
**Source:** `apps/backend-v2` OverviewController, LearningPathController, ProgressService, StreakMilestoneService; `apps/frontend-v3` dashboard  
**Backend tests:** `Progress/ProgressStreakTest.php`, `Progress/StreakMilestoneTest.php`, `Progress/LearningPathServiceTest.php`, `LearningPathApiTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| DASH-OV-001 | Overview returns profile/skill/streak/progress | Authenticated learner with data | GET `overview` | 200, profile info, skill scores, streak data, progress | Critical |
| DASH-OV-003 | Frontend dashboard renders overview cards | Authenticated, some data | Open `/dashboard` | Overview cards, skill section, next action, recent activity | High |
| DASH-PROG-002 | Spider chart hidden when fewer than 5 graded exams | Exam count < 5 | Open dashboard | Chart hidden, message shown | High |
| DASH-PROG-003 | Spider chart shows when enough graded exams | 5+ graded full tests | Open dashboard | 4-axis spider chart with L/R/W/S bands | High |
| DASH-STK-001 | Streak endpoint shows current state | Authenticated, activity today | GET `streak` | 200, current streak, today_active, milestones | High |
| DASH-STK-002 | Streak increases after full-test submission | Learner submits full-test exam today | Submit exam, check streak | Streak increments (if first full-test today), today_active=true | Critical |
| DASH-STK-003 | Claim streak milestone grants coins | Streak days reach milestone threshold | POST `streak/milestones/{days}/claim` | 200, coins granted, wallet updated, milestone marked claimed | High |
| DASH-STK-005 | Frontend streak dialog | Authenticated with streak data | Open streak dialog from dashboard | Current streak, milestones progress bar, chest rewards, claim buttons | High |
| DASH-LP-001 | Learning path returns weak skill recommendations | Learner has exam results showing skill gaps | GET `learning-path` | 200, recommended skills with band/coverage data | Critical |
| DASH-LP-004 | Frontend recommendation section | Weak skills detected | Open practice or dashboard | Recommendation cards with band, coverage, suggested exercises | High |
