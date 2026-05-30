# Report 5 — LỌC TESTCASE THỰC SỰ CẦN CHO ĐỒ ÁN

## Tiêu chí lọc

Report 5 là **báo cáo kiểm thử phần mềm cho đồ án capstone** — không phải full QA enterprise.  
Cần tập trung vào:

1. **Flow chính người dùng thấy được** — login, làm bài thi, xem kết quả, nạp xu
2. **Business logic cốt lõi** — chấm điểm AI, trừ xu, tính streak
3. **Bảo mật / phân quyền** — learner không vào admin
4. **Phi chức năng quan trọng** — AI < 3 giây, data consistency
5. **Admin CRUD chính** — quản lý đề thi, user, khóa học

Cắt những gì?
- Seeder / infrastructure (không phải user-facing test)
- Mobile trùng hoàn toàn với web
- CRUD quá chi tiết (field validation riêng lẻ)
- Analytics endpoints (chỉ trả data, không có logic test)
- Audio/presign (hạ tầng)
- Từng grammar child entity riêng (structures, examples...)
- Notification CRUD riêng lẻ
- Payment callback nội bộ

---

## TỔNG: 484 → 212 case (~56% cắt)

| Module | Trước | Sau | Cắt |
|---|---|---|---|
| Auth & Profile | 42 | 24 | -18 |
| Vocab & Grammar | 26 | 12 | -14 |
| Practice Listening/Reading | 21 | 12 | -9 |
| Practice Writing | 18 | 10 | -8 |
| Practice Speaking | 27 | 14 | -13 |
| Exam Room | 47 | 30 | -17 |
| Wallet & Top-up | 26 | 16 | -10 |
| Dashboard & Progress | 23 | 12 | -11 |
| Course & Booking & Notif | 24 | 10 | -14 |
| Admin Dashboard | 18 | 6 | -12 |
| Admin Vocab/Grammar/Settings | 34 | 17 | -17 |
| Admin Exam & Practice Content | 41 | 22 | -19 |
| Admin Users/Courses/Promo | 35 | 15 | -20 |
| Teacher | 19 | 7 | -12 |
| Backend Grading & AI | 20 | 12 | -8 |
| System Integration | 31 | 12 | -19 |
| Non-functional | 32 | 14 | -18 |

---

## Danh sách GIỮ (212 case)

### 1. Auth & Profile (24 case) — Cắt 18

**GIỮ:** Đây là entry point, bắt buộc. Giữ happy path + error + role enforcement.

| ID | Lý do giữ |
|---|---|
| AUTH-REG-001 | Đăng ký học viên là flow cơ bản nhất |
| AUTH-REG-002 | Bảo vệ trùng email |
| AUTH-LOGIN-001 | Đăng nhập đúng — core |
| AUTH-LOGIN-002 | Admin login trả profile null — phân biệt role |
| AUTH-LOGIN-003 | Sai mật khẩu — security |
| AUTH-LOGIN-005 | Overlay login frontend — UI test |
| AUTH-LOGIN-006 | Redirect sau login — flow chính |
| AUTH-LOGIN-008 | Từ chối non-learner — security cốt lõi |
| AUTH-GOOGLE-001 | Google login học viên có profile |
| AUTH-GOOGLE-003 | Google conflict — edge case quan trọng |
| AUTH-SESS-001 | Refresh token — session management |
| AUTH-SESS-002 | Refresh hết hạn — security |
| AUTH-SESS-003 | Logout — session management |
| AUTH-SESS-004 | API từ chối thiếu token — security |
| AUTH-SESS-007 | Redirect user chưa auth — flow cơ bản |
| PROF-001 | Liệt kê profile |
| PROF-002 | Tạo profile mới |
| PROF-003 | Switch profile — ảnh hưởng toàn bộ API context |
| PROF-004 | Cập nhật profile frontend |
| PROF-006 | Không truy cập profile người khác — security |
| PROF-008 | Hoàn thành onboarding + tặng xu — business logic |
| PROF-009 | Đổi mật khẩu |
| PROF-010 | Upload avatar |

**CẮT:** Mobile login/register riêng (AUTH-REG-007/008, AUTH-LOGIN-009), frontend error display riêng (AUTH-LOGIN-010), Google button fallback (AUTH-GOOGLE-004/005/006), session restore mobile (AUTH-SESS-006/008), API update profile (PROF-005), reset profile (PROF-007), email availability frontend (AUTH-REG-004), onboarding step validation frontend (AUTH-REG-005/006), login redirect param (AUTH-LOGIN-007), API rejected expired token (AUTH-SESS-005).

---

### 2. Vocab & Grammar (12 case) — Cắt 14

**GIỮ:** Giữ flow chính, cắt chi tiết từng loại bài tập.

| ID | Lý do giữ |
|---|---|
| VOC-001 | Liệt kê topic |
| VOC-002 | Xem chi tiết topic |
| VOC-EX-004 | Flow làm bài tập frontend (gộp cả MCQ + fill-blank) |
| VOC-SRS-001 | SRS queue — core logic |
| VOC-SRS-002 | SRS review cập nhật lịch — core logic |
| VOC-SRS-004 | Frontend SRS flow |
| GRAM-001 | Liệt kê điểm ngữ pháp |
| GRAM-002 | Xem chi tiết điểm |
| GRAM-EX-002 | Flow làm bài tập ngữ pháp frontend |
| GRAM-EX-004 | Làm lại bài tập |
| VOC-SRS-006 | FSRS scheduler tính đúng — core algorithm |

**CẮT:** VOC-EX-001/002/003 (từng loại bài tập riêng), VOC-SRS-003 (queue rỗng), Mobile vocab/grammar/FSRS (VOC-004, VOC-EX-005, VOC-SRS-005, GRAM-004, GRAM-EX-003), CURR-001/002/003 (seeder), GRAM-003 (frontend detail).

---

### 3. Practice Listening/Reading (12 case) — Cắt 9

**GIỮ:** Giữ flow chính + kết quả.

| ID | Lý do giữ |
|---|---|
| PRAC-LIS-001/002 | List + detail bài nghe |
| PRAC-LIS-004 | Trả lời bài nghe — core |
| PRAC-LIS-006 | Frontend list với filter |
| PRAC-LIS-007 | Frontend kết quả |
| PRAC-REA-001/002 | List + detail bài đọc |
| PRAC-REA-004 | Trả lời bài đọc — core |
| PRAC-REA-005 | Frontend bài đọc với passage |
| PRAC-REA-007 | Frontend kết quả |
| PRAC-SKILLS-001 | Trang kỹ năng hiển thị đủ |

**CẮT:** Audio playback (PRAC-LIS-008), progress endpoint (PRAC-LIS-005, PRAC-REA-003), start session (PRAC-LIS-003), navigation (PRAC-REA-006), mobile (PRAC-LIS-009/010, PRAC-REA-008), empty state (PRAC-SKILLS-002/003).

---

### 4. Practice Writing (10 case) — Cắt 8

**GIỮ:** Writing submit + AI feedback là core.

| ID | Lý do giữ |
|---|---|
| WRI-001 | List prompts |
| WRI-004 | Gửi bài viết, trigger AI — CỰC QUAN TRỌNG |
| WRI-005 | Từ chối dưới min_words |
| WRI-007 | Generate AI feedback |
| WRI-008 | SSE stream feedback |
| WRI-010 | Editor đếm từ |
| WRI-011 | Màn hình chấm pending→scoring→feedback |
| WRI-012 | Hiển thị Strengths/Improvements/Rewrites |

**CẮT:** Detail prompt (WRI-002), start session (WRI-003), history (WRI-006), frontend list (WRI-009), mobile (WRI-013/014), review popup (WRI-015), feedback CRUD (WRI-FB-001/002/003).

---

### 5. Practice Speaking (14 case) — Cắt 13

**GIỮ:** Giữ đại diện speaking drill + VSTEP + conversation.

| ID | Lý do giữ |
|---|---|
| SPK-DRL-004 | Gửi bài phát âm — core drill |
| SPK-VST-004 | Gửi bài nói VSTEP — core |
| SPK-CONV-003 | Bắt đầu hội thoại |
| SPK-CONV-004 | Gửi lượt hội thoại |
| SPK-CONV-006 | Review hội thoại |
| SPK-SHA-003 | Frontend shadowing |
| SPK-DRL-006 | Frontend danh sách drill |
| SPK-VST-006 | Frontend bài nói VSTEP |
| SPK-CONV-008 | Frontend flow hội thoại |

**CẮT:** Mobile (SPK-DRL-007, SPK-CONV-009, SPK-SHA-004), list/detail riêng (SPK-DRL-001/002, SPK-VST-001/002, SPK-CONV-001/002), start session riêng (SPK-DRL-003, SPK-VST-003), history (SPK-DRL-005, SPK-VST-005, SPK-CONV-007), rate limit (SPK-CONV-010), shadowing progress API (SPK-SHA-001/002).

---

### 6. Exam Room (30 case) — Cắt 17

**GIỮ:** Phòng thi là core nhất. Giữ gần hết.

| ID | Lý do giữ |
|---|---|
| EXAM-LIB-001 | List đề + status |
| EXAM-LIB-003 | Lọc status |
| EXAM-DET-001 | Detail exam |
| EXAM-DET-002 | Skill selector |
| EXAM-DET-003 | Giá full test |
| EXAM-START-001 | Start full test trừ xu |
| EXAM-START-002 | Start custom trừ xu |
| EXAM-START-003 | Từ chối thiếu xu |
| EXAM-START-004 | Mở top-up dialog |
| EXAM-START-005 | Continue phiên active |
| EXAM-DC-001 | Device check |
| EXAM-DRAFT-001 | Lưu draft |
| EXAM-DRAFT-003 | Frontend autosave |
| EXAM-DRAFT-004 | Resume từ draft |
| EXAM-PANEL-001 | Listening readiness modal |
| EXAM-PANEL-004 | Reading panel |
| EXAM-PANEL-006 | Writing editor |
| EXAM-PANEL-008 | Speaking recording |
| EXAM-PANEL-009 | Speaking mic denied |
| EXAM-TRANS-001 | Dialog chuyển skill |
| EXAM-TRANS-002 | Khóa skill trước |
| EXAM-SUBMIT-001 | Nộp bài thủ công |
| EXAM-SUBMIT-002 | Auto-submit hết giờ |
| EXAM-SUBMIT-003 | Tính điểm MCQ |
| EXAM-RESULT-001 | Result summary |
| EXAM-RESULT-002 | Writing feedback sau graded |
| EXAM-RESULT-004 | Poll 5s khi pending |
| EXAM-RESULT-005 | Result detail |

**CẮT:** Mobile (EXAM-LIB-005, EXAM-DET-005, EXAM-START-007, EXAM-PANEL-010, EXAM-RESULT-006), search (EXAM-LIB-002), empty state (EXAM-LIB-004), custom cost (EXAM-DET-004), reset session (EXAM-START-006), device check skip (EXAM-DC-002), draft get API (EXAM-DRAFT-002), draft expired (EXAM-DRAFT-005), listening audio/played-log (EXAM-PANEL-002/003), reading highlight (EXAM-PANEL-005), writing task switch (EXAM-PANEL-007), transition cancel (EXAM-TRANS-003), reject re-submit (EXAM-SUBMIT-004), speaking result (EXAM-RESULT-003), speaking feedback (EXAM-RESULT-003 redundant).

---

### 7. Wallet & Top-up (16 case) — Cắt 10

| ID | Lý do giữ |
|---|---|
| WALL-BAL-001 | Balance — core |
| WALL-BAL-003 | Header hiển thị xu |
| WALL-TOP-001 | Chỉ active packages |
| WALL-TOP-002 | Frontend dialog |
| WALL-PAY-001 | Tạo đơn nạp |
| WALL-PAY-002 | Confirm nạp cộng xu |
| WALL-PAY-004 | Redirect payment URL |
| WALL-PROMO-001 | Đổi mã hợp lệ |
| WALL-PROMO-002 | Từ chối mã sai |
| WALL-PROMO-005 | Frontend card đổi mã |
| WALL-PROMO-006 | Frontend lỗi mã |

**CẮT:** Transactions (WALL-BAL-002), mobile (WALL-BAL-004), package metadata (WALL-TOP-003), dialog empty (WALL-TOP-004), idempotent (WALL-PAY-003), no payment_url handler (WALL-PAY-005), profile ownership (WALL-PAY-006), mobile top-up (WALL-PAY-007), callback (WALL-CB-001/002), promo expired/used (WALL-PROMO-003/004), normalize code (WALL-PROMO-007), animation (WALL-PROMO-008), mobile promo (WALL-PROMO-009).

---

### 8. Dashboard & Progress (12 case) — Cắt 11

| ID | Lý do giữ |
|---|---|
| DASH-OV-001 | Overview data |
| DASH-OV-003 | Frontend dashboard |
| DASH-PROG-002 | Ẩn spider chart < 5 bài |
| DASH-PROG-003 | Hiện spider chart ≥ 5 bài |
| DASH-STK-001 | Streak state |
| DASH-STK-002 | Streak tăng sau full-test |
| DASH-STK-003 | Nhận milestone reward |
| DASH-STK-005 | Frontend streak dialog |
| DASH-LP-001 | Learning path recommendation |
| DASH-LP-004 | Frontend recommendation section |

**CẮT:** Overview empty (DASH-OV-002), mobile (DASH-OV-004, DASH-PROG-004, DASH-STK-006, DASH-LP-005), practice summary (DASH-PROG-001), streak already-claimed (DASH-STK-004), learning path empty (DASH-LP-003), heatmap (DASH-HEAT-001/002), study reminder (DASH-REM-001/002).

---

### 9. Course & Booking (10 case) — Cắt 14

| ID | Lý do giữ |
|---|---|
| COURSE-EN-001 | List courses |
| COURSE-EN-003 | Create enrollment order |
| COURSE-EN-005 | Frontend enroll flow |
| COURSE-BK-002 | Book slot |
| COURSE-BK-003 | Trừ xu khi book |
| COURSE-BK-004 | Max bookings limit |
| COURSE-BK-010 | Commitment gate |
| NOTIF-001 | List notifications |
| NOTIF-007 | Frontend bell |

**CẮT:** Course detail (COURSE-EN-002), confirm enrollment (COURSE-EN-004), mobile enroll (COURSE-EN-006), booking list (COURSE-BK-001), lead time (COURSE-BK-005), frontend booking page/slot grid/confirm (COURSE-BK-006/007/008), mobile booking (COURSE-BK-009), notification CRUD (NOTIF-002/003/004/005/006/008).

---

### 10. Admin (60 case) — Cắt 68

| GIỮ 60 case chính |

**Dashboard (6):** ADM-DASH-001, ADM-DASH-002, ADM-DASH-005 (role enforcement), ADM-DASH-007 (frontend).

**Vocab/Grammar/Settings (17):** ADM-VOC-001/002/004/005/015 (CRUD + publish + frontend), ADM-GRAM-001/002/004/005/012 (CRUD + publish + frontend), ADM-CONFIG-001/003/004 (config security + update).

**Exam Management (22):** ADM-EXAM-001/002/003/004/005/007/008 (CRUD + import), ADM-EXAM-VER-001/003/005 (version + activate), ADM-EXAM-CON-001/003/004/005/006 (create content for each skill + frontend editor), ADM-PRAC-LIS-002/005, ADM-PRAC-REA-002/004, ADM-PRAC-WRI-002/004, ADM-PRAC-SPK-002/004/008 (admin tạo practice content per skill).

**Users/Courses/Promo (15):** ADM-USR-001/002/004/010/011 (CRUD + deactivate + role security), ADM-CRS-002/004/006/008/009 (course CRUD + enroll + booking manage), ADM-PROMO-001/002/005 (promo CRUD), ADM-TOPUP-001/002/005 (topup package).

---

### 11. Teacher (7 case) — Cắt 12

| ID | Lý do giữ |
|---|---|
| TCH-DASH-001 | Dashboard |
| TCH-DASH-002 | Không vào admin-only |
| TCH-SCH-001 | Schedule list |
| TCH-SCH-002 | Frontend calendar |
| TCH-BK-001 | Bookings list |
| TCH-LEAVE-002 | Tạo đơn nghỉ |
| TCH-LEAVE-003 | Staff duyệt đơn |

---

### 12. Backend Grading & AI (12 case) — Cắt 8

| ID | Lý do giữ |
|---|---|
| GRD-WF-003 | Writing result lookup |
| GRD-WF-004 | Speaking result lookup |
| GRD-WF-005 | SSE stream |
| GRD-WF-006 | FeedbackCompleted event |
| GRD-WRI-001 | Writing scoring formula |
| GRD-WRI-005 | Writing validation |
| GRD-SPK-001 | Speaking scoring formula |
| GRD-SPK-002 | Conversation turn handling |
| GRD-AI-001 | LLM grading request/response |
| GRD-AI-005 | Pipeline end-to-end |

---

### 13. System Integration (12 case) — Cắt 19

| ID | Lý do giữ |
|---|---|
| SYS-AUTH-001 | Learner không vào admin |
| SYS-AUTH-003 | Staff không vào admin-only |
| SYS-AUTH-004 | Teacher truy cập teacher |
| SYS-AUTH-006 | API từ chối no token |
| SYS-INT-001 | Nộp bài → update streak |
| SYS-INT-002 | Chấm xong → notification |
| SYS-INT-003 | Nạp xu → notification + UI |
| SYS-HLTH-001 | Health endpoint |
| SYS-HLTH-002 | Config endpoint |
| SYS-PAY-001 | Payment callback public |

---

### 14. Non-functional (14 case) — Cắt 18

| ID | Lý do giữ |
|---|---|
| NFT-SEC-001 | Token hết hạn bị reject |
| NFT-SEC-003 | Learner không vào admin |
| NFT-SEC-005 | Không đọc profile người khác |
| NFT-SEC-007 | Password không lộ |
| NFT-SEC-011 | XSS prevention |
| NFT-PERF-001 | AI < 3 giây |
| NFT-PERF-002 | API common < 2 giây |
| NFT-COMP-001 | Chrome compatibility |
| NFT-USE-003 | Exit exam confirmation |
| NFT-USE-005 | Empty states |
| NFT-REL-001 | Data consistency sau submit |
| NFT-REL-002 | Draft khôi phục sau crash |

---

## TỔNG KẾT SAU LỌC

| Module | Trước | Sau |
|---|---|---|
| Auth & Profile | 42 | 24 |
| Vocab & Grammar | 26 | 12 |
| Practice Listening/Reading | 21 | 12 |
| Practice Writing | 18 | 10 |
| Practice Speaking | 27 | 14 |
| Exam Room | 47 | 30 |
| Wallet & Top-up | 26 | 16 |
| Dashboard & Progress | 23 | 12 |
| Course & Booking & Notif | 24 | 10 |
| Admin Dashboard | 18 | 6 |
| Admin Vocab/Grammar/Settings | 34 | 17 |
| Admin Exam & Practice | 41 | 22 |
| Admin Users/Courses/Promo | 35 | 15 |
| Teacher | 19 | 7 |
| Backend Grading & AI | 20 | 12 |
| System Integration | 31 | 12 |
| Non-functional | 32 | 14 |
| **TỔNG** | **484** | **235** |

**Cắt 249 case (~51%). Giữ 235 case.**

Lý do chính: cắt mobile duplicate, CRUD quá chi tiết, infrastructure/seeder, analytics chỉ-trả-data.
Giữ lại mọi case liên quan đến security, business logic, flow người dùng chính, AI grading.
