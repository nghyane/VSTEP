# 05. Kịch bản demo web

## Nguyên tắc demo

- Demo chính trên web app.
- Mobile chỉ nhắc ở mức sample/module, không demo sâu.
- Không nói sâu payment.
- Tập trung vào assessment, mock test, learning path và dashboard.

## Flow demo đề xuất

### 1. Login learner

Mục tiêu:

- Cho thấy learner có tài khoản và profile.

Nói:

> Đây là giao diện learner. Người học có thể đăng nhập, luyện tập, làm mock test và xem tiến độ cá nhân.

### 2. Practice / Mock Test

Mục tiêu:

- Cho thấy hệ thống hỗ trợ VSTEP 4 kỹ năng.

Nói:

> Listening và Reading là objective skills nên hệ thống chấm tự động theo đáp án. Writing và Speaking là productive skills nên hệ thống dùng assessment engine để phân tích bài làm và trả feedback.

### 3. Writing assessment result

Mục tiêu:

- Cho thấy điểm không phải blackbox.

Nói:

> Với Writing, hệ thống dùng LanguageTool để phát hiện lỗi grammar/spelling, CEFR reference để phân tích từ vựng, syntax analyzer để nhận diện cấu trúc, và task evidence để đánh giá mức độ hoàn thành đề.

### 4. Speaking assessment result

Mục tiêu:

- Cho thấy transcript/audio được dùng để chấm.

Nói:

> Với Speaking, audio được chuyển thành transcript bằng Azure Speech. Hệ thống phân tích transcript, tốc độ nói, pause count, pronunciation signals và content relevance. Điểm phát âm không lấy trực tiếp từ Azure mà được tính lại bằng công thức minh bạch.

### 5. Progress dashboard

Mục tiêu:

- Cho thấy người học biết mình mạnh/yếu kỹ năng nào.

Nói:

> Dashboard giúp learner theo dõi tiến độ theo kỹ năng, xu hướng điểm và hoạt động học tập.

### 6. Learning path

Mục tiêu:

- Cho thấy personalization.

Nói:

> Learning path dựa trên điểm yếu theo kỹ năng từ practice/mock test. Hệ thống đề xuất kỹ năng cần luyện tiếp và hỗ trợ ôn từ vựng bằng phương pháp ôn tập ngắt quãng.

### 7. Admin / Instructor monitoring nếu có thời gian

Mục tiêu:

- Cho thấy hệ thống không chỉ dành cho learner.

Nói:

> Instructor/admin có thể theo dõi dữ liệu học tập và quản lý nội dung. Phần course/payment là supporting module nên nhóm không đi sâu trong buổi bảo vệ.

## Backup nếu demo live lỗi

Chuẩn bị trước:

- Screenshot assessment result.
- Screenshot dashboard.
- Screenshot learning path.
- Video demo ngắn nếu có.

Câu nói nếu live lỗi:

> Vì hệ thống có phụ thuộc external services như speech processing và grammar checking, nhóm có chuẩn bị screenshot/video của cùng flow để đảm bảo trình bày không bị gián đoạn.
