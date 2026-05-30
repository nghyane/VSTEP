# 19. Admin Dashboard & Analytics Test Cases (6 cases — đã lọc)

**Module:** Admin dashboard stats, alerts  
**Source:** `apps/backend-v2` Admin DashboardController; `apps/admin` dashboard components  
**Backend tests:** `Admin/AdminDashboardTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-DASH-001 | Dashboard returns aggregate stats | Admin authenticated, data seeded | GET `admin/stats` | 200, users_total, exams_total, exams_published, vocab_topics, grammar_points | High |
| ADM-DASH-002 | Dashboard alerts detects failed grading jobs | Failed grading job exists | GET `admin/alerts` | 200, alert with type=error | High |
| ADM-DASH-005 | Admin dashboard requires staff role | Learner user | GET `admin/stats` with learner token | 403 Forbidden | Critical |
| ADM-DASH-007 | Frontend admin dashboard renders all card sections | Admin authenticated, data available | Open admin dashboard | Stats cards, revenue charts, wallet economy, content chart, grading throughput, alerts visible | Critical |
