# SƠ ĐỒ CÂY REPORT 5 — 215 TEST CASES

```
Report 5 — Software Test Documentation
│
├── 1. Auth & Profile (23 cases)
│   ├── Guest — Register
│   │   ├── AUTH-REG-001  Đăng ký học viên hợp lệ
│   │   └── AUTH-REG-002  Đăng ký thất bại nếu email đã tồn tại
│   │
│   ├── Guest — Login
│   │   ├── AUTH-LOGIN-001  Đăng nhập đúng credentials
│   │   ├── AUTH-LOGIN-002  Admin login trả profile: null
│   │   ├── AUTH-LOGIN-003  Từ chối sai mật khẩu
│   │   ├── AUTH-LOGIN-005  Frontend mở overlay login
│   │   ├── AUTH-LOGIN-006  Frontend redirect dashboard sau login
│   │   └── AUTH-LOGIN-008  Frontend từ chối non-learner
│   │
│   ├── Guest — Google Auth
│   │   ├── AUTH-GOOGLE-001  Google login có profile
│   │   └── AUTH-GOOGLE-003  Google login conflict
│   │
│   ├── Session
│   │   ├── AUTH-SESS-001  Refresh token
│   │   ├── AUTH-SESS-002  Refresh hết hạn
│   │   ├── AUTH-SESS-003  Logout
│   │   ├── AUTH-SESS-004  API từ chối thiếu token
│   │   └── AUTH-SESS-007  Redirect user chưa auth
│   │
│   └── Profile
│       ├── PROF-001  Liệt kê profile
│       ├── PROF-002  Tạo profile mới
│       ├── PROF-003  Switch profile
│       ├── PROF-004  Cập nhật profile frontend
│       ├── PROF-006  Không truy cập profile người khác
│       ├── PROF-008  Hoàn thành onboarding + tặng xu
│       ├── PROF-009  Đổi mật khẩu
│       └── PROF-010  Upload avatar
│
├── 2. Vocab & Grammar (11 cases)
│   ├── Vocabulary — Topics
│   │   ├── VOC-001  Liệt kê topic
│   │   └── VOC-002  Xem chi tiết topic
│   │
│   ├── Vocabulary — Exercises
│   │   └── VOC-EX-004  Frontend flow làm bài tập
│   │
│   ├── Vocabulary — SRS Review
│   │   ├── VOC-SRS-001  SRS queue
│   │   ├── VOC-SRS-002  SRS cập nhật lịch ôn
│   │   ├── VOC-SRS-004  Frontend SRS flow
│   │   └── VOC-SRS-006  FSRS scheduler tính đúng
│   │
│   └── Grammar
│       ├── GRAM-001  Liệt kê điểm ngữ pháp
│       ├── GRAM-002  Xem chi tiết điểm
│       ├── GRAM-EX-002  Frontend flow làm bài tập
│       └── GRAM-EX-004  Làm lại bài tập
│
├── 3. Practice Listening & Reading (11 cases)
│   ├── Listening
│   │   ├── PRAC-LIS-001  List bài nghe
│   │   ├── PRAC-LIS-002  Detail bài nghe
│   │   ├── PRAC-LIS-004  Trả lời bài nghe
│   │   ├── PRAC-LIS-006  Frontend list + filter
│   │   └── PRAC-LIS-007  Frontend kết quả
│   │
│   ├── Reading
│   │   ├── PRAC-REA-001  List bài đọc
│   │   ├── PRAC-REA-002  Detail bài đọc
│   │   ├── PRAC-REA-004  Trả lời bài đọc
│   │   ├── PRAC-REA-005  Frontend passage
│   │   └── PRAC-REA-007  Frontend kết quả
│   │
│   └── Skills Page
│       └── PRAC-SKILLS-001  Trang kỹ năng hiển thị đủ
│
├── 4. Practice Writing (8 cases)
│   ├── WRI-001  List prompts
│   ├── WRI-004  Gửi bài viết → chấm AI
│   ├── WRI-005  Từ chối dưới min_words
│   ├── WRI-007  Generate AI feedback
│   ├── WRI-008  SSE stream feedback
│   ├── WRI-010  Editor đếm từ
│   ├── WRI-011  Màn hình chấm (pending→scoring→feedback)
│   └── WRI-012  Strengths/Improvements/Rewrites
│
├── 5. Practice Speaking (9 cases)
│   ├── Speaking Drills
│   │   ├── SPK-DRL-004  Gửi bài phát âm
│   │   └── SPK-DRL-006  Frontend list drill
│   │
│   ├── VSTEP Speaking
│   │   ├── SPK-VST-004  Gửi bài nói VSTEP
│   │   └── SPK-VST-006  Frontend luyện nói
│   │
│   ├── Conversation AI
│   │   ├── SPK-CONV-003  Bắt đầu hội thoại
│   │   ├── SPK-CONV-004  Gửi lượt hội thoại
│   │   ├── SPK-CONV-006  Review hội thoại
│   │   └── SPK-CONV-008  Frontend flow hội thoại
│   │
│   └── Shadowing
│       └── SPK-SHA-003  Frontend shadowing session
│
├── 6. Exam Room (28 cases)
│   ├── Exam Library
│   │   ├── EXAM-LIB-001  List đề + status
│   │   └── EXAM-LIB-003  Lọc status
│   │
│   ├── Exam Detail
│   │   ├── EXAM-DET-001  Detail exam
│   │   ├── EXAM-DET-002  Skill selector
│   │   └── EXAM-DET-003  Giá full test
│   │
│   ├── Start Session
│   │   ├── EXAM-START-001  Bắt đầu full test trừ xu
│   │   ├── EXAM-START-002  Bắt đầu custom trừ xu
│   │   ├── EXAM-START-003  Từ chối thiếu xu
│   │   ├── EXAM-START-004  Mở top-up dialog
│   │   └── EXAM-START-005  Continue phiên active
│   │
│   ├── Device Check
│   │   └── EXAM-DC-001  Device check audio/mic
│   │
│   ├── Draft Autosave
│   │   ├── EXAM-DRAFT-001  Lưu draft
│   │   ├── EXAM-DRAFT-003  Frontend autosave 5s
│   │   └── EXAM-DRAFT-004  Resume từ draft
│   │
│   ├── Exam Panels
│   │   ├── EXAM-PANEL-001  Listening readiness
│   │   ├── EXAM-PANEL-004  Reading panel
│   │   ├── EXAM-PANEL-006  Writing editor
│   │   ├── EXAM-PANEL-008  Speaking recording
│   │   └── EXAM-PANEL-009  Speaking mic denied
│   │
│   ├── Section Transition
│   │   ├── EXAM-TRANS-001  Dialog chuyển skill
│   │   └── EXAM-TRANS-002  Khóa skill trước
│   │
│   ├── Submit
│   │   ├── EXAM-SUBMIT-001  Nộp bài thủ công
│   │   ├── EXAM-SUBMIT-002  Auto-submit hết giờ
│   │   └── EXAM-SUBMIT-003  Tính điểm MCQ
│   │
│   └── Result
│       ├── EXAM-RESULT-001  Result summary
│       ├── EXAM-RESULT-002  Writing feedback graded
│       ├── EXAM-RESULT-004  Poll 5s pending
│       └── EXAM-RESULT-005  Result detail
│
├── 7. Wallet & Top-up & Promo (11 cases)
│   ├── WALL-BAL-001  Lấy số dư ví
│   ├── WALL-BAL-003  Header hiển thị xu
│   ├── WALL-TOP-001  Chỉ active packages
│   ├── WALL-TOP-002  Frontend dialog nạp
│   ├── WALL-PAY-001  Tạo đơn nạp
│   ├── WALL-PAY-002  Confirm nạp cộng xu
│   ├── WALL-PAY-004  Redirect payment URL
│   ├── WALL-PROMO-001  Đổi mã hợp lệ
│   ├── WALL-PROMO-002  Từ chối mã sai
│   ├── WALL-PROMO-005  Frontend card đổi mã
│   └── WALL-PROMO-006  Frontend lỗi mã
│
├── 8. Dashboard & Progress (10 cases)
│   ├── DASH-OV-001  Overview data
│   ├── DASH-OV-003  Frontend dashboard
│   ├── DASH-PROG-002  Ẩn spider chart < 5 bài
│   ├── DASH-PROG-003  Hiện spider chart ≥ 5 bài
│   ├── DASH-STK-001  Streak state
│   ├── DASH-STK-002  Streak tăng sau full-test
│   ├── DASH-STK-003  Nhận milestone reward
│   ├── DASH-STK-005  Frontend streak dialog
│   ├── DASH-LP-001  Learning path
│   └── DASH-LP-004  Frontend recommendation
│
├── 9. Course & Booking (9 cases)
│   ├── COURSE-EN-001  List courses
│   ├── COURSE-EN-003  Tạo enrollment order
│   ├── COURSE-EN-005  Frontend enroll flow
│   ├── COURSE-BK-002  Book slot
│   ├── COURSE-BK-003  Trừ xu khi book
│   ├── COURSE-BK-004  Max bookings limit
│   ├── COURSE-BK-010  Commitment gate
│   ├── NOTIF-001  List notifications
│   └── NOTIF-007  Frontend bell
│
├── 10. Admin (56 cases)
│   ├── Dashboard (4)
│   │   ├── ADM-DASH-001  Dashboard stats tổng
│   │   ├── ADM-DASH-002  Alerts failed grading
│   │   ├── ADM-DASH-005  Role enforcement
│   │   └── ADM-DASH-007  Frontend dashboard
│   │
│   ├── Vocab, Grammar, Settings (13)
│   │   ├── ADM-VOC-001  List vocab topics
│   │   ├── ADM-VOC-002  Tạo vocab topic
│   │   ├── ADM-VOC-004  Publish vocab topic
│   │   ├── ADM-VOC-005  Unpublish vocab topic
│   │   ├── ADM-VOC-015  Frontend vocab page
│   │   ├── ADM-GRAM-001  List grammar points
│   │   ├── ADM-GRAM-002  Tạo grammar point
│   │   ├── ADM-GRAM-004  Publish grammar point
│   │   ├── ADM-GRAM-005  Unpublish grammar point
│   │   ├── ADM-GRAM-012  Frontend grammar page
│   │   ├── ADM-CONFIG-001  List system config
│   │   ├── ADM-CONFIG-003  Update system config
│   │   └── ADM-CONFIG-004  Config admin-only
│   │
│   ├── Exam Management (15)
│   │   ├── ADM-EXAM-001  List exams
│   │   ├── ADM-EXAM-002  Tạo exam
│   │   ├── ADM-EXAM-003  Sửa exam
│   │   ├── ADM-EXAM-004  Publish exam
│   │   ├── ADM-EXAM-005  Unpublish exam
│   │   ├── ADM-EXAM-007  Import exam
│   │   ├── ADM-EXAM-008  Frontend exam list
│   │   ├── ADM-EXAM-VER-001  List versions
│   │   ├── ADM-EXAM-VER-003  Activate version
│   │   ├── ADM-EXAM-VER-005  Frontend version selector
│   │   ├── ADM-EXAM-CON-001  Tạo Listening content
│   │   ├── ADM-EXAM-CON-003  Tạo Reading content
│   │   ├── ADM-EXAM-CON-004  Tạo Writing task
│   │   ├── ADM-EXAM-CON-005  Tạo Speaking part
│   │   └── ADM-EXAM-CON-006  Frontend content editor
│   │
│   ├── Practice Content (8)
│   │   ├── ADM-PRAC-LIS-002  Tạo listening exercise
│   │   ├── ADM-PRAC-LIS-005  Frontend listening editor
│   │   ├── ADM-PRAC-REA-002  Tạo reading exercise
│   │   ├── ADM-PRAC-REA-004  Frontend reading editor
│   │   ├── ADM-PRAC-WRI-002  Tạo writing prompt
│   │   ├── ADM-PRAC-WRI-004  Frontend writing editor
│   │   ├── ADM-PRAC-SPK-004  Tạo speaking VSTEP task
│   │   └── ADM-PRAC-SPK-008  Frontend scenario editor
│   │
│   └── Users, Courses, Promo, Top-up (16)
│       ├── ADM-USR-001  List users
│       ├── ADM-USR-002  Tạo user
│       ├── ADM-USR-004  Deactivate user
│       ├── ADM-USR-010  Role: admin-only
│       ├── ADM-USR-011  Frontend user page
│       ├── ADM-CRS-002  Tạo course
│       ├── ADM-CRS-004  Publish/unpublish course
│       ├── ADM-CRS-006  Manage enrollments
│       ├── ADM-CRS-008  Manage bookings + refund
│       ├── ADM-CRS-009  Frontend course tabs
│       ├── ADM-PROMO-001  List promo codes
│       ├── ADM-PROMO-002  Tạo promo code
│       ├── ADM-PROMO-005  Frontend promo page
│       ├── ADM-TOPUP-001  List top-up packages
│       ├── ADM-TOPUP-002  Tạo top-up package
│       └── ADM-TOPUP-005  Frontend top-up page
│
├── 11. Teacher (7 cases)
│   ├── TCH-DASH-001  Dashboard giáo viên
│   ├── TCH-DASH-002  Không vào admin-only
│   ├── TCH-SCH-001  List lịch dạy
│   ├── TCH-SCH-002  Frontend calendar
│   ├── TCH-BK-001  List bookings
│   ├── TCH-LEAVE-002  Tạo đơn nghỉ
│   └── TCH-LEAVE-003  Staff duyệt đơn
│
├── 12. Backend Grading & AI (10 cases)
│   ├── GRD-WF-003  Writing result lookup
│   ├── GRD-WF-004  Speaking result lookup
│   ├── GRD-WF-005  SSE stream
│   ├── GRD-WF-006  FeedbackCompleted event
│   ├── GRD-WRI-001  Writing scoring formula
│   ├── GRD-WRI-005  Writing validation VSTEP
│   ├── GRD-SPK-001  Speaking scoring formula
│   ├── GRD-SPK-002  Conversation turn handling
│   ├── GRD-AI-001  LLM request/response
│   └── GRD-AI-005  Pipeline end-to-end
│
├── 13. System Integration (10 cases)
│   ├── SYS-AUTH-001  Learner không vào admin
│   ├── SYS-AUTH-003  Staff không vào admin-only
│   ├── SYS-AUTH-004  Teacher truy cập teacher API
│   ├── SYS-AUTH-006  API từ chối no token
│   ├── SYS-INT-001  Nộp bài → streak
│   ├── SYS-INT-002  Chấm xong → notification
│   ├── SYS-INT-003  Nạp xu → notification + UI
│   ├── SYS-HLTH-001  Health endpoint
│   ├── SYS-HLTH-002  Config endpoint
│   └── SYS-PAY-001  Payment callback public
│
└── 14. Non-functional (12 cases)
    ├── Security
    │   ├── NFT-SEC-001  Token hết hạn bị reject
    │   ├── NFT-SEC-003  Learner không vào admin
    │   ├── NFT-SEC-005  Không đọc profile người khác
    │   ├── NFT-SEC-007  Password không lộ
    │   └── NFT-SEC-011  XSS prevention
    │
    ├── Performance
    │   ├── NFT-PERF-001  AI grading < 3 giây
    │   └── NFT-PERF-002  API common < 2 giây
    │
    ├── Compatibility & Usability
    │   ├── NFT-COMP-001  Chrome compatibility
    │   ├── NFT-USE-003  Exit exam confirmation
    │   └── NFT-USE-005  Empty states
    │
    └── Reliability
        ├── NFT-REL-001  Data consistency
        └── NFT-REL-002  Draft khôi phục sau crash
```
