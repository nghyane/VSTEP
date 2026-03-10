# I. Record of Changes

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 15/01/2026 | Hoàng Văn Anh Nghĩa | Tài liệu SRS ban đầu — yêu cầu chức năng & phi chức năng |
| 1.1 | 01/02/2026 | Hoàng Văn Anh Nghĩa | Thêm Use Case Diagram, Actors, Screen Flow, Screen Authorization |
| 1.2 | 15/02/2026 | Hoàng Văn Anh Nghĩa | Thêm ERD, Non-Functional Requirements, Requirement Appendix |
| 1.3 | 01/03/2026 | Nguyễn Minh Khôi | Cập nhật functional requirements theo implementation thực tế |

---

# II. Software Requirement Specification

## 1. Product Overview

### 1.1 Introduction

Tài liệu này mô tả yêu cầu chức năng và phi chức năng cho **Hệ Thống Luyện Thi VSTEP Thích Ứng** — nền tảng web giúp người học Việt Nam chuẩn bị cho kỳ thi VSTEP (Vietnamese Standardized Test of English Proficiency) thông qua luyện tập thích ứng, chấm điểm AI và theo dõi tiến độ cá nhân hóa.

**Phạm vi hệ thống:**

- Luyện tập 4 kỹ năng (Listening, Reading, Writing, Speaking) với adaptive scaffolding
- Thi thử mô phỏng định dạng VSTEP.3-5 (B1–C1)
- Chấm điểm AI cho Writing/Speaking, chấm tự động cho Listening/Reading
- Quy trình đánh giá thủ công (instructor review) cho bài nộp Writing/Speaking
- Theo dõi tiến độ với Spider Chart, xu hướng và ước tính ETA
- Quản lý lớp học, đặt mục tiêu, học từ vựng
- Công cụ quản trị cho quản lý người dùng, câu hỏi và bài thi

**Ngoài phạm vi:** các bài thi khác (IELTS, TOEFL), thanh toán trực tuyến, ứng dụng iOS native, giao diện đa ngôn ngữ.

### 1.2 System Context Diagram

![System Context Diagram](../diagrams/images/srs-system-context.svg)

Hệ thống bao gồm 3 thành phần chính: Web Client (React), API Server (Bun + Elysia) và Grading Service (Python + FastAPI). Dữ liệu lưu trữ trên PostgreSQL, giao tiếp giữa API Server và Grading Service qua Redis Streams, file âm thanh Speaking lưu trên Object Storage tương thích S3.

### 1.3 User Characteristics

| Actor | Đặc điểm | Trình độ kỹ thuật |
|-------|----------|-------------------|
| **Learner** | Sinh viên đại học hoặc người đi làm chuẩn bị thi VSTEP. Độ tuổi 18–35, thiết bị chính là smartphone. | Cơ bản — quen thuộc với ứng dụng di động và web. |
| **Instructor** | Giảng viên tiếng Anh tại trường đại học hoặc trung tâm ngôn ngữ. Đánh giá bài nộp Writing/Speaking, quản lý lớp học. | Trung bình — thoải mái với ứng dụng web. |
| **Admin** | Quản trị hệ thống: quản lý người dùng, câu hỏi, bài thi, bài nộp. | Nâng cao — quen với hệ thống quản lý nội dung. |

### 1.4 Constraints

| # | Ràng buộc |
|---|----------|
| C-01 | Chỉ hỗ trợ định dạng VSTEP.3-5 (B1–C1) |
| C-02 | Chấm điểm AI mang tính bổ trợ — điểm chính thức yêu cầu instructor xác nhận |
| C-03 | Giao diện tiếng Việt trong MVP |
| C-04 | Thời hạn phát triển: 4 tháng (14 tuần, 7 sprint), nhóm 4 người |
| C-05 | Chấm điểm AI phụ thuộc nhà cung cấp LLM/STT bên ngoài |

### 1.5 Assumptions & Dependencies

**Giả định:**
- Học viên có kết nối internet ổn định (≥1 Mbps) và thiết bị có micro cho luyện Speaking
- Định dạng và rubric thi VSTEP giữ ổn định trong thời gian dự án

**Phụ thuộc:**
- API LLM cho chấm điểm Writing/Speaking (OpenAI GPT-4o, fallback Cloudflare Workers AI)
- API STT cho phiên âm Speaking (Deepgram Nova-3 / Whisper qua Cloudflare)
- PostgreSQL 17, Redis 7.2+, Object Storage tương thích S3

## 2. User Requirements

### 2.1 Actors

| # | Actor | Mô tả |
|---|-------|-------|
| 1 | **Learner** | Người dùng đã đăng ký (role = `learner`). Luyện tập kỹ năng, làm bài thi thử, xem tiến độ, đặt mục tiêu, tham gia lớp học. |
| 2 | **Instructor** | Giảng viên (role = `instructor`). Đánh giá bài nộp Writing/Speaking, quản lý lớp học, giám sát tiến độ học viên. Kế thừa quyền Learner. |
| 3 | **Admin** | Quản trị viên (role = `admin`). Quản lý người dùng, câu hỏi, bài thi, bài nộp, điểm kiến thức. |
| 4 | **Grading Service** | Tác nhân hệ thống tự động. Tiêu thụ tác vụ chấm điểm từ Redis Streams, chấm điểm qua LLM/STT, trả kết quả về backend. |
| 5 | **AI Provider** | API bên ngoài cung cấp LLM inference và STT transcription. |

### 2.2 Use Cases

#### 2.2.1 Use Case Diagrams

![Use Case Diagram](../diagrams/images/uc-overview.svg)

#### 2.2.2 Use Case Descriptions

| ID | Use Case | Actors | Mô tả |
|----|----------|--------|-------|
| UC-01 | Đăng ký | Learner | Tạo tài khoản với email, password, họ tên. Vai trò mặc định là Learner. |
| UC-02 | Đăng nhập | All | Xác thực bằng email + password, nhận cặp JWT access/refresh token. |
| UC-03 | Đăng xuất | All | Thu hồi refresh token hiện tại. |
| UC-04 | Làm mới token | All | Xoay vòng refresh token — thu hồi cũ, phát hành cặp mới. |
| UC-10 | Luyện Listening | Learner | Lấy câu hỏi nghe với adaptive scaffolding. Chấm tự động ngay lập tức. |
| UC-11 | Luyện Reading | Learner | Lấy câu hỏi đọc (MCQ, T/F/NG, Matching, Gap Fill). Chấm tự động. |
| UC-12 | Luyện Writing | Learner | Nộp bài viết để chấm điểm AI bất đồng bộ. |
| UC-13 | Luyện Speaking | Learner | Nộp bản ghi âm để STT + chấm điểm AI bất đồng bộ. |
| UC-14 | Xem kết quả bài nộp | Learner | Xem điểm, band, chi tiết từng tiêu chí, phản hồi AI. |
| UC-20 | Xem danh sách bài thi | Learner | Duyệt bài thi thử, lọc theo cấp độ (B1/B2/C1). |
| UC-21 | Bắt đầu phiên thi | Learner | Bắt đầu phiên thi thử có giới hạn thời gian. |
| UC-22 | Trả lời câu hỏi thi | Learner | Trả lời câu hỏi trong phiên thi. Tự động lưu định kỳ. |
| UC-23 | Nộp bài thi | Learner | Hoàn tất bài thi. L/R chấm tự động, W/S chuyển sang chấm AI. |
| UC-24 | Xem kết quả thi | Learner | Xem điểm từng kỹ năng, band và điểm tổng. |
| UC-30 | Xem tổng quan tiến độ | Learner | Xem 4 kỹ năng: trình độ, điểm trung bình, xu hướng. |
| UC-31 | Xem Spider Chart | Learner | Biểu đồ radar 4 trục hiển thị điểm hiện tại + mục tiêu. |
| UC-32 | Xem chi tiết kỹ năng | Learner | Lịch sử điểm, phân loại xu hướng, mức scaffolding. |
| UC-33 | Đặt mục tiêu học tập | Learner | Đặt band mục tiêu, thời hạn, thời gian học hàng ngày. |
| UC-34 | Xem ước tính ETA | Learner | Ước tính thời gian để đạt mục tiêu mỗi kỹ năng. |
| UC-40 | Tham gia lớp học | Learner | Tham gia lớp bằng mã mời. |
| UC-41 | Rời lớp học | Learner | Rời khỏi lớp đã tham gia. |
| UC-42 | Xem phản hồi giảng viên | Learner | Xem nhận xét phản hồi từ giảng viên cho lớp cụ thể. |
| UC-50 | Xem hàng đợi đánh giá | Instructor | Danh sách bài nộp chờ đánh giá, sắp xếp theo ưu tiên. |
| UC-51 | Nhận bài chấm | Instructor | Nhận một bài nộp để đánh giá độc quyền. |
| UC-52 | Đánh giá & chấm bài | Instructor | Nộp điểm cuối cùng, band, điểm từng tiêu chí, phản hồi. |
| UC-53 | Trả lại bài nộp | Instructor | Trả lại bài đã nhận vào hàng đợi. |
| UC-61 | Quản lý câu hỏi | Instructor | Tạo và cập nhật câu hỏi trong ngân hàng câu hỏi. |
| UC-70 | Tạo lớp học | Instructor | Tạo lớp với mã mời tự động. |
| UC-71 | Xem dashboard lớp | Instructor | Xem thành viên, tiến độ, học viên có nguy cơ. |
| UC-72 | Xem tiến độ thành viên | Instructor | Tiến độ chi tiết của từng học viên trong lớp. |
| UC-73 | Gửi phản hồi | Instructor | Gửi nhận xét cho học viên cụ thể trong lớp. |
| UC-74 | Xoay mã mời | Instructor | Tạo mã mời mới, vô hiệu mã cũ. |
| UC-75 | Xóa thành viên | Instructor | Xóa học viên khỏi lớp. |
| UC-80 | Danh sách người dùng | Admin | Xem danh sách người dùng phân trang với bộ lọc. |
| UC-81 | Đổi vai trò | Admin | Thay đổi vai trò người dùng (Learner/Instructor/Admin). |
| UC-85 | Quản lý ngân hàng câu hỏi | Admin | CRUD đầy đủ trên câu hỏi. |
| UC-87 | Quản lý knowledge points | Admin | CRUD trên phân loại điểm kiến thức. |
| UC-88 | Quản lý bài thi | Admin | Tạo, cập nhật và xóa bài thi. |
| UC-89 | Quản lý hàng đợi đánh giá | Admin | Xem và thao tác trên quy trình đánh giá với quyền nâng cao. |

---

## 3. Functional Requirements

### 3.1 System Functional Overview

#### 3.1.1 Screens Flow

![Registration & Login Flow](../diagrams/images/srs-registration-flow.svg)

![Onboarding Flow](../diagrams/images/srs-onboarding-flow.svg)

#### 3.1.2 Screen Descriptions

| # | Feature | Screen | Mô tả |
|---|---------|--------|-------|
| 1 | Authentication | Đăng Nhập | Form email + mật khẩu. Liên kết tới Đăng Ký. |
| 2 | Authentication | Đăng Ký | Form email, mật khẩu, họ tên. Chuyển hướng tới Onboarding khi thành công. |
| 2a | Onboarding | Chào Mừng | Hai lựa chọn: "Tự xác định trình độ" hoặc "Làm bài kiểm tra". |
| 2b | Onboarding | Tự Đánh Giá | Chọn trình độ hiện tại (A2/B1/B2/C1). |
| 2c | Onboarding | Bài Kiểm Tra Đầu Vào | 10 câu trắc nghiệm ngữ pháp, tự động xác định trình độ. |
| 2d | Onboarding | Kết Quả Đánh Giá | Hiển thị trình độ ước tính. Nút "Làm lại" hoặc "Tiếp tục". |
| 2e | Onboarding | Thiết Lập Mục Tiêu | Chọn band mục tiêu, thời hạn, thời gian học mỗi ngày. |
| 3 | Home | Bảng Điều Khiển | Trang chủ với liên kết nhanh tới Luyện Tập, Thi Thử, Tiến Độ. |
| 4 | Practice | Chọn Kỹ Năng | Lưới 4 kỹ năng với huy hiệu trình độ hiện tại. |
| 5 | Practice | Xem Câu Hỏi | Hiển thị câu hỏi với scaffolding đã áp dụng. Trình phát âm thanh cho Listening/Speaking. |
| 6 | Practice | Nộp Bài | Xác nhận trước khi nộp. Kiểm tra số từ cho Writing. |
| 7 | Practice | Kết Quả | Điểm (0–10), band, chi tiết tiêu chí, phản hồi AI. |
| 8 | Mock Exam | Danh Sách | Danh sách bài thi, lọc theo cấp độ (B1/B2/C1). |
| 9 | Mock Exam | Chi Tiết | Xem trước blueprint: 4 phần với số câu và thời gian. |
| 10 | Mock Exam | Phiên Thi | Bài thi có giới hạn thời gian, tự động lưu mỗi 30 giây. |
| 11 | Mock Exam | Kết Quả | Điểm từng kỹ năng, band, điểm tổng. Chỉ báo chờ cho W/S. |
| 12 | Progress | Tổng Quan | Spider Chart (radar 4 trục), xu hướng, ước tính band. |
| 13 | Progress | Chi Tiết Kỹ Năng | Biểu đồ 10 điểm gần nhất, xu hướng, ETA. |
| 14 | Progress | Đặt Mục Tiêu | Chọn band mục tiêu, thời hạn, thời gian học. |
| 15 | Class | Lớp Của Tôi | Danh sách lớp + nút tham gia bằng mã mời. |
| 16 | Class | Dashboard Lớp | Số thành viên, trung bình kỹ năng, học viên có nguy cơ. |
| 17 | Class | Tiến Độ Thành Viên | Chi tiết tiến độ từng học viên. |
| 18 | Review | Hàng Đợi | Bảng bài nộp chờ đánh giá, huy hiệu ưu tiên. |
| 19 | Review | Chi Tiết | Hiển thị song song: câu trả lời học viên + kết quả AI. Form chấm điểm. |
| 20 | Content | Ngân Hàng Câu Hỏi | Bảng phân trang với bộ lọc. Hành động CRUD. |
| 21 | Content | Tạo/Sửa Câu Hỏi | Form nhập kỹ năng, cấp độ, nội dung, đáp án. |
| 22 | Vocabulary | Danh Sách Chủ Đề | Lưới chủ đề với số từ và tiến độ. |
| 23 | Vocabulary | Học Từ | Giao diện flashcard: từ, phiên âm, định nghĩa, ví dụ. |
| 24 | Submission | Lịch Sử | Danh sách bài nộp với bộ lọc kỹ năng, điểm, band. |
| 25 | Submission | Chi Tiết | Câu hỏi, câu trả lời, chi tiết điểm, phản hồi AI/instructor. |
| 26 | Progress | Lịch Sử | Biểu đồ nhiệt hoạt động, phân bố kỹ năng. |

#### 3.1.3 Screen Authorization

| Screen | Learner | Instructor | Admin |
|--------|---------|------------|-------|
| Đăng Nhập / Đăng Ký | ✓ | ✓ | ✓ |
| Onboarding | ✓ (lần đầu) | | |
| Bảng Điều Khiển | ✓ | ✓ | ✓ |
| Practice | ✓ | ✓ | ✓ |
| Practice — Kết Quả | ✓ (của mình) | ✓ (của mình) | ✓ (tất cả) |
| Mock Exam | ✓ | ✓ | ✓ |
| Mock Exam — Kết Quả | ✓ (của mình) | ✓ (của mình) | ✓ (tất cả) |
| Progress | ✓ (của mình) | ✓ (của mình) | ✓ (tất cả) |
| Class — Lớp Của Tôi / Tham Gia | ✓ | ✓ | ✓ |
| Class — Dashboard / Tiến Độ / Phản Hồi | | ✓ (chủ lớp) | ✓ |
| Review | | ✓ | ✓ |
| Content — Câu Hỏi / Bài Thi | | ✓ | ✓ |
| Content — Xóa Câu Hỏi | | | ✓ |
| Admin — Người Dùng / Vai Trò | | | ✓ |
| Vocabulary | ✓ | ✓ | ✓ |
| Submission | ✓ (của mình) | ✓ (của mình) | ✓ (tất cả) |

#### 3.1.4 Non-Screen Functions

| # | Feature | Function | Mô tả |
|---|---------|----------|-------|
| 1 | AI Grading | Grading Worker | Worker bất đồng bộ chấm điểm bài Writing/Speaking qua LLM/STT. |
| 2 | AI Grading | Confidence Routing | Định tuyến theo độ tin cậy: high → completed, medium/low → review_pending. |
| 3 | AI Grading | Failure Handling | Tác vụ thất bại sau số lần thử tối đa → trạng thái `failed`. |
| 4 | Authentication | Token Rotation | Xoay vòng refresh token, phát hiện tái sử dụng → thu hồi toàn bộ. |
| 5 | Authentication | Device Limit | Tối đa 3 refresh token hoạt động mỗi người dùng. |
| 6 | Progress | Sliding Window Sync | Sau mỗi điểm mới: tính trung bình, xu hướng, điều chỉnh mức scaffolding. |
| 7 | Mock Exam | Auto-Save | Client gửi snapshot câu trả lời mỗi 30 giây. |
| 8 | Mock Exam | Submission Processing | Chấm tự động L/R, tạo bài nộp W/S để chấm AI. |
| 9 | Health | Health Check | Kiểm tra kết nối PostgreSQL và Redis. |
| 10 | API | OpenAPI Spec | Tự động tạo đặc tả OpenAPI. |

#### 3.1.5 Entity Relationship Diagram

![Entity Relationship Diagram](../diagrams/images/srs-entity-relationship.svg)

| # | Entity | Mô tả |
|---|--------|-------|
| 1 | `users` | Người dùng với 3 vai trò: learner, instructor, admin. |
| 2 | `refresh_tokens` | JWT refresh token hỗ trợ rotation và phát hiện tái sử dụng. |
| 3 | `questions` | Ngân hàng câu hỏi 4 kỹ năng, 8 loại định dạng. |
| 4 | `submissions` | Bài nộp của học viên, theo dõi vòng đời qua state machine. |
| 5 | `submission_details` | Chi tiết câu trả lời, kết quả chấm và phản hồi (1:1 với submissions). |
| 6 | `exams` | Định nghĩa bài thi thử với cấp độ và blueprint. |
| 7 | `exam_sessions` | Phiên thi có giới hạn thời gian, lưu điểm từng kỹ năng. |
| 8 | `exam_answers` | Câu trả lời trong phiên thi. |
| 9 | `exam_submissions` | Liên kết phiên thi với bài nộp W/S. |
| 10 | `knowledge_points` | Phân loại điểm kiến thức cho adaptive learning. |
| 11 | `question_knowledge_points` | Liên kết nhiều-nhiều giữa câu hỏi và điểm kiến thức. |
| 12 | `user_progress` | Tiến độ mỗi người dùng mỗi kỹ năng (sliding window). |
| 13 | `user_skill_scores` | Bản ghi điểm riêng lẻ cho sliding window. |
| 14 | `user_goals` | Mục tiêu học tập với band, thời hạn, thời gian học. |
| 15 | `user_knowledge_progress` | Theo dõi thành thạo điểm kiến thức mỗi người dùng. |
| 16 | `classes` | Lớp học với mã mời tự động. |
| 17 | `class_members` | Đăng ký lớp học. |
| 18 | `instructor_feedback` | Phản hồi giảng viên cho học viên. |
| 19 | `vocabulary_topics` | Chủ đề từ vựng. |
| 20 | `vocabulary_words` | Từ vựng trong chủ đề (phiên âm, định nghĩa, ví dụ). |
| 21 | `user_vocabulary_progress` | Tiến độ học từ mỗi người dùng. |
| 22 | `notifications` | Thông báo người dùng. |
| 23 | `device_tokens` | Token thiết bị thông báo đẩy. |
| 24 | `user_placements` | Kết quả bài kiểm tra xếp lớp ban đầu. |

### 3.2 Authentication

#### 3.2.1 Register

1. **Trigger:** Nhấn liên kết "Đăng ký" tại màn hình Đăng Nhập.
2. **Description:** Người dùng mới tạo tài khoản với email, mật khẩu và họ tên. Vai trò mặc định là Learner.
3. **Screen Layout:** ![Register Screen](../diagrams/images/mockup-register.png)
4. **Function Details:**
   - Nhập email (bắt buộc, duy nhất), mật khẩu (tối thiểu 8 ký tự), họ tên (bắt buộc).
   - Xác thực thành công → chuyển hướng tới màn hình Đăng Nhập.
   - Email đã tồn tại → hiển thị thông báo lỗi.
   - Định dạng email không hợp lệ hoặc mật khẩu quá ngắn → hiển thị lỗi validation.

#### 3.2.2 Login

1. **Trigger:** Truy cập ứng dụng hoặc hết phiên đăng nhập.
2. **Description:** Xác thực bằng email + mật khẩu, nhận cặp JWT access/refresh token.
3. **Screen Layout:** ![Login Screen](../diagrams/images/mockup-login.png)
4. **Function Details:**
   - Nhập email và mật khẩu.
   - Đăng nhập thành công → chuyển hướng tới Trang Chủ (hoặc Onboarding nếu lần đầu).
   - Tối đa 3 thiết bị đăng nhập đồng thời — thiết bị cũ nhất sẽ bị đăng xuất.
   - Sai thông tin → hiển thị thông báo lỗi.

#### 3.2.3 Logout

1. **Trigger:** Nhấn nút "Đăng xuất" trong menu.
2. **Description:** Thu hồi refresh token hiện tại, chuyển về màn hình Đăng Nhập.

#### 3.2.4 Token Refresh

1. **Trigger:** Access token hết hạn (tự động bởi client).
2. **Description:** Xoay vòng refresh token — thu hồi token cũ, phát hành cặp mới. Phát hiện tái sử dụng token → thu hồi toàn bộ phiên, buộc đăng nhập lại.

![Auth Token Lifecycle](../diagrams/images/srs-auth-token-lifecycle.svg)

### 3.3 Onboarding & Placement Test

#### 3.3.1 Welcome Screen

1. **Trigger:** Đăng nhập lần đầu sau đăng ký.
2. **Description:** Màn hình chào mừng với 2 lựa chọn: "Tự xác định trình độ" hoặc "Làm bài kiểm tra đầu vào".
3. **Screen Layout:** ![Onboarding Welcome](../diagrams/images/mockup-onboarding-welcome.png)

#### 3.3.2 Self-Assessment

1. **Trigger:** Chọn "Tự xác định trình độ" tại màn hình Chào Mừng.
2. **Description:** Chọn trình độ hiện tại từ 4 mức (A2/B1/B2/C1), chuyển sang Thiết Lập Mục Tiêu.

#### 3.3.3 Placement Test

1. **Trigger:** Chọn "Làm bài kiểm tra" tại màn hình Chào Mừng.
2. **Description:** 10 câu trắc nghiệm ngữ pháp (A2→C1), khoảng 3 phút. Tự động xác định trình độ khi hoàn thành.
3. **Screen Layout:** ![Placement Test](../diagrams/images/mockup-placement-test.png)
4. **Function Details:**
   - Hiển thị thanh tiến độ và phản hồi đúng/sai từng câu.
   - Hoàn thành → hiển thị trình độ ước tính, nút "Làm lại" hoặc "Tiếp tục".

#### 3.3.4 Goal Setup

1. **Trigger:** Sau khi xác định trình độ (tự đánh giá hoặc placement test).
2. **Description:** Chọn band mục tiêu (B1/B2/C1), thời hạn, thời gian học mỗi ngày. Hoàn thành → chuyển hướng tới Trang Chủ.

![Onboarding Flow](../diagrams/images/srs-placement-test-flow.svg)

### 3.4 Practice — Listening

#### 3.4.1 Get Listening Question

1. **Trigger:** Chọn kỹ năng Listening tại màn hình Chọn Kỹ Năng.
2. **Description:** Lấy câu hỏi nghe với adaptive scaffolding đã áp dụng theo trình độ học viên.
3. **Screen Layout:** ![Listening Practice](../diagrams/images/mockup-practice-listening.png)
4. **Function Details:**
   - Scaffolding 3 giai đoạn: Full Text (hiển thị transcript) → Highlights (từ khóa) → Pure Audio (chỉ âm thanh).
   - Hiển thị trình phát âm thanh và câu hỏi.

#### 3.4.2 Submit Listening Answer

1. **Trigger:** Nhấn nút "Nộp bài" sau khi trả lời.
2. **Description:** Chấm tự động ngay lập tức, hiển thị kết quả.
4. **Function Details:**
   - Điểm = (số câu đúng / tổng) × 10, làm tròn tới 0.5.
   - Cập nhật tiến độ và đánh giá mức scaffolding.
   - Quy tắc lên/xuống cấp scaffolding: lên cấp khi trung bình 3 lần ⊥ 80%, xuống cấp khi 2 lần liên tiếp < 50%.

### 3.5 Practice — Reading

#### 3.5.1 Get Reading Question

1. **Trigger:** Chọn kỹ năng Reading tại màn hình Chọn Kỹ Năng.
2. **Description:** Lấy câu hỏi đọc theo định dạng VSTEP (MCQ, True/False/Not Given, Matching Headings, Gap Fill).
3. **Screen Layout:** ![Reading Practice](../diagrams/images/mockup-practice-reading.png)

#### 3.5.2 Submit Reading Answer

1. **Trigger:** Nhấn nút "Nộp bài".
2. **Description:** Chấm tự động, hiển thị kết quả với đúng/sai mỗi item.

![Practice Flow](../diagrams/images/srs-practice-flow.svg)

### 3.6 Practice — Writing + AI Grading

#### 3.6.1 Get Writing Question

1. **Trigger:** Chọn kỹ năng Writing tại màn hình Chọn Kỹ Năng.
2. **Description:** Lấy câu hỏi viết với adaptive scaffolding.
3. **Screen Layout:** ![Writing Practice](../diagrams/images/mockup-practice-writing.png)
4. **Function Details:**
   - Scaffolding 3 giai đoạn: Template (đầy đủ câu mở đầu, liên từ) → Keywords (từ khóa) → Free (không hỗ trợ).
   - 2 loại bài: Task 1 (Thư/Email, ≥120 từ), Task 2 (Bài luận, ≥250 từ).

#### 3.6.2 Submit Writing Answer

1. **Trigger:** Nhấn nút "Nộp bài" sau khi viết xong.
2. **Description:** Nộp bài viết để chấm điểm AI bất đồng bộ.
4. **Function Details:**
   - Kiểm tra số từ tối thiểu trước khi nộp.
   - Tạo bài nộp với trạng thái `pending`, chuyển sang chấm AI.
   - AI chấm theo 4 tiêu chí VSTEP: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
   - Định tuyến theo độ tin cậy: high → completed, medium/low → review_pending (chờ instructor đánh giá).
   - Hiển thị trạng thái "Đang chấm điểm..." và thông báo khi hoàn thành.

![AI Grading Pipeline](../diagrams/images/srs-ai-grading-pipeline.svg)

### 3.7 Practice — Speaking + AI Grading

#### 3.7.1 Get Speaking Question

1. **Trigger:** Chọn kỹ năng Speaking tại màn hình Chọn Kỹ Năng.
2. **Description:** Lấy câu hỏi nói với 3 phần: Part 1 (Tương Tác Xã Hội), Part 2 (Thảo Luận Giải Pháp), Part 3 (Phát Triển Chủ Đề).
3. **Screen Layout:** ![Speaking Practice](../diagrams/images/mockup-practice-speaking.png)

#### 3.7.2 Submit Speaking Answer

1. **Trigger:** Nhấn nút "Nộp bài" sau khi ghi âm.
2. **Description:** Tải lên bản ghi âm, chấm điểm AI bất đồng bộ (STT phiên âm → LLM chấm điểm).
4. **Function Details:**
   - AI chấm theo 4 tiêu chí VSTEP: Fluency & Coherence, Pronunciation, Content & Relevance, Vocabulary & Grammar.
   - Định tuyến theo độ tin cậy tương tự Writing.

### 3.8 Mock Exam

#### 3.8.1 Exam List

1. **Trigger:** Chọn menu "Thi Thử" tại thanh điều hướng.
2. **Description:** Hiển thị danh sách bài thi thử, lọc theo cấp độ (B1/B2/C1).
3. **Screen Layout:** ![Exam List](../diagrams/images/mockup-exam-list.png)

#### 3.8.2 Exam Detail

1. **Trigger:** Nhấn vào bài thi trong danh sách.
2. **Description:** Xem trước blueprint: 4 phần (L/R/W/S) với số câu hỏi và giới hạn thời gian. Nút "Bắt đầu thi".

#### 3.8.3 Start Exam Session

1. **Trigger:** Nhấn nút "Bắt đầu thi" tại màn hình Chi Tiết Bài Thi.
2. **Description:** Tạo phiên thi có giới hạn thời gian, hiển thị câu hỏi theo từng phần.
3. **Screen Layout:** ![Exam Session](../diagrams/images/mockup-exam-session.png)
4. **Function Details:**
   - Bộ đếm thời gian hiển thị nổi bật, cảnh báo tại 5 phút và 1 phút còn lại.
   - Tự động lưu câu trả lời mỗi 30 giây.
   - Tab chuyển giữa các phần.

#### 3.8.4 Submit Exam

1. **Trigger:** Nhấn nút "Nộp bài" hoặc hết thời gian.
2. **Description:** Hoàn tất bài thi, chấm điểm và hiển thị kết quả.
4. **Function Details:**
   - L/R chấm tự động ngay lập tức, W/S chuyển sang chấm AI bất đồng bộ.
   - Khi tất cả 4 kỹ năng có điểm → tính điểm tổng và band.
   - Hiển thị điểm L/R ngay, chỉ báo "Đang chấm" cho W/S.

![Exam Session Flow](../diagrams/images/srs-exam-session-flow.svg)

### 3.9 Instructor Review

#### 3.9.1 Review Queue

1. **Trigger:** Chọn menu "Đánh giá" tại thanh điều hướng (Instructor/Admin).
2. **Description:** Danh sách bài nộp chờ đánh giá, sắp xếp theo ưu tiên (high → medium → low).
3. **Screen Layout:** ![Review Queue](../diagrams/images/mockup-review-queue.png)

#### 3.9.2 Claim Submission

1. **Trigger:** Nhấn nút "Nhận chấm" trên bài nộp.
2. **Description:** Nhận bài nộp để đánh giá độc quyền. Timeout 15 phút — quá thời gian sẽ tự động trả về hàng đợi.
4. **Function Details:**
   - Bài đã được người khác nhận → thông báo lỗi.
   - Có thể trả lại bài vào hàng đợi nếu không thể hoàn thành.

#### 3.9.3 Submit Review

1. **Trigger:** Nhấn nút "Gửi đánh giá" sau khi chấm xong.
2. **Description:** Nộp điểm cuối cùng, band, điểm từng tiêu chí và phản hồi.
3. **Screen Layout:** ![Review Detail](../diagrams/images/mockup-review-detail.png)
4. **Function Details:**
   - Hiển thị song song: câu trả lời học viên (trái) + kết quả AI (phải).
   - Điểm instructor luôn là cuối cùng, ghi đè điểm AI.
   - Cập nhật trạng thái bài nộp → `completed`, thông báo cho học viên.

![Instructor Review Flow](../diagrams/images/srs-instructor-review-flow.svg)

![Submission State Machine](../diagrams/images/srs-submission-state-machine.svg)

### 3.10 Progress Tracking

#### 3.10.1 Progress Overview

1. **Trigger:** Chọn menu "Tiến Độ" tại thanh điều hướng.
2. **Description:** Xem tổng quan tiến độ 4 kỹ năng: trình độ hiện tại, điểm trung bình, xu hướng.
3. **Screen Layout:** ![Progress Overview](../diagrams/images/mockup-progress-overview.png)

#### 3.10.2 Spider Chart

1. **Trigger:** Hiển thị trên màn hình Tổng Quan Tiến Độ.
2. **Description:** Biểu đồ radar 4 trục hiển thị điểm hiện tại + mục tiêu mỗi kỹ năng.

#### 3.10.3 Skill Detail

1. **Trigger:** Nhấn vào một kỹ năng trên màn hình Tổng Quan.
2. **Description:** Biểu đồ 10 điểm gần nhất, phân loại xu hướng, mức scaffolding, ước tính ETA.
4. **Function Details:**
   - Xu hướng: improving (độ lệch ≥+0.5), declining (≤−0.5), stable, inconsistent (stdDev ≥1.5).
   - ETA: hồi quy tuyến tính trên sliding window, trả về số tuần.
   - Band tổng thể = min(band 4 kỹ năng).

![Progress Sliding Window](../diagrams/images/srs-progress-sliding-window.svg)

### 3.11 Goal Setting

#### 3.11.1 Create Goal

1. **Trigger:** Nhấn nút "Đặt mục tiêu" tại màn hình Tiến Độ.
2. **Description:** Đặt band mục tiêu (B1/B2/C1), thời hạn (tùy chọn), thời gian học hàng ngày.
3. **Screen Layout:** ![Goal Setting](../diagrams/images/mockup-goal-setting.png)
4. **Function Details:**
   - Hiển thị trạng thái mục tiêu: đạt/chưa đạt, đúng lộ trình hay không, số ngày còn lại.
   - Có thể cập nhật mục tiêu bất cứ lúc nào.

### 3.12 Class Management

#### 3.12.1 Join Class

1. **Trigger:** Nhập mã mời tại màn hình Lớp Của Tôi.
2. **Description:** Tham gia lớp học bằng mã mời do instructor cung cấp.

#### 3.12.2 Create Class (Instructor)

1. **Trigger:** Nhấn nút "Tạo lớp" tại màn hình Lớp Của Tôi.
2. **Description:** Tạo lớp học với mã mời tự động.

#### 3.12.3 Class Dashboard (Instructor)

1. **Trigger:** Chọn lớp tại màn hình Lớp Của Tôi.
2. **Description:** Xem số thành viên, trung bình từng kỹ năng, học viên có nguy cơ (trung bình < 5.0).
3. **Screen Layout:** ![Class Dashboard](../diagrams/images/mockup-class-dashboard.png)
4. **Function Details:**
   - Xem tiến độ chi tiết từng thành viên.
   - Gửi phản hồi cho học viên cụ thể.
   - Xoay mã mời, xóa thành viên.

![Class Management Flow](../diagrams/images/srs-class-management-flow.svg)

### 3.13 Content Management

#### 3.13.1 Question CRUD

1. **Trigger:** Chọn menu "Ngân hàng câu hỏi" (Instructor/Admin).
2. **Description:** Tạo, xem, sửa, xóa câu hỏi trong ngân hàng.
3. **Screen Layout:** ![Question Bank](../diagrams/images/mockup-question-bank.png)
4. **Function Details:**
   - Nhập: kỹ năng, cấp độ, định dạng, nội dung, đáp án (L/R), rubric (W/S).
   - Bộ lọc: kỹ năng, cấp độ, định dạng, trạng thái.
   - Xóa câu hỏi: chỉ Admin.

#### 3.13.2 Exam Management

1. **Trigger:** Chọn menu "Quản lý bài thi" (Instructor/Admin).
2. **Description:** Tạo, cập nhật và xóa bài thi thử với blueprint (chọn câu hỏi theo kỹ năng).

### 3.14 User Management (Admin)

#### 3.14.1 User Operations

1. **Trigger:** Chọn menu "Quản lý người dùng" (Admin).
2. **Description:** Xem danh sách người dùng, thay đổi vai trò, quản lý tài khoản.
3. **Screen Layout:** ![User Management](../diagrams/images/mockup-user-management.png)
4. **Function Details:**
   - Danh sách phân trang với bộ lọc (vai trò, tìm kiếm email/tên).
   - Đổi vai trò giữa Learner/Instructor/Admin.
   - Đổi mật khẩu tự phục vụ: người dùng tự đổi từ màn hình hồ sơ.

### 3.15 Notifications

#### 3.15.1 Notification Types

| Loại | Sự kiện kích hoạt | Kênh |
|------|---------|---------|
| Chấm điểm hoàn thành | Bài nộp → completed | Trong ứng dụng, Push |
| Yêu cầu đánh giá | Bài nộp review_pending mới | Trong ứng dụng (instructor) |
| Nhắc nhở mục tiêu | Chưa đạt thời gian học hàng ngày | Push, Trong ứng dụng |
| Kết quả thi | Phiên thi → completed | Trong ứng dụng, Push |

#### 3.15.2 Device Token Registration

1. **Trigger:** Khi đăng nhập trên thiết bị di động.
2. **Description:** Đăng ký token thiết bị để nhận thông báo đẩy.

### 3.16 Vocabulary

#### 3.16.1 Topic List

1. **Trigger:** Chọn menu "Từ vựng" tại thanh điều hướng.
2. **Description:** Hiển thị lưới chủ đề từ vựng với số từ và tiến độ.
3. **Screen Layout:** ![Vocabulary Topics](../diagrams/images/mockup-vocabulary-topics.png)

#### 3.16.2 Learn Words

1. **Trigger:** Chọn chủ đề từ danh sách.
2. **Description:** Giao diện flashcard hiển thị từ, phiên âm, định nghĩa, ví dụ. Đánh dấu đã biết/chưa biết.

> **Ghi chú:** Tính năng Vocabulary hiện sử dụng mock data, chưa tích hợp API thực tế.

---

## 4. Non-Functional Requirements

### 4.1 External Interfaces

#### 4.1.1 User Interface

- **Ứng dụng Web:** React 19 + Vite 7, thiết kế responsive hỗ trợ desktop (1024px+) và tablet (768px+).
- **Ngôn ngữ:** Tiếng Việt (chính).
- **Trợ năng:** Tuân thủ WCAG 2.1 Level AA cho điều hướng cốt lõi.

#### 4.1.2 Hardware Interface

- **Micro:** Yêu cầu cho luyện Speaking (ghi âm).
- **Loa/Tai nghe:** Yêu cầu cho luyện Listening (phát âm thanh).

#### 4.1.3 Software Interface

| Hệ thống | Giao diện | Mục đích |
|----------|----------|---------|
| LLM API (OpenAI, Cloudflare) | HTTPS REST | Chấm điểm Writing/Speaking |
| STT API (Deepgram, Whisper) | HTTPS REST | Phiên âm Speaking |
| PostgreSQL 17 | TCP 5432 | Kho dữ liệu chính |
| Redis 7.2+ | TCP 6379 | Streams và caching |
| Object Storage (S3-compatible) | HTTPS | Lưu trữ âm thanh Speaking |

#### 4.1.4 Communication Interface

- **Giao thức:** HTTPS (TLS 1.2+) cho mọi giao tiếp client-server.
- **Định dạng API:** REST, JSON (UTF-8), timestamp ISO 8601 UTC.
- **Xác thực:** JWT Bearer token trong header `Authorization`.

### 4.2 Quality Attributes

#### 4.2.1 Usability

| ID | Yêu cầu |
|----|---------|
| REQ-U01 | Học viên mới có thể bắt đầu luyện tập trong vòng 5 phút sau đăng ký. |
| REQ-U02 | Spider Chart và dữ liệu tiến độ phải dễ hiểu mà không cần giải thích thêm. |
| REQ-U03 | Giao diện luyện tập cung cấp chỉ báo trực quan về mức scaffolding hiện tại. |
| REQ-U04 | Thông báo lỗi hiển thị bằng tiếng Việt với hướng dẫn cụ thể. |
| REQ-U05 | Bộ đếm thời gian thi hiển thị nổi bật với cảnh báo tại 5 phút và 1 phút. |

#### 4.2.2 Reliability

| ID | Yêu cầu |
|----|---------|
| REQ-R01 | Khả dụng hệ thống: ≥ 99% trong giờ làm việc (8:00–22:00 ICT). |
| REQ-R02 | Dịch vụ chấm điểm thử lại tối đa 3 lần với exponential backoff. |
| REQ-R03 | Hết lần thử → trạng thái `failed`, không mất dữ liệu âm thầm. |
| REQ-R04 | Tự động lưu bài thi mỗi 30 giây — mất dữ liệu tối đa 30 giây. |
| REQ-R05 | Phát hiện tái sử dụng refresh token → thu hồi toàn bộ token. |

#### 4.2.3 Performance

| ID | Yêu cầu |
|----|---------|
| REQ-P01 | Phản hồi API cho CRUD: < 200ms (p95). |
| REQ-P02 | Chấm tự động L/R: < 500ms. |
| REQ-P03 | Chấm điểm AI Writing: thường < 5 phút, timeout 20 phút. |
| REQ-P04 | Chấm điểm AI Speaking: thường < 10 phút, timeout 60 phút. |
| REQ-P05 | Số người dùng đồng thời: ≥ 100 học viên. |

#### 4.2.4 Security

| ID | Yêu cầu |
|----|---------|
| REQ-S01 | Mật khẩu mã hóa Argon2id — không lưu văn bản rõ. |
| REQ-S02 | Refresh token lưu dạng hash SHA-256. |
| REQ-S03 | JWT access token thời hạn ngắn, refresh token hỗ trợ rotation. |
| REQ-S04 | Tối đa 3 refresh token hoạt động mỗi người dùng. |
| REQ-S05 | RBAC trên tất cả API endpoint (learner/instructor/admin). |
| REQ-S06 | Không có secret trong mã nguồn hoặc log. |

---

## 5. Requirement Appendix

### 5.1 Business Rules

| ID | Quy tắc |
|----|--------|
| BR-01 | Điểm Listening/Reading = (số câu đúng / tổng) × 10, làm tròn tới 0.5. |
| BR-02 | Điểm Writing = trung bình 4 tiêu chí, làm tròn tới 0.5. Trong bài thi: task1 × 1/3 + task2 × 2/3. |
| BR-03 | Điểm Speaking = trung bình 4 tiêu chí, làm tròn tới 0.5. |
| BR-04 | Điểm tổng bài thi = trung bình 4 kỹ năng, làm tròn tới 0.5. |
| BR-05 | Band: 8.5–10.0 → C1, 6.0–8.4 → B2, 4.0–5.9 → B1, <4.0 → không chứng chỉ. |
| BR-06 | Band tổng thể = min(band 4 kỹ năng). |
| BR-07 | Submission state machine: pending → processing → completed/review_pending/failed. |
| BR-08 | Confidence routing: high → completed, medium/low → review_pending. |
| BR-09 | Điểm instructor luôn là cuối cùng, ghi đè điểm AI. |
| BR-10 | Sliding window: N=10 bài gần nhất mỗi kỹ năng. Tối thiểu 3 để tính xu hướng. |
| BR-11 | Xuống cấp scaffolding: 2 lần liên tiếp dưới ngưỡng. |
| BR-12 | Tối đa 3 refresh token/người dùng (FIFO). |
| BR-13 | Tái sử dụng refresh token → thu hồi toàn bộ, buộc đăng nhập lại. |
| BR-14 | Tự động lưu phiên thi không ghi đè khi đã nộp. |
| BR-15 | Claim đánh giá: timeout 15 phút. |
| BR-16 | ETA trả về null khi: slope ≤ 0, < 3 lần thử, hoặc > 52 tuần. |
| BR-17 | Tất cả điểm: numeric(3,1), phạm vi 0.0–10.0, bước 0.5. |

### 5.2 Common Requirements

| ID | Yêu cầu |
|----|---------|
| CR-01 | Tất cả API endpoint dưới tiền tố `/api` (ngoại trừ `GET /health`). |
| CR-02 | Response JSON (UTF-8), timestamp ISO 8601 UTC. |
| CR-03 | Phân trang offset: `page` (≥ 1), `limit` (1–100, mặc định 20). |
| CR-04 | Response danh sách: `{ data, meta: { page, limit, total, totalPages } }`. |
| CR-05 | Response lỗi: `{ error: { code, message, requestId } }`. |
| CR-06 | Header `X-Request-Id` trên tất cả response. |
| CR-07 | Xác thực: `Authorization: Bearer <jwt>`. |
| CR-08 | Health check: `GET /health` → `{ status: "ok", services: { db, redis } }`. |
| CR-09 | OpenAPI spec tự động tại `GET /openapi.json`. |

### 5.3 Application Messages List

| # | Code | Loại | Nội dung |
|---|------|------|---------|
| 1 | MSG-01 | Inline | Không tìm thấy kết quả. |
| 2 | MSG-02 | Inline (error) | Trường {field} là bắt buộc. |
| 3 | MSG-03 | Toast | Đăng nhập thành công. |
| 4 | MSG-04 | Toast | Đăng ký thành công. Vui lòng đăng nhập. |
| 5 | MSG-05 | Toast | Bài làm đã được gửi. Đang chấm điểm... |
| 6 | MSG-06 | Toast | Kết quả chấm điểm đã sẵn sàng. |
| 7 | MSG-07 | Toast | Đã gửi kết quả chấm bài thành công. |
| 8 | MSG-08 | Inline (error) | Vượt quá độ dài tối đa {max_length} ký tự. |
| 9 | MSG-09 | Inline | Sai email hoặc mật khẩu. Vui lòng thử lại. |
| 10 | MSG-10 | Toast | Đã thiết lập mục tiêu học tập. |
| 11 | MSG-11 | Toast | Chúc mừng! Bạn đã đạt mục tiêu {targetBand}. |
| 12 | MSG-12 | Notification | Chấm điểm thất bại. Vui lòng thử lại sau. |
| 13 | MSG-13 | Toast | Bài thi đã được nộp. Đang chấm điểm... |
| 14 | MSG-14 | Toast | Kết quả bài thi đã sẵn sàng. |
| 15 | MSG-15 | Notification | Bài làm đang chờ giảng viên chấm. |
| 16 | MSG-16 | Inline | Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại. |
| 17 | MSG-17 | Confirm | Bạn có muốn nhận chấm bài này không? |
| 18 | MSG-18 | Toast | Đã nhận bài chấm. Bạn có 15 phút để hoàn thành. |
| 19 | MSG-19 | Inline (error) | Bài này đã được giảng viên khác nhận chấm. |
| 20 | MSG-20 | Toast | Bạn đã lên cấp hỗ trợ! Tiếp tục phát huy nhé. |
| 21 | MSG-21 | Toast | Đã tự động lưu bài thi. |
| 22 | MSG-22 | Warning | Còn {minutes} phút để hoàn thành bài thi. |
| 23 | MSG-23 | Inline (error) | Bài viết cần tối thiểu {minWords} từ. Hiện tại: {currentWords} từ. |
| 24 | MSG-24 | Toast | Mật khẩu đã được đặt lại thành công. |
| 25 | MSG-25 | Confirm | Bạn đã đăng nhập trên 3 thiết bị. Thiết bị cũ nhất sẽ bị đăng xuất. Tiếp tục? |

### 5.4 Definitions & Abbreviations

| Thuật ngữ | Định nghĩa |
|----------|----------|
| Adaptive Scaffolding | Hỗ trợ điều chỉnh mức độ theo năng lực người học |
| Band | Phân loại trình độ: A1, A2, B1, B2, C1 |
| Hybrid Grading | Chấm điểm kết hợp AI và instructor |
| Sliding Window | Trung bình N bài gần nhất (N=10) |
| Spider Chart | Biểu đồ radar 4 kỹ năng |
| Scaffold Level | Mức hỗ trợ: 1=Full, 2=Partial, 3=None |
| Confidence | Độ tin cậy AI: high, medium, low |

| Viết tắt | Đầy đủ |
|----------|---------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CEFR | Common European Framework of Reference for Languages |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| MCQ | Multiple Choice Question |
| MVP | Minimum Viable Product |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| SRS | Software Requirements Specification |
| STT | Speech-to-Text |
| VSTEP | Vietnamese Standardized Test of English Proficiency |

---

*Phiên bản tài liệu: 2.0 — Cập nhật lần cuối: SP26SE145*