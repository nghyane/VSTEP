# 03. Speaker notes cho slide bảo vệ

Nguyên tắc: mỗi slide chỉ làm **một nhiệm vụ**. Slide 11–13 chỉ nói kiến trúc, công nghệ và công thức tổng quan. Chi tiết Writing/Speaking/guardrails để Q&A, không tách nhiều slide kỹ thuật trong main deck.

## Slide 1 — Title

Kính chào hội đồng. Nhóm em xin trình bày đề tài hệ thống hỗ trợ luyện thi VSTEP.

Trọng tâm của hệ thống là hỗ trợ người học luyện 4 kỹ năng, nhận phản hồi sau bài luyện tập/thi thử, theo dõi tiến độ và nhận gợi ý nội dung học tiếp theo.

## Slide 2 — Outline

Phần trình bày của nhóm gồm: bối cảnh, vấn đề, nhóm người dùng, tính năng chính, kiến trúc và công nghệ, công thức tính điểm Writing/Speaking, demo workflow, điểm khác biệt, kết quả đạt được, hạn chế và kết luận.

Do thời gian có hạn, nhóm em xin trình bày ngắn gọn phần slide và dành trọng tâm cho demo sản phẩm.

## Slide 3 — Team

Đây là thông tin nhóm thực hiện đề tài.

Trong quá trình phát triển, nhóm chia công việc theo các mảng chính: backend/API và assessment, learner web/admin, mobile app, kiểm thử và tài liệu.

## Slide 4 — VSTEP Context + Exam Format

VSTEP là chứng chỉ tiếng Anh được dùng khá phổ biến, ví dụ đầu vào cao học, đầu ra đại học/cao đẳng hoặc yêu cầu chứng chỉ năng lực tiếng Anh.

Bài thi gồm 4 kỹ năng: Listening, Reading, Writing và Speaking. Listening/Reading có đáp án khách quan; Writing/Speaking cần đánh giá theo nhiều tiêu chí. Slide này chỉ nói 2 ý chính trên; chi tiết công thức tính điểm sẽ nói ở slide công thức sau phần kiến trúc và công nghệ.

## Slide 5 — Problems

Vấn đề không phải là thiếu tài liệu luyện thi.

Hiện nay có nhiều trung tâm, group Facebook, file Word, ghi chú và đề luyện được chia sẻ rất nhiều. Nhưng phần lớn vẫn là luyện đề rời rạc. Người học làm xong khó biết mình yếu ở đâu, đặc biệt với Writing và Speaking vì thiếu phản hồi chi tiết.

## Slide 6 — Problem Analysis

Các tài liệu hoặc website luyện đề có ích, nhưng thường chỉ dừng ở việc cung cấp đề và đáp án.

Khoảng trống nhóm hướng tới là một hệ thống học tập có vòng lặp rõ ràng: làm bài, nhận feedback, xem điểm yếu, nhận gợi ý và luyện tiếp. Game hóa, tích điểm, lộ trình và gợi ý theo điểm yếu hỗ trợ cho vòng học này.

## Slide 7 — Actors

Hệ thống có các nhóm người dùng chính: learner, admin/staff, teacher và mobile learner.

Learner là người dùng chính. Admin/staff vận hành nội dung và dữ liệu. Teacher hỗ trợ lịch học, booking và nghiệp vụ lớp học. Mobile learner dùng ứng dụng mobile như một kênh học bổ sung.

AI/speech là dịch vụ hỗ trợ kỹ thuật phía sau, không phải actor nghiệp vụ chính.

## Slide 8 — Main Features — Learner

Learner có thể luyện tập, làm mock test, xem kết quả, nhận feedback, xem điểm yếu và học tiếp theo gợi ý.

Ngoài ra có dashboard, progress, streak/coin và ôn từ vựng. Điểm chính là learner có một learning loop, không chỉ làm bài đơn lẻ.

## Slide 9 — Main Features — Admin / Staff

Admin/staff quản lý nội dung học, đề luyện, đề thi thử, tiêu chí đánh giá, user, course và booking.

Vai trò của phần admin là giúp hệ thống cập nhật và vận hành được qua giao diện quản trị, thay vì phụ thuộc vào chỉnh sửa thủ công trong code.

## Slide 10 — Main Features — Teacher / Mobile

Teacher hỗ trợ lịch dạy, booking và đơn nghỉ.

Mobile app là ứng dụng đồng hành để learner theo dõi tiến độ, luyện tập và ôn từ vựng thuận tiện hơn.

Nhóm sẽ không đi sâu hai phần này để dành thời gian cho learner web, công thức tính điểm và admin.

## Slide 11 — System Architecture

Slide này chỉ nói kiến trúc tổng thể.

Web, mobile và admin gọi về Laravel Backend API. Backend kết nối PostgreSQL để lưu dữ liệu, Redis/Horizon để xử lý tác vụ nền và storage để lưu file/audio.

Với Speaking, audio được ghi ở client, lưu lại, đưa vào job xử lý nền, rồi speech service hỗ trợ transcript hoặc tín hiệu phát âm. Backend là nơi điều phối và dùng các tín hiệu này cho công thức tính điểm Speaking trong hệ thống.

## Slide 12 — Technology

Slide này chỉ liệt kê công nghệ theo vai trò.

Backend dùng Laravel/PHP. Database dùng PostgreSQL. Queue dùng Redis/Horizon. Web và admin dùng React. Mobile dùng Expo/React Native. Storage dùng S3-compatible/R2. Triển khai dùng Docker và GitHub Actions.

Riêng phần Speaking có Web Speech API hoặc Azure Speech để hỗ trợ transcript và tín hiệu phát âm. Các công nghệ này hỗ trợ lấy tín hiệu, không chấm điểm thay backend.

## Slide 13 — Writing/Speaking Assessment Formula

Đây là slide quan trọng nhất về điểm Writing/Speaking.

Nhóm không để AI tự chấm điểm. AI hoặc công cụ ngoài chỉ lấy chỉ số đầu vào như word count, spelling errors, transcript, pause count, pronunciation signals và topic relevance.

Backend đưa các chỉ số đó vào công thức định lượng cố định để tính điểm Writing/Speaking trong practice và mock test. Trên slide cần có bảng **Input metric / Extracted by / Used for**.

Câu chốt: **Writing/Speaking score = fixed formula(input metrics) + caps / penalties**.

Ví dụ ngắn trên slide: bài viết đủ độ dài, ít lỗi chính tả, bám đề → các chỉ số đưa vào công thức → kết quả 7.5. Ví dụ này chỉ để minh họa pipeline, không phải điểm chính thức.

Nếu hội đồng hỏi sâu về từng tiêu chí Writing/Speaking hoặc bài bất thường, nhóm trả lời ở phần Q&A.

## Slide 14 — Demo Overview

Slide này chỉ giới thiệu phần demo, chưa demo ngay.

Nhóm sẽ demo ba luồng: learner practice, mock test/result và admin management.

## Slide 15 — Demo Workflow 1 — Learner Practice

Luồng thứ nhất: learner đăng nhập, vào practice hub, chọn kỹ năng, làm bài và xem feedback.

Khi demo thật, nhóm sẽ cho thấy màn hình practice và feedback sau bài luyện tập.

## Slide 16 — Demo Workflow 2 — Mock Test & Result

Luồng thứ hai: learner làm mock test 4 kỹ năng, submit bài và xem kết quả.

Trọng tâm demo là điểm thành phần, feedback và skill gaps, để thấy hệ thống hỗ trợ người học sau khi làm bài.

## Slide 17 — Demo Workflow 3 — Admin Management

Luồng thứ ba: admin quản lý nội dung, đề, tiêu chí đánh giá, user, course hoặc booking.

Ba slide vừa rồi là kịch bản demo. Sau đây nhóm em xin chuyển sang demo trực tiếp trên sản phẩm.

## Slide 18 — Different Points

Điểm khác biệt so với giải pháp luyện đề thông thường là hệ thống của nhóm có ba điểm chính.

Thứ nhất, có cơ chế đánh giá và feedback cho Writing/Speaking, trong khi các website mock test thường chỉ chấm Listening/Reading. Thứ hai, điểm được tính bằng công thức định lượng cố định từ các chỉ số đầu vào, không phải AI tự cho điểm. Thứ ba, hệ thống tạo thành vòng học khép kín: làm bài, nhận feedback, xem điểm yếu, nhận gợi ý và luyện tiếp; các website khác thường chỉ là kho đề.

## Slide 19 — Achievements

Kết quả gồm backend, learner web, mobile app, admin portal, module hỗ trợ đánh giá Writing/Speaking, tài liệu kiểm thử, tài liệu hướng dẫn, báo cáo và mã nguồn.

Nhóm đã hoàn thành core learning flow từ luyện tập/thi thử đến feedback và theo dõi tiến độ.

## Slide 20 — Limitations

Điểm Writing/Speaking hiện dùng cho luyện tập và thi thử tham khảo, chưa thay thế giám khảo chính thức.

Hệ thống cần thêm bộ dữ liệu lớn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác. Chất lượng tín hiệu từ audio/speech service cũng có thể ảnh hưởng đến kết quả.

## Slide 21 — Conclusion

Tóm lại, hệ thống hỗ trợ luyện thi VSTEP theo hướng có cấu trúc hơn: luyện 4 kỹ năng, thi thử, feedback, điểm Writing/Speaking theo công thức, lộ trình học và progress tracking.

Hướng phát triển tiếp theo là mở rộng dữ liệu đánh giá, cải thiện adaptive learning và cá nhân hóa sâu hơn.

## Slide 22 — Thank You

Nhóm em xin cảm ơn hội đồng đã lắng nghe.

Nhóm em sẵn sàng trả lời câu hỏi.

## Câu bắt buộc khi bị hỏi về AI/scoring

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ lấy chỉ số đầu vào và hỗ trợ feedback. Điểm Writing/Speaking trong practice/mock test do backend tính bằng công thức định lượng cố định. Điểm này là điểm tham khảo, không thay thế giám khảo chính thức.
```

## Câu chuyển khi cần lướt nhanh

```text
Phần này nhóm em xin phép lướt nhanh để dành thời gian cho demo. Nếu hội đồng quan tâm, nhóm em sẽ trình bày kỹ hơn ở phần Q&A.
```
