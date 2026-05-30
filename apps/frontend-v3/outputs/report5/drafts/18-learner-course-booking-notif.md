# 18. Learner Course, Booking & Notification Test Cases (10 cases — đã lọc)

**Module:** Course enrollment, 1-on-1 booking, notifications  
**Source:** `apps/backend-v2` CourseController, NotificationController; `apps/frontend-v3` khoa-hoc routes, booking features, notifications  
**Backend tests:** `Commerce/CourseEnrollmentTest.php`, `Notification/NotificationFlowTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| COURSE-EN-001 | List available courses | Published courses exist | GET `courses` | 200, course list with title, teacher, price, dates | High |
| COURSE-EN-003 | Create enrollment order | Course available, wallet enough | POST `courses/{course}/enrollment-orders` | 201, enrollment order created, coins deducted | Critical |
| COURSE-EN-005 | Course enrollment frontend flow | Course available, sufficient coins | Open course detail, click enroll | EnrollDialog, coin deduction display, success confirmation | High |
| COURSE-BK-002 | Book a slot | Available slot, enrolled, enough coins | POST `courses/{course}/bookings` with slot_id | 201, booking created, coins deducted | Critical |
| COURSE-BK-003 | Booking cost deduction from wallet | Wallet enough coins | Book slot | Wallet balance decreases by booking_coin_cost | Critical |
| COURSE-BK-004 | Cannot book beyond max slots | At max_bookings_per_student | Try to book additional slot | 422, limit reached | High |
| COURSE-BK-010 | Commitment gate blocks booking | Commitment not met (not enough full-tests in window) | Try to book | Booking blocked, message explaining commitment | High |
| NOTIF-001 | List notifications for learner | Some notifications exist | GET `notifications` | 200, notification list with type, title, body, read status | High |
| NOTIF-007 | Frontend notification bell | Authenticated, notifications exist | Click bell icon | Dropdown with recent notifications, unread badge | High |
