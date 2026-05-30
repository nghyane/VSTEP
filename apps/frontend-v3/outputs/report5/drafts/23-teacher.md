# 23. Teacher Test Cases (7 cases — đã lọc)

**Module:** Teacher dashboard, schedule, bookings, leave requests  
**Source:** `apps/backend-v2` Admin TeacherController; `apps/admin` teacher routes  
**Backend tests:** `Admin/AdminCourseServiceDecompositionTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| TCH-DASH-001 | Teacher dashboard returns stats | Teacher authenticated with assigned courses | GET `teacher/dashboard` | 200, dashboard data with course stats | High |
| TCH-DASH-002 | Teacher cannot access admin-only routes | Teacher role (not admin) | GET `admin/system-config` | 403 | Critical |
| TCH-SCH-001 | List schedule items | Teacher authenticated, courses assigned | GET `teacher/schedule-items` | 200, schedule list with course/date/time | High |
| TCH-SCH-002 | Frontend teacher schedule calendar | Teacher logged in | Open teacher schedule page | Calendar with DayCell, EventCard, EventDetailModal | High |
| TCH-BK-001 | List teacher bookings | Bookings exist | GET `teacher/bookings` | 200, booking list with learner, status | High |
| TCH-LEAVE-002 | Create leave request | Teacher authenticated | POST `teacher/leave-requests` with date/reason | 201, leave request created, status pending | High |
| TCH-LEAVE-003 | Staff approves leave request | Staff authenticated, pending leave | PATCH `admin/leave-requests/{id}` with approved | 200, leave approved | Medium |
