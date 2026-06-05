# 03. Speaker notes cho slide bảo vệ

Nguyên tắc: mỗi slide chỉ làm **một nhiệm vụ**. Không kéo nội dung kỹ thuật vào slide vấn đề, không demo trong slide workflow, không giải thích công thức ở slide công nghệ.

## Slide 1 — Title

Kính chào hội đồng. Nhóm em xin trình bày đề tài hệ thống hỗ trợ luyện thi VSTEP.

Trọng tâm của hệ thống là hỗ trợ người học luyện 4 kỹ năng, nhận phản hồi sau bài luyện tập, theo dõi tiến độ và nhận gợi ý nội dung học tiếp theo.

## Slide 2 — Outline

Phần trình bày của nhóm gồm các phần chính: bối cảnh, vấn đề, nhóm người dùng, tính năng chính, kiến trúc và công nghệ, cơ chế tính điểm luyện tập, demo workflow, điểm khác biệt, kết quả đạt được, hạn chế và kết luận.

Do thời gian có hạn, nhóm em xin phép trình bày ngắn gọn phần slide và dành trọng tâm cho demo sản phẩm.

## Slide 3 — Team

Đây là thông tin nhóm thực hiện đề tài.

Trong quá trình phát triển, nhóm chia công việc theo các mảng chính: backend/API và assessment, learner web/admin, mobile app, kiểm thử và tài liệu. Việc chia theo mảng giúp nhóm phát triển được cả sản phẩm, phần quản trị và tài liệu bảo vệ.

## Slide 4 — VSTEP Context

Slide này dùng để đặt bối cảnh.

VSTEP là chứng chỉ tiếng Anh được dùng khá phổ biến, ví dụ đầu vào cao học, đầu ra đại học/cao đẳng hoặc yêu cầu chứng chỉ năng lực tiếng Anh.

Bài thi gồm 4 kỹ năng: Listening, Reading, Writing và Speaking. Listening/Reading có đáp án khách quan; Writing/Speaking cần đánh giá theo nhiều tiêu chí. Vì vậy người học cần luyện tập có định hướng cho đủ 4 kỹ năng.

## Slide 5 — Problems

Slide này nêu vấn đề chính.

Hiện nay không thiếu tài liệu luyện thi: có trung tâm, group Facebook, file Word, ghi chú và đề luyện được chia sẻ rất nhiều.

Nhưng phần lớn vẫn là luyện đề rời rạc. Người học làm xong khó biết mình yếu ở đâu, đặc biệt với Writing và Speaking vì thiếu phản hồi chi tiết.

## Slide 6 — Problem Analysis

Slide này phân tích khoảng trống từ vấn đề trên.

Các tài liệu hoặc website luyện đề có ích, nhưng thường chỉ dừng ở việc cung cấp đề và đáp án. Chúng chưa tạo thành một quá trình học liên tục.

Khoảng trống nhóm hướng tới là một hệ thống học tập có vòng lặp rõ ràng: làm bài, nhận feedback, xem điểm yếu, nhận gợi ý và luyện tiếp. Các yếu tố như game hóa, tích điểm, lộ trình và gợi ý theo điểm yếu hỗ trợ cho vòng học này.

## Slide 7 — Actors

Slide này xác định các nhóm người dùng, chưa đi vào chi tiết tính năng.

Learner là người dùng chính. Admin/staff vận hành nội dung và dữ liệu. Teacher hỗ trợ lịch học, booking và các nghiệp vụ lớp học. Mobile learner dùng ứng dụng mobile như một kênh học bổ sung.

Các dịch vụ AI/speech không phải actor nghiệp vụ chính; chúng là dịch vụ hỗ trợ kỹ thuật ở phía sau.

## Slide 8 — Main Features — Learner

Slide này chỉ nói tính năng cho learner.

Learner có thể luyện tập, làm mock test, xem kết quả, nhận feedback, xem điểm yếu và học tiếp theo gợi ý.

Ngoài ra có dashboard, progress, streak/coin và ôn từ vựng. Điểm chính là learner có một learning loop, không chỉ làm bài đơn lẻ.

## Slide 9 — Main Features — Admin / Staff

Slide này nói tính năng vận hành.

Admin/staff quản lý nội dung học, đề luyện, đề thi thử, tiêu chí đánh giá, user, course và booking.

Vai trò của phần admin là giúp hệ thống cập nhật và vận hành được qua giao diện quản trị, thay vì phụ thuộc vào chỉnh sửa thủ công trong code.

## Slide 10 — Main Features — Teacher / Mobile

Slide này nói ngắn về hai phần không phải trọng tâm demo chính.

Teacher hỗ trợ lịch dạy, booking và đơn nghỉ. Mobile app là ứng dụng đồng hành để learner theo dõi tiến độ, luyện tập và ôn từ vựng thuận tiện hơn.

Nhóm sẽ không đi sâu hai phần này trên slide để dành thời gian cho learner web, scoring và admin.

## Slide 11 — System Architecture

Slide này chuyển từ tính năng sang kiến trúc hệ thống.

Kiến trúc gồm client, backend và hạ tầng dữ liệu/xử lý. Web, mobile và admin gọi về Laravel Backend API. Backend kết nối PostgreSQL để lưu dữ liệu, Redis/Horizon để xử lý tác vụ nền và storage để lưu file/audio.

Với Speaking, audio được ghi ở client, lưu lại, đưa vào job xử lý nền, rồi speech service hỗ trợ transcript hoặc tín hiệu phát âm. Backend là nơi điều phối và dùng các tín hiệu này cho công thức tính điểm luyện tập.

## Slide 12 — Technology

Slide này chỉ liệt kê công nghệ theo vai trò.

Backend dùng Laravel/PHP. Database dùng PostgreSQL. Queue dùng Redis/Horizon. Web và admin dùng React. Mobile dùng Expo/React Native. Storage dùng S3-compatible/R2. Triển khai dùng Docker và GitHub Actions.

Riêng phần Speaking có thêm Web Speech API hoặc Azure Speech để hỗ trợ transcript và tín hiệu phát âm. Các công nghệ này hỗ trợ lấy tín hiệu, không chấm điểm thay backend.

## Slide 13 — Deployment & Quality

Slide này nói về triển khai và chất lượng, không nói lại tech stack.

Docker giúp đóng gói môi trường. GitHub Actions hỗ trợ build/test tự động. Redis queue giúp xử lý tác vụ nền để người dùng không phải chờ trực tiếp.

Khi kiểm thử, các dịch vụ ngoài như AI hoặc speech service có thể được cô lập để kiểm tra logic chính của hệ thống.

## Slide 14 — Writing/Speaking Score Formula

Slide này là trọng tâm về công thức điểm.

Nhóm không để AI tự chấm điểm. AI hoặc công cụ ngoài chỉ lấy tham số đầu vào như word count, spelling errors, transcript, pause count, pronunciation signals và topic relevance.

Backend đưa các chỉ số đó vào công thức định lượng cố định để tính điểm Writing/Speaking trong practice và mock test. Trên slide cần có bảng: **Input metric / Extracted by / Used for**.

Câu chốt: **Writing/Speaking score = fixed formula(input metrics) + caps / penalties**.

## Slide 15 — Writing Practice Evaluation

Slide này là ví dụ áp dụng công thức cho Writing.

Với Writing, hệ thống lấy các chỉ số như số từ, lỗi chính tả, mức độ bám đề, tổ chức bài, ngữ pháp và từ vựng.

Backend dùng các chỉ số này để tính điểm Writing trong hệ thống và tạo feedback. Mục tiêu là giúp learner biết bài viết yếu ở đâu, không thay thế giám khảo chính thức.

## Slide 16 — Speaking Practice Evaluation

Slide này là ví dụ áp dụng công thức cho Speaking.

Với Speaking, hệ thống xử lý audio và transcript. Các tín hiệu gồm tốc độ nói, số lần ngập ngừng, transcript, phát âm và mức độ bám đề.

Backend tổng hợp các tín hiệu này bằng công thức để ra điểm Speaking trong hệ thống. Không nói Azure/Web Speech chấm điểm; chúng chỉ hỗ trợ lấy tín hiệu.

## Slide 17 — Abnormal Answer Handling

Slide này nói cơ chế bảo vệ kết quả đánh giá.

Nếu bài quá ngắn, lạc đề, copy đề, spam hoặc không dùng tiếng Anh, hệ thống sẽ giới hạn điểm hoặc áp dụng điểm trừ.

Điểm cần nhấn mạnh: công thức không chỉ lấy trung bình đơn giản; hệ thống có cap/penalty để tránh bài không hợp lệ vẫn đạt điểm cao.

## Slide 18 — Demo Overview

Slide này chỉ giới thiệu phần demo, chưa demo ngay.

Nhóm sẽ demo ba luồng: learner practice, mock test/result và admin management.

Mục tiêu là để hội đồng nắm trước thứ tự thao tác trước khi nhóm chuyển sang sản phẩm thật.

## Slide 19 — Demo Workflow 1 — Learner Practice

Slide này mô tả luồng demo thứ nhất.

Learner đăng nhập, vào practice hub, chọn kỹ năng, làm bài và xem feedback.

Khi demo thật, nhóm sẽ cho thấy màn hình practice và feedback sau bài luyện tập.

## Slide 20 — Demo Workflow 2 — Mock Test & Result

Slide này mô tả luồng demo thứ hai.

Learner làm mock test 4 kỹ năng, submit bài và xem kết quả.

Trọng tâm demo là điểm thành phần, feedback và skill gaps, để thấy hệ thống hỗ trợ người học sau khi làm bài.

## Slide 21 — Demo Workflow 3 — Admin Management

Slide này mô tả luồng demo thứ ba.

Admin quản lý nội dung, đề, tiêu chí đánh giá, user, course hoặc booking.

Ba slide vừa rồi là kịch bản demo. Sau đây nhóm em xin chuyển sang demo trực tiếp trên sản phẩm.

## Slide 22 — Different Points

Slide này tổng hợp điểm khác biệt sau khi đã nói xong demo workflow.

Điểm khác biệt là hệ thống tạo vòng học hoàn chỉnh hơn: luyện tập, nhận feedback, xem điểm yếu, nhận gợi ý và tiếp tục học.

Ngoài ra có game hóa/tích điểm, lộ trình học, ôn từ vựng theo chu kỳ và admin quản lý nội dung. Phần Anki/Spaced Repetition chỉ nói ngắn; nếu hội đồng hỏi sâu thì trả lời ở Q&A.

## Slide 23 — Achievements

Slide này nêu kết quả thực hiện, không mở thêm tính năng mới.

Kết quả gồm backend, learner web, mobile app, admin portal, module hỗ trợ đánh giá bài luyện tập, tài liệu kiểm thử, tài liệu hướng dẫn, báo cáo và mã nguồn.

Nhóm đã hoàn thành core learning flow từ luyện tập/thi thử đến feedback và theo dõi tiến độ.

## Slide 24 — Limitations

Slide này nói thẳng hạn chế.

Điểm Writing/Speaking hiện dùng cho luyện tập và tham khảo, chưa thay thế giám khảo chính thức.

Hệ thống cần thêm bộ dữ liệu lớn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác. Chất lượng tín hiệu từ audio/speech service cũng có thể ảnh hưởng đến kết quả.

## Slide 25 — Conclusion

Slide này kết luận, không thêm nội dung mới.

Tóm lại, hệ thống hỗ trợ luyện thi VSTEP theo hướng có cấu trúc hơn: luyện 4 kỹ năng, thi thử, feedback, điểm Writing/Speaking theo công thức, lộ trình học và progress tracking.

Hướng phát triển tiếp theo là mở rộng dữ liệu đánh giá, cải thiện adaptive learning và cá nhân hóa sâu hơn.

## Slide 26 — Thank You

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
