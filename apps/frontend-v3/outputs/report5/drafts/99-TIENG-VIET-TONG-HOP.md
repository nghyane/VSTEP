# TỔNG HỢP TOÀN BỘ TEST CASE SAU LỌC — REPORT 5 VSTEP

**215 test case · 5 role · đã cắt 269 case không thực sự cần**

---

## 1. Auth & Profile (23 case)

| ID | Mô tả | Mức |
|---|---|---|
| AUTH-REG-001 | Đăng ký học viên email/password/onboarding hợp lệ | Cực cao |
| AUTH-REG-002 | Đăng ký thất bại nếu email đã tồn tại | Cực cao |
| AUTH-LOGIN-001 | Học viên đăng nhập đúng credentials | Cực cao |
| AUTH-LOGIN-002 | Admin đăng nhập trả về profile: null | Cao |
| AUTH-LOGIN-003 | Từ chối sai mật khẩu | Cực cao |
| AUTH-LOGIN-005 | Frontend mở overlay login bằng search param | Cao |
| AUTH-LOGIN-006 | Frontend chuyển hướng đến dashboard sau login | Cực cao |
| AUTH-LOGIN-008 | Frontend từ chối tài khoản không phải learner | Cực cao |
| AUTH-GOOGLE-001 | Google login học viên đã có profile | Cao |
| AUTH-GOOGLE-003 | Google login xung đột email đã đăng ký | Cao |
| AUTH-SESS-001 | Refresh token trả access token mới | Cực cao |
| AUTH-SESS-002 | Refresh token hết hạn xóa session | Cao |
| AUTH-SESS-003 | Logout vô hiệu hóa token | Cao |
| AUTH-SESS-004 | API bảo vệ từ chối request thiếu token | Cực cao |
| AUTH-SESS-007 | Frontend redirect user chưa auth về login | Cực cao |
| PROF-001 | Liệt kê profile của tài khoản | Cao |
| PROF-002 | Tạo profile học tập mới | Cao |
| PROF-003 | Chuyển đổi profile đang active | Cực cao |
| PROF-004 | Cập nhật profile qua frontend | Cao |
| PROF-006 | Không thể truy cập profile của tài khoản khác | Cực cao |
| PROF-008 | Hoàn thành onboarding + tặng xu (100 xu) | Cực cao |
| PROF-009 | Đổi mật khẩu | Vừa |
| PROF-010 | Upload avatar | Vừa |

---

## 2. Vocab & Grammar (11 case)

| ID | Mô tả | Mức |
|---|---|---|
| VOC-001 | Liệt kê topic từ vựng | Cao |
| VOC-002 | Xem chi tiết topic từ vựng | Cao |
| VOC-EX-004 | Frontend flow làm bài tập (MCQ + fill-blank) | Cao |
| VOC-SRS-001 | SRS trả về thẻ đến hạn ôn tập | Cao |
| VOC-SRS-002 | SRS cập nhật lịch ôn khi đánh giá | Cao |
| VOC-SRS-004 | Frontend flow ôn tập SRS | Cao |
| VOC-SRS-006 | FSRS scheduler tính đúng khoảng thời gian | Cao |
| GRAM-001 | Liệt kê điểm ngữ pháp | Cao |
| GRAM-002 | Xem chi tiết điểm ngữ pháp | Cao |
| GRAM-EX-002 | Frontend flow làm bài tập ngữ pháp | Cao |
| GRAM-EX-004 | Làm lại bài tập ngữ pháp | Vừa |

---

## 3. Practice Listening/Reading (11 case)

| ID | Mô tả | Mức |
|---|---|---|
| PRAC-LIS-001 | Liệt kê bài tập nghe | Cao |
| PRAC-LIS-002 | Xem chi tiết bài nghe (audio, transcript, câu hỏi) | Cao |
| PRAC-LIS-004 | Trả lời bài nghe, kiểm tra đúng/sai | Cực cao |
| PRAC-LIS-006 | Frontend danh sách bài nghe với lọc level | Cao |
| PRAC-LIS-007 | Frontend hiển thị kết quả sau khi trả lời | Cực cao |
| PRAC-REA-001 | Liệt kê bài tập đọc | Cao |
| PRAC-REA-002 | Xem chi tiết bài đọc (passage + câu hỏi) | Cao |
| PRAC-REA-004 | Trả lời bài đọc, kiểm tra đúng/sai | Cực cao |
| PRAC-REA-005 | Frontend hiển thị bài đọc với passage | Cao |
| PRAC-REA-007 | Frontend hiển thị kết quả sau khi trả lời | Cao |
| PRAC-SKILLS-001 | Trang kỹ năng hiển thị đủ 4 kỹ năng + vocab/grammar | Cao |

---

## 4. Practice Writing (8 case)

| ID | Mô tả | Mức |
|---|---|---|
| WRI-001 | Liệt kê đề viết | Cao |
| WRI-004 | Gửi bài viết, kích hoạt chấm AI | Cực cao |
| WRI-005 | Từ chối bài viết dưới min_words | Cao |
| WRI-007 | Tạo feedback AI cho bài viết | Cực cao |
| WRI-008 | SSE stream nhận feedback đầy đủ | Cực cao |
| WRI-010 | Frontend editor với đếm từ, thanh tiến độ | Cao |
| WRI-011 | Frontend màn hình chấm (pending → scoring → feedback) | Cực cao |
| WRI-012 | Frontend hiển thị Strengths/Improvements/Rewrites | Cao |

---

## 5. Practice Speaking (9 case)

| ID | Mô tả | Mức |
|---|---|---|
| SPK-DRL-004 | Gửi bài phát âm với audio, nhận phản hồi | Cực cao |
| SPK-DRL-006 | Frontend danh sách bài phát âm với filter | Cao |
| SPK-VST-004 | Gửi bài nói VSTEP, kích hoạt chấm điểm | Cực cao |
| SPK-VST-006 | Frontend luyện nói VSTEP (ghi âm từng part) | Cao |
| SPK-CONV-003 | Bắt đầu phiên hội thoại AI | Cực cao |
| SPK-CONV-004 | Gửi lượt hội thoại (audio + text) | Cực cao |
| SPK-CONV-006 | Xem review hội thoại (nội dung, phát âm, feedback) | Cao |
| SPK-CONV-008 | Frontend flow hội thoại AI | Cao |
| SPK-SHA-003 | Frontend shadowing session (nghe, ghi âm, so sánh) | Cao |

---

## 6. Exam Room (28 case)

| ID | Mô tả | Mức |
|---|---|---|
| EXAM-LIB-001 | Tải danh sách đề thi với trạng thái | Cực cao |
| EXAM-LIB-003 | Lọc đề theo trạng thái | Cao |
| EXAM-DET-001 | Xem chi tiết đề thi (section, lịch sử) | Cao |
| EXAM-DET-002 | Chọn kỹ năng, mở rộng thông tin part | Cao |
| EXAM-DET-003 | Hiển thị giá full test | Cao |
| EXAM-START-001 | Bắt đầu full test trừ 25 xu | Cực cao |
| EXAM-START-002 | Bắt đầu custom test trừ 8 xu/kỹ năng | Cực cao |
| EXAM-START-003 | Từ chối khi không đủ xu | Cực cao |
| EXAM-START-004 | Frontend mở dialog nạp xu khi thiếu | Cao |
| EXAM-START-005 | Tiếp tục phiên thi còn active | Cao |
| EXAM-DC-001 | Màn hình device check (audio, mic, cấu trúc đề) | Cao |
| EXAM-DRAFT-001 | Lưu draft bài thi | Cực cao |
| EXAM-DRAFT-003 | Frontend autosave debounce 5s | Cực cao |
| EXAM-DRAFT-004 | Resume từ draft bỏ qua device check | Cực cao |
| EXAM-PANEL-001 | Listening readiness modal | Cao |
| EXAM-PANEL-004 | Reading panel chia passage/câu hỏi | Cao |
| EXAM-PANEL-006 | Writing editor đếm từ, thanh tiến độ | Cao |
| EXAM-PANEL-008 | Speaking panel ghi âm, dừng, nghe lại | Cao |
| EXAM-PANEL-009 | Speaking từ chối khi bị chặn microphone | Cao |
| EXAM-TRANS-001 | Dialog xác nhận chuyển skill, đếm câu chưa trả lời | Cao |
| EXAM-TRANS-002 | Chuyển skill khóa skill trước | Cao |
| EXAM-SUBMIT-001 | Nộp bài thủ công, invalidate cache | Cực cao |
| EXAM-SUBMIT-002 | Auto-submit khi hết giờ | Cực cao |
| EXAM-SUBMIT-003 | Tính điểm MCQ chính xác | Cực cao |
| EXAM-RESULT-001 | Màn hình kết quả tóm tắt (score circle, pending AI) | Cực cao |
| EXAM-RESULT-002 | Hiển thị writing feedback sau khi graded | Cao |
| EXAM-RESULT-004 | Poll kết quả mỗi 5s khi AI chưa chấm xong | Cao |
| EXAM-RESULT-005 | Trang chi tiết kết quả (MCQ grid, feedback) | Cao |

---

## 7. Wallet & Top-up & Promo (11 case)

| ID | Mô tả | Mức |
|---|---|---|
| WALL-BAL-001 | Lấy số dư ví | Cực cao |
| WALL-BAL-003 | Frontend header hiển thị số dư xu | Cao |
| WALL-TOP-001 | Chỉ liệt kê gói nạp đang active | Cao |
| WALL-TOP-002 | Frontend dialog nạp xu hiển thị gói | Cao |
| WALL-PAY-001 | Tạo đơn nạp xu | Cực cao |
| WALL-PAY-002 | Xác nhận nạp xu cộng xu vào ví | Cực cao |
| WALL-PAY-004 | Frontend chuyển hướng đến URL thanh toán | Cực cao |
| WALL-PROMO-001 | Đổi mã giảm giá hợp lệ | Cực cao |
| WALL-PROMO-002 | Từ chối mã không tồn tại | Cao |
| WALL-PROMO-005 | Frontend card đổi mã (profile page) | Cao |
| WALL-PROMO-006 | Frontend hiển thị lỗi khi mã sai | Cao |

---

## 8. Dashboard & Progress (10 case)

| ID | Mô tả | Mức |
|---|---|---|
| DASH-OV-001 | Overview trả về profile/skill/streak/progress | Cực cao |
| DASH-OV-003 | Frontend dashboard hiển thị các card | Cao |
| DASH-PROG-002 | Ẩn spider chart khi dưới 5 bài full test | Cao |
| DASH-PROG-003 | Hiển thị spider chart khi đủ 5+ bài | Cao |
| DASH-STK-001 | Streak endpoint trả về trạng thái | Cao |
| DASH-STK-002 | Streak tăng sau khi nộp full-test | Cực cao |
| DASH-STK-003 | Nhận thưởng streak milestone | Cao |
| DASH-STK-005 | Frontend dialog streak (rương, tiến độ) | Cao |
| DASH-LP-001 | Learning path gợi ý kỹ năng yếu | Cực cao |
| DASH-LP-004 | Frontend recommendation section | Cao |

---

## 9. Course & Booking (9 case)

| ID | Mô tả | Mức |
|---|---|---|
| COURSE-EN-001 | Liệt kê khóa học | Cao |
| COURSE-EN-003 | Tạo đơn ghi danh khóa học | Cực cao |
| COURSE-EN-005 | Frontend flow ghi danh khóa học | Cao |
| COURSE-BK-002 | Đặt slot 1-1 | Cực cao |
| COURSE-BK-003 | Trừ xu khi đặt slot | Cực cao |
| COURSE-BK-004 | Không đặt vượt quá max_bookings | Cao |
| COURSE-BK-010 | Commitment gate chặn đặt lịch khi chưa đủ | Cao |
| NOTIF-001 | Liệt kê thông báo | Cao |
| NOTIF-007 | Frontend chuông thông báo | Cao |

---

## 10. Admin (56 case)

### Dashboard & Analytics

| ID | Mô tả | Mức |
|---|---|---|
| ADM-DASH-001 | Dashboard trả về thống kê tổng (users, exams, vocab, grammar) | Cao |
| ADM-DASH-002 | Alerts phát hiện grading job thất bại | Cao |
| ADM-DASH-005 | Dashboard yêu cầu role staff (learner bị 403) | Cực cao |
| ADM-DASH-007 | Frontend dashboard admin hiển thị đầy đủ card + chart | Cực cao |

### Vocab, Grammar, Settings

| ID | Mô tả | Mức |
|---|---|---|
| ADM-VOC-001 | Liệt kê topic từ vựng admin | Cao |
| ADM-VOC-002 | Tạo topic từ vựng | Cao |
| ADM-VOC-004 | Publish topic (hiển thị cho học viên) | Cực cao |
| ADM-VOC-005 | Unpublish topic | Cao |
| ADM-VOC-015 | Frontend admin trang từ vựng (list, form, tabs) | Cao |
| ADM-GRAM-001 | Liệt kê điểm ngữ pháp admin | Cao |
| ADM-GRAM-002 | Tạo điểm ngữ pháp | Cao |
| ADM-GRAM-004 | Publish điểm ngữ pháp | Cực cao |
| ADM-GRAM-005 | Unpublish điểm ngữ pháp | Cao |
| ADM-GRAM-012 | Frontend admin trang ngữ pháp (structures, examples, mistakes, tips, exercises) | Cao |
| ADM-CONFIG-001 | Liệt kê system config | Cao |
| ADM-CONFIG-003 | Cập nhật system config | Cao |
| ADM-CONFIG-004 | System config chỉ admin được truy cập (staff bị 403) | Cực cao |

### Exam Management

| ID | Mô tả | Mức |
|---|---|---|
| ADM-EXAM-001 | Liệt kê đề thi admin (draft/published) | Cao |
| ADM-EXAM-002 | Tạo đề thi mới | Cao |
| ADM-EXAM-003 | Sửa đề thi | Cao |
| ADM-EXAM-004 | Publish đề thi (hiển thị cho học viên) | Cực cao |
| ADM-EXAM-005 | Unpublish đề thi | Cao |
| ADM-EXAM-007 | Import đề thi | Cao |
| ADM-EXAM-008 | Frontend admin danh sách đề (version selector, publish action) | Cao |
| ADM-EXAM-VER-001 | Liệt kê phiên bản đề | Cao |
| ADM-EXAM-VER-003 | Kích hoạt phiên bản đề | Cực cao |
| ADM-EXAM-VER-005 | Frontend chọn phiên bản (active version highlighted) | Cao |
| ADM-EXAM-CON-001 | Tạo section + item Listening | Cao |
| ADM-EXAM-CON-003 | Tạo passage + item Reading | Cao |
| ADM-EXAM-CON-004 | Tạo task Writing (task_type, min_words, prompt) | Cao |
| ADM-EXAM-CON-005 | Tạo part Speaking (prompt, duration) | Cao |
| ADM-EXAM-CON-006 | Frontend editor nội dung đề (4 tab: Listening/Reading/Writing/Speaking) | Cao |

### Practice Content Admin

| ID | Mô tả | Mức |
|---|---|---|
| ADM-PRAC-LIS-002 | Tạo bài tập nghe (title, level, audio_url, transcript) | Cao |
| ADM-PRAC-LIS-005 | Frontend editor bài tập nghe (form + questions tab) | Cao |
| ADM-PRAC-REA-002 | Tạo bài tập đọc (title, level, passage) | Cao |
| ADM-PRAC-REA-004 | Frontend editor bài tập đọc (form + questions tab) | Cao |
| ADM-PRAC-WRI-002 | Tạo đề viết luyện tập (title, level, task_type, min_words) | Cao |
| ADM-PRAC-WRI-004 | Frontend editor đề viết (form + markers tab) | Cao |
| ADM-PRAC-SPK-004 | Tạo bài nói VSTEP (title, level, part, prompt, duration) | Cao |
| ADM-PRAC-SPK-008 | Frontend editor kịch bản hội thoại (form + publish toggle) | Cao |

### Users, Courses, Promo, Top-up

| ID | Mô tả | Mức |
|---|---|---|
| ADM-USR-001 | Liệt kê users (searchable, filterable) | Cao |
| ADM-USR-002 | Tạo user với role | Cao |
| ADM-USR-004 | Vô hiệu hóa user (không login được) | Cực cao |
| ADM-USR-010 | User management chỉ admin được truy cập (staff bị 403) | Cực cao |
| ADM-USR-011 | Frontend trang user management (table, form, role selector) | Cao |
| ADM-CRS-002 | Tạo khóa học (title, teacher, price, dates) | Cao |
| ADM-CRS-004 | Publish/unpublish khóa học | Cao |
| ADM-CRS-006 | Quản lý enrollments (thêm/xóa học viên, override commitment) | Cao |
| ADM-CRS-008 | Quản lý bookings (sửa meet_url, cancel + refund) | Cao |
| ADM-CRS-009 | Frontend chi tiết khóa học với tabs (schedule, enrollments, slots, bookings) | Cao |
| ADM-PROMO-001 | Liệt kê mã giảm giá admin | Cao |
| ADM-PROMO-002 | Tạo mã giảm giá (code, coins, valid_until, usage_limit) | Cao |
| ADM-PROMO-005 | Frontend trang mã giảm giá (list, create/edit form) | Cao |
| ADM-TOPUP-001 | Liệt kê gói nạp admin | Cao |
| ADM-TOPUP-002 | Tạo gói nạp (label, price, coins, bonus, order) | Cao |
| ADM-TOPUP-005 | Frontend trang gói nạp (list, form, activate/deactivate) | Cao

---

## 11. Teacher (7 case)

| ID | Mô tả | Mức |
|---|---|---|
| TCH-DASH-001 | Dashboard giáo viên | Cao |
| TCH-DASH-002 | Giáo viên không vào admin-only | Cực cao |
| TCH-SCH-001 | Liệt kê lịch dạy | Cao |
| TCH-SCH-002 | Frontend calendar lịch dạy | Cao |
| TCH-BK-001 | Liệt kê bookings | Cao |
| TCH-LEAVE-002 | Tạo đơn nghỉ phép | Cao |
| TCH-LEAVE-003 | Staff duyệt đơn nghỉ | Vừa |

---

## 12. Backend Grading & AI (10 case)

| ID | Mô tả | Mức |
|---|---|---|
| GRD-WF-003 | Tra cứu kết quả writing | Cực cao |
| GRD-WF-004 | Tra cứu kết quả speaking | Cực cao |
| GRD-WF-005 | SSE stream grading | Cực cao |
| GRD-WF-006 | FeedbackCompleted event | Cao |
| GRD-WRI-001 | Writing scoring formula | Cao |
| GRD-WRI-005 | Writing validation VSTEP | Cao |
| GRD-SPK-001 | Speaking scoring formula | Cao |
| GRD-SPK-002 | Conversation turn handling | Cao |
| GRD-AI-001 | LLM grading request/response | Cao |
| GRD-AI-005 | Pipeline end-to-end | Cực cao |

---

## 13. System Integration (10 case)

| ID | Mô tả | Mức |
|---|---|---|
| SYS-AUTH-001 | Learner không vào admin | Cực cao |
| SYS-AUTH-003 | Staff không vào admin-only | Cực cao |
| SYS-AUTH-004 | Teacher truy cập teacher API | Cực cao |
| SYS-AUTH-006 | API từ chối no token | Cực cao |
| SYS-INT-001 | Nộp bài → update streak | Cao |
| SYS-INT-002 | Chấm xong → notification | Cao |
| SYS-INT-003 | Nạp xu → notification + UI update | Cao |
| SYS-HLTH-001 | Health endpoint OK | Cao |
| SYS-HLTH-002 | Config endpoint | Cao |
| SYS-PAY-001 | Payment callback public | Cực cao |

---

## 14. Non-functional (12 case)

| ID | Mô tả | Mức |
|---|---|---|
| NFT-SEC-001 | Token hết hạn bị reject | Cực cao |
| NFT-SEC-003 | Learner không vào admin API | Cực cao |
| NFT-SEC-005 | Không đọc profile người khác | Cực cao |
| NFT-SEC-007 | Password không lộ trong response | Cực cao |
| NFT-SEC-011 | XSS prevention | Cao |
| NFT-PERF-001 | AI grading < 3 giây | Cực cao |
| NFT-PERF-002 | API common < 2 giây | Cao |
| NFT-COMP-001 | Chrome compatibility | Cao |
| NFT-USE-003 | Exit exam confirmation | Cao |
| NFT-USE-005 | Empty states có thông báo | Vừa |
| NFT-REL-001 | Data consistency sau submit | Cao |
| NFT-REL-002 | Draft khôi phục sau crash | Cực cao |

---

## TỔNG KẾT

| Vai trò | Số case |
|---|---|
| Guest / Auth | 23 |
| Học viên (Learner) | 97 |
| Admin | 56 |
| Giáo viên (Teacher) | 7 |
| Backend / AI / System | 20 |
| Phi chức năng | 12 |
| **TỔNG** | **215** |

Đã cắt: seeder, mobile duplicate, CRUD quá chi tiết, analytics, audio, payment callback nội bộ, Google fallback, rate limit, notification CRUD riêng lẻ.
Giữ: security, auth, exam flow, AI grading, wallet, admin CRUD chính, teacher, non-functional.
