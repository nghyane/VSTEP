# 25. Backend API Integration & System Test Cases (12 cases — đã lọc)

**Module:** Cross-cutting backend concerns: auth middleware, role hierarchy, health, config, payment callbacks, cross-module integration  
**Source:** `apps/backend-v2` middleware, controllers, routes; `apps/backend-v2` seeders  
**Backend tests:** `Middleware/RoleHierarchyTest.php`, `Config/EconomyConfigTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| SYS-AUTH-001 | Authenticated learner cannot access admin routes | Learner token | GET `admin/stats` | 403 | Critical |
| SYS-AUTH-003 | Staff cannot access admin-only routes (system config, users, promo) | Staff token (not admin) | GET `admin/system-config` | 403 | Critical |
| SYS-AUTH-004 | Teacher can access teacher routes | Teacher token | GET `teacher/dashboard` | 200 | Critical |
| SYS-AUTH-006 | Unauthenticated request rejected for protected routes | No token | GET any protected endpoint | 401 | Critical |
| SYS-INT-001 | Exam submission triggers streak update | Learner submits full-test exam | Submit exam, check streak | Streak updated if first full-test today | High |
| SYS-INT-002 | Grading completion triggers notification | Writing/speaking graded | Grading completes | Notification created for learner | High |
| SYS-INT-003 | Top-up completion triggers notification | Payment callback confirms top-up | Top-up confirmed | Notification created, wallet balance updated in UI | High |
| SYS-HLTH-001 | Health endpoint returns OK | Backend running, DB connected | GET `health` | 200, status ok | High |
| SYS-HLTH-002 | Config endpoint returns app config | Backend running | GET `config` | 200, pricing, exam config, chart config values returned | High |
| SYS-PAY-001 | Payment callback endpoint is public | No auth required | POST `payment/callback/{provider}` | Processes without auth, provider-specific data | Critical |
