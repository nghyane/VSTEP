# I. Biên Bản Thay Đổi

| Phiên bản | Ngày | Tác giả | Mô tả |
|-----------|------|---------|-------|
| 1.0 | 10/03/2026 | Hoàng Văn Anh Nghĩa | Phiên bản đầu tiên |
| 2.0 | 28/05/2026 | Hoàng Văn Anh Nghĩa | Cập nhật theo triển khai thực tế |

# II. Giới Thiệu Dự Án

## 1. Tổng Quan

### 1.1 Thông Tin Dự Án

| Mục | Chi tiết |
|-----|----------|
| Tên dự án (Tiếng Anh) | An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support |
| Tên dự án (Tiếng Việt) | Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa |
| Mã dự án | SP26SE145 |
| Nhóm | GSP26SE63 |
| Loại phần mềm | Ứng dụng Web + Mobile |
| Thời gian | 01/01/2026 - 30/04/2026 |
| Giảng viên hướng dẫn | Lâm Hữu Khánh Phương (phuonglhk@fe.edu.vn) |
| Giảng viên phản biện | Trần Trọng Huỳnh (huynhtt4@fe.edu.vn) |

### 1.2 Thành Viên Nhóm

| Họ và tên | Mã sinh viên | Vai trò | Email |
|-----------|-------------|---------|-------|
| Hoàng Văn Anh Nghĩa | SE172605 | Trưởng nhóm | nghiahvase172605@fpt.edu.vn |
| Nguyễn Minh Khôi | SE172625 | Phát triển | khoinmse172625@fpt.edu.vn |
| Nguyễn Nhật Phát | SE172607 | Phát triển | phatnnse172607@fpt.edu.vn |
| Nguyễn Trần Tấn Phát | SE173198 | Phát triển | phatnttse173198@fpt.edu.vn |

## 2. Công Nghệ Sử Dụng

| Tầng | Công nghệ |
|------|-----------|
| Backend | PHP 8.4, Laravel 13, PostgreSQL 17, Redis |
| Frontend Web | React 19, Vite, TanStack Router, Tailwind v4 |
| Frontend Mobile | Expo, React Native |
| Admin Panel | React 19, Vite, TanStack Router |
| Chấm điểm AI | LLM (GPT-4o, Groq), LanguageTool, STT (Deepgram/Whisper) |
| Thời gian thực | SSE (Server-Sent Events) cho tiến độ chấm điểm |
| Hạ tầng | Docker, FrankenPHP (Octane), S3-compatible Storage |

## 3. Bối Cảnh và Mục Tiêu

Kỳ thi VSTEP (Vietnamese Standardized Test of English Proficiency) đánh giá năng lực tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam, được Bộ Giáo dục và Đào tạo công nhận. VSTEP đánh giá đầy đủ 4 kỹ năng Nghe, Nói, Đọc, Viết ở các cấp độ từ A1 đến C1, là chứng chỉ đầu ra bắt buộc tại nhiều trường đại học.

Người học VSTEP gặp nhiều khó khăn: trình độ 4 kỹ năng thường không đồng đều, tài liệu tĩnh không điều chỉnh theo năng lực thực tế, đặc biệt thiếu công cụ đánh giá và phản hồi tức thì cho hai kỹ năng khó nhất là Viết và Nói.

Dự án xây dựng hệ thống ôn luyện VSTEP thích ứng, kết hợp luyện tập chuyên sâu với thi thử giả lập, sử dụng AI để chấm điểm Viết và Nói theo rubric chính thức của Bộ Giáo dục và Đào tạo, đồng thời cá nhân hóa gợi ý luyện tập dựa trên điểm yếu của từng người học.

Ba điểm khác biệt chính: (1) AI chấm Viết/Nói theo 4 tiêu chí VSTEP với công thức định lượng từ rubric Bộ GD&ĐT, (2) Learning Path phân tích điểm yếu và gợi ý bài tập ưu tiên, (3) Hệ thống quản lý tài nguyên AI giới hạn số lần sử dụng LLM để đảm bảo vận hành bền vững.

## 4. Khảo Sát Hiện Trạng

| Giải pháp | Hạn chế chính | 4 kỹ năng | AI chấm | Cá nhân hóa | Thi thử |
|-----------|--------------|-----------|---------|-------------|---------|
| Trung tâm luyện thi | Chương trình cố định | Có | Không | Không | Không |
| Duolingo, ELSA | Không theo VSTEP | Không | Không | Một phần | Không |
| Web thi thử VSTEP | Chỉ chấm Nghe/Đọc | 2/4 | Không | Không | Có |
| Grammarly, Write & Improve | Không rubric VSTEP | Không | Không VSTEP | Không | Không |
| Luyện thi IELTS | Khác định dạng | Có | Một phần | Có | Có |
| **Hệ thống đề xuất** | **Đầy đủ + AI VSTEP** | **4/4** | **Rubric Bộ GD** | **Theo điểm yếu** | **Có** |

## 5. Yêu Cầu Chức Năng Theo Tác Nhân

### 5.1 Người Học (Learner)

- Đăng ký, đăng nhập, quản lý hồ sơ (nhiều hồ sơ: một tài khoản, nhiều mục tiêu)
- Luyện tập 4 kỹ năng: Nghe, Đọc, Viết, Nói
- Thi thử giả lập: bài thi đầy đủ và tùy chọn theo kỹ năng
- Xem kết quả chấm điểm AI (điểm từng tiêu chí, band tổng, phản hồi)
- Theo dõi tiến độ: biểu đồ radar, xu hướng, streak, heatmap, ETA
- Nhận gợi ý luyện tập cá nhân hóa (Learning Path: ưu tiên kỹ năng yếu)
- Đăng ký khóa học, đặt buổi học 1-1 với giảng viên
- Nhận thông báo: hoàn thành chấm điểm, nhắc nhở học tập

### 5.2 Giảng Viên (Teacher)

- Xem trang tổng quan: buổi dạy hôm nay, học viên đã đặt lịch sắp tới, đơn nghỉ phép
- Quản lý buổi học 1-1: mở buổi dạy theo khóa học
- Quản lý lịch giảng dạy: xem lịch theo tuần/tháng
- Quản lý đơn nghỉ phép: gửi đơn, xem trạng thái
- Nhận thông báo: có học viên đặt buổi học, admin duyệt đơn nghỉ

### 5.3 Quản Trị Viên (Admin)

- Quản lý người dùng: danh sách, phân quyền (Learner, Teacher, Admin), khóa/mở tài khoản
- Quản lý ngân hàng câu hỏi: CRUD cho Nghe, Đọc, Viết, Nói
- Quản lý đề thi: tạo đề, phiên bản đề, kiểm tra cấu trúc chuẩn VSTEP
- Quản lý khóa học: tạo khóa, gán giảng viên, quản lý lịch buổi học chung và buổi học 1-1
- Quản lý giảng viên: xem danh sách, phân công khóa học, quản lý nghỉ phép
- Cấu hình hệ thống: rubric, giá, streak, biểu đồ
- Gói nạp xu và mã khuyến mãi: CRUD
- Trang thống kê: doanh thu, tăng trưởng người dùng, phân khúc người học

### 5.4 Mô-đun AI (Hệ Thống Thông Minh)

- Chấm điểm Viết theo 4 tiêu chí VSTEP (Task Fulfillment, Organization, Vocabulary, Grammar)
- Chấm điểm Nói theo 5 tiêu chí (Grammar, Vocabulary, Fluency, Discourse, Pronunciation)
- Phân loại từ vựng CEFR: phân loại từ theo khung tham chiếu châu Âu
- LanguageTool: phát hiện lỗi chính tả và ngữ pháp
- Learning Path: phân tích điểm yếu và đề xuất bài tập ưu tiên
- Dự đoán rủi ro: phát hiện học viên có nguy cơ không đạt mục tiêu
- SSE thời gian thực: tiến độ chấm điểm, điểm số, phản hồi

## 6. Yêu Cầu Phi Chức Năng

| ID | Yêu cầu | Trạng thái |
|----|---------|-----------|
| NFR-01 | Xác thực JWT với RBAC (Learner, Teacher, Admin) | Đã triển khai |
| NFR-02 | Mã hóa mật khẩu Argon2id, xoay vòng refresh token SHA-256 | Đã triển khai |
| NFR-03 | Giao diện tương thích (web và mobile) | Đã triển khai |
| NFR-04 | AI chấm điểm dưới 5 phút (Viết), dưới 10 phút (Nói) | Đã triển khai |
| NFR-05 | SSE thời gian thực độ trễ dưới 500ms | Đã triển khai |
| NFR-06 | Hỗ trợ trên 100 người dùng đồng thời | Đã triển khai (Octane) |
| NFR-07 | Sao lưu dữ liệu định kỳ | Môi trường phát triển |
| NFR-08 | HTTPS, TLS 1.2+, không lưu secret trong mã nguồn | Đã triển khai |

## 7. Sản Phẩm

| STT | Sản phẩm | Công nghệ |
|-----|---------|-----------|
| 1 | Ứng dụng Web: giao diện cho Người học và Giảng viên để luyện tập, thi thử, theo dõi tiến độ, phản hồi | React 19, Vite, Tailwind v4 |
| 2 | Ứng dụng Mobile: luyện tập, theo dõi tiến độ, nhận thông báo | Expo, React Native |
| 3 | Hệ thống chấm điểm: đánh giá 4 kỹ năng, tính điểm, phân tích điểm yếu | PHP/Laravel, LLM, LanguageTool, STT |
| 4 | Mô-đun gợi ý: đề xuất bài tập theo điểm yếu, API phân tích học viên có nguy cơ | LearningPathService, CourseService |
| 5 | Trang quản trị: quản lý người dùng, nội dung, đề thi, cấu hình hệ thống, thống kê | React 19, Vite |

## 8. Tính Năng Đã Triển Khai

### 8.1 Luyện Tập

- Nghe: bài tập 3 phần, chấm tự động, audio kèm transcript
- Đọc: bài tập 4 phần, MCQ/True-False-Not Given/Matching, chấm tự động
- Viết: Task 1 (thư) và Task 2 (luận), AI chấm 4 tiêu chí, SSE thời gian thực
- Nói: Part 1-3, chuyển giọng nói thành văn bản (STT), AI chấm 5 tiêu chí
- Ngữ pháp: 38 điểm ngữ pháp với bài tập theo cấp độ
- Từ vựng: danh sách Oxford 3000/5000, thẻ ghi nhớ SRS, phân loại CEFR
- Shadowing: luyện phát âm theo câu mẫu

### 8.2 Thi Thử

- Bài thi đầy đủ 4 kỹ năng và tùy chọn theo kỹ năng
- Tự động lưu mỗi 30 giây, đồng hồ đếm ngược có cảnh báo
- Nghe/Đọc chấm tự động tức thì, Viết/Nói chấm AI bất đồng bộ
- Điểm Viết tổng hợp: Task 1 tỉ trọng 1/3, Task 2 tỉ trọng 2/3

### 8.3 Hệ Thống Chấm Điểm AI

- Rubric phiên bản 8: toàn bộ tham số lưu trong CSDL, không giá trị cứng
- Chấm điểm theo công thức: định lượng với tích hợp phân loại từ vựng CEFR
- LLM kiểm tra yêu cầu: đánh giá CÓ/KHÔNG dựa trên bằng chứng
- Phản hồi AI theo yêu cầu với SSE streaming
- Tích hợp LanguageTool kiểm tra ngữ pháp và chính tả

### 8.4 Theo Dõi Tiến Độ

- Biểu đồ radar 4 kỹ năng (hiển thị khi có từ 5 bài thi trở lên)
- Cửa sổ trượt 10 bài thi gần nhất, phân tích xu hướng, dự đoán ETA
- Streak dựa trên số ngày liên tiếp hoàn thành bài thi đầy đủ
- Heatmap hiển thị tần suất làm bài thi

### 8.5 Learning Path

- Phân tích điểm yếu từ kết quả thi thử
- Gợi ý bài tập ưu tiên cho kỹ năng yếu (hiển thị trên trang Luyện tập)
- API cảnh báo học viên có nguy cơ (band thấp, bỏ luyện tập, cận hạn)

### 8.6 Khóa Học và Đặt Buổi Học 1-1

- Quản trị viên: tạo khóa học, gán giảng viên, quản lý buổi học chung và buổi học 1-1
- Giảng viên: xem lịch giảng dạy (buổi chung + buổi 1-1 đã đặt), gửi đơn nghỉ phép
- Người học: đăng ký khóa học, xem lịch buổi học chung, đặt buổi học 1-1 với giảng viên

### 8.7 Xác Thực và Phân Quyền

- Cặp JWT access/refresh token với xoay vòng và phát hiện tái sử dụng
- Phân quyền theo vai trò: Người học, Giảng viên, Quản trị viên
- Hỗ trợ nhiều hồ sơ: một tài khoản có thể có nhiều hồ sơ cho các mục tiêu khác nhau

### 8.8 Trang Quản Trị

- Quản lý người dùng: danh sách, lọc, gán vai trò, khóa/mở tài khoản
- Ngân hàng câu hỏi: CRUD cho Listening, Reading, Writing, Speaking
- Quản lý đề thi: tạo đề, phiên bản đề, kiểm tra cấu trúc chuẩn VSTEP
- Quản lý khóa học: tạo khóa, gán giảng viên, lịch buổi học chung
- Quản lý giảng viên: phân công, quản lý buổi dạy 1-1, duyệt nghỉ phép
- Gói nạp xu và mã khuyến mãi: CRUD
- Cấu hình hệ thống: tham số rubric, giá, streak, ngưỡng biểu đồ
- Trang thống kê: doanh thu, tăng trưởng người dùng, phân khúc người học

## 9. Ngoài Phạm Vi

- Các kỳ thi khác VSTEP (IELTS, TOEFL, TOEIC)
- Thanh toán trực tuyến thực tế (chỉ tích hợp mô phỏng VNPay/PayOS)
- Ứng dụng iOS/Android gốc (mobile sử dụng Expo WebView)
- Giao diện đa ngôn ngữ (MVP chỉ hỗ trợ tiếng Việt)
- Chấm bài thủ công bởi giảng viên (tạm hoãn; hệ thống sử dụng hoàn toàn AI)
