# 03. Speaker notes cho slide bảo vệ

Ghi chú này bám theo flow defense mới: **Context → Problems → Actors → Main Features by Actors → System Architecture → Technology → Workflow Overview 1/2 → Differentiation → Achievements → Limitations → Conclusion → Thank You**.

## Slide 1 — An Adaptive VSTEP Preparation System

Kính chào hội đồng. Nhóm em xin trình bày đề tài **An Adaptive VSTEP Preparation System** — hệ thống hỗ trợ luyện thi VSTEP.

Trọng tâm của hệ thống là hỗ trợ người học luyện 4 kỹ năng, nhận phản hồi sau bài luyện tập, theo dõi tiến độ và nhận gợi ý nội dung học tiếp theo.

Do thời gian trình bày có giới hạn, nhóm em xin tập trung vào bối cảnh vấn đề, nhóm người dùng, tính năng chính, kiến trúc hệ thống, công nghệ, hai workflow vận hành chính và cuối cùng là điểm khác biệt, kết quả đạt được, hạn chế và hướng phát triển.

## Slide 2 — VSTEP Context

VSTEP là kỳ thi đánh giá năng lực tiếng Anh được sử dụng trong học tập, chứng chỉ và một số yêu cầu nghề nghiệp tại Việt Nam.

Bài thi đánh giá 4 kỹ năng gồm Listening, Reading, Writing và Speaking. Vì vậy, người học không chỉ cần luyện đề, mà còn cần biết mình đang yếu ở kỹ năng nào và nên luyện phần nào tiếp theo.

## Slide 3 — Problems

Từ bối cảnh đó, nhóm nhận thấy ba vấn đề chính.

Thứ nhất, người học khó tự xác định điểm yếu cụ thể. Thứ hai, nhiều nền tảng luyện thi chấm tốt Listening và Reading nhưng Writing và Speaking thường thiếu phản hồi chi tiết. Thứ ba, việc luyện tập còn rời rạc, chưa tạo thành vòng học liên tục từ làm bài, xem kết quả, nhận feedback đến luyện tiếp.

## Slide 4 — Problem Analysis

Các giải pháp hiện tại đều có ưu điểm riêng. Trung tâm luyện thi có giáo viên hỗ trợ nhưng khó cá nhân hóa liên tục cho từng người học. Website mock test có đề luyện nhưng thường thiếu đánh giá chi tiết cho Writing và Speaking. App tiếng Anh tổng quát dễ dùng nhưng không nhất thiết bám sát format VSTEP.

Vì vậy, khoảng trống nhóm tập trung xử lý là một hệ thống luyện tập bám VSTEP, có phản hồi và theo dõi tiến độ rõ ràng hơn.

## Slide 5 — Actors

Hệ thống có các actor chính.

Learner là người dùng trung tâm, sử dụng hệ thống để luyện tập, làm thi thử và xem tiến độ. Admin hoặc staff quản lý nội dung, đề thi, tiêu chí đánh giá và dữ liệu vận hành. Teacher hỗ trợ các luồng liên quan đến lịch dạy và booking. Mobile learner sử dụng ứng dụng mobile như companion app. Ngoài ra còn có các dịch vụ AI hoặc speech bên ngoài, nhưng chỉ đóng vai trò hỗ trợ lấy tín hiệu.

## Slide 6 — Main Features — Learner

Với learner, các tính năng chính gồm luyện tập và thi thử 4 kỹ năng, nhận feedback cho bài luyện tập, xem điểm thành phần, skill gaps và gợi ý học tiếp.

Ngoài ra, người học có thể theo dõi tiến độ, ôn từ vựng và xem quá trình cải thiện của mình. Đây là core learning flow của hệ thống.

## Slide 7 — Main Features — Admin / Staff

Với admin và staff, hệ thống cung cấp các chức năng quản lý nội dung học, đề luyện hoặc đề thi thử, phiên bản đề và các tiêu chí đánh giá cho Writing/Speaking practice.

Admin cũng quản lý user, khóa học, enrollment và booking. Nhờ đó hệ thống không chỉ có phần learner, mà còn có phần vận hành nội dung và dữ liệu phía sau.

## Slide 8 — Main Features — Teacher / Mobile

Với teacher, hệ thống hỗ trợ xem lịch dạy, workflow liên quan đến lớp học, booking và đơn nghỉ. Phần này giúp mở rộng hệ sinh thái học tập ngoài luồng learner tự luyện.

Với mobile learner, ứng dụng mobile đóng vai trò companion app, hỗ trợ người học theo dõi tiến độ, luyện tập hoặc ôn từ vựng thuận tiện hơn. Trong phần demo chính, nhóm sẽ tập trung nhiều hơn vào learner web và admin.

## Slide 9 — System Architecture

Về kiến trúc, người dùng truy cập qua web app, mobile app hoặc admin panel. Các client này gọi đến Laravel API.

Backend API xử lý nghiệp vụ chính, quản lý bài luyện tập, kết quả, recommendation và phần đánh giá bài luyện tập. PostgreSQL lưu dữ liệu chính như user, content, attempts và results. Redis queue hỗ trợ các tác vụ nền, đặc biệt là các tác vụ có thể mất thời gian như xử lý Writing hoặc Speaking. Storage dùng cho file hoặc audio.

Các dịch vụ AI/speech bên ngoài chỉ hỗ trợ lấy tín hiệu, không quyết định điểm cuối.

## Slide 10 — Technology

Về công nghệ, backend sử dụng Laravel, cơ sở dữ liệu là PostgreSQL, Redis dùng cho queue và cache. Phía web và admin sử dụng React. Mobile sử dụng Expo hoặc React Native.

Hệ thống cũng hỗ trợ Docker và GitHub Actions để phục vụ triển khai và tự động hóa quy trình build/test.

## Slide 11 — Technology — Deployment & Quality

Về triển khai và chất lượng, hệ thống hỗ trợ Docker deployment và CI/CD qua GitHub Actions. Redis queue giúp xử lý các tác vụ nền thay vì bắt người dùng chờ trực tiếp.

Trong kiểm thử, các external services như AI hoặc speech service được cô lập bằng test doubles khi cần, để nhóm kiểm tra logic chính của hệ thống mà không phụ thuộc hoàn toàn vào dịch vụ bên ngoài.

## Slide 12 — Practice Evaluation Principle

Đây là nguyên tắc quan trọng nhất khi nói về phần đánh giá.

Hệ thống không hỏi AI rằng “bài này được mấy điểm”. AI hoặc công cụ ngoài chỉ hỗ trợ lấy tín hiệu, ví dụ transcript, lỗi ngữ pháp, tín hiệu từ vựng hoặc tín hiệu phát âm.

Điểm luyện tập do backend tính dựa trên tiêu chí, tín hiệu, công thức, giới hạn điểm và điểm trừ trong hệ thống. Vì vậy, kết quả Writing và Speaking được dùng như điểm luyện tập hoặc điểm tham khảo cho mock test, không phải điểm chính thức thay thế giám khảo.

## Slide 13 — Writing Practice Evaluation

Với Writing, hệ thống đánh giá bài luyện tập theo bốn nhóm tiêu chí: mức độ đáp ứng đề, tổ chức bài, ngữ pháp và từ vựng.

Ví dụ, hệ thống xét bài có bám đề không, có phát triển ý không, cách chia đoạn và liên kết ý như thế nào, lỗi ngữ pháp ra sao và từ vựng có phù hợp không. Sau đó backend tổng hợp các tiêu chí này để đưa ra điểm luyện tập và feedback.

## Slide 14 — Speaking Practice Evaluation

Với Speaking, hệ thống đánh giá theo các nhóm tiêu chí như ngữ pháp, từ vựng, độ trôi chảy, phát triển ý và phát âm.

Transcript hỗ trợ phân tích nội dung, ngữ pháp và từ vựng. Audio metrics hỗ trợ đánh giá tốc độ nói, ngập ngừng và phát âm. Điểm Speaking vì vậy là kết quả tổng hợp từ nhiều tín hiệu, không phải do một dịch vụ bên ngoài tự quyết định.

## Slide 15 — Abnormal Answer Handling

Hệ thống có cơ chế xử lý bài bất thường.

Nếu bài quá ngắn, lạc đề, copy lại đề, spam nội dung hoặc không dùng tiếng Anh, hệ thống sẽ giới hạn điểm hoặc áp dụng điểm trừ. Mục tiêu là tránh trường hợp bài không hợp lệ nhưng vẫn được điểm cao chỉ vì một vài tín hiệu riêng lẻ tốt.

## Slide 25 — Workflow Overview — Learner & Teacher

Ở phần workflow, nhóm em không tách thành nhiều màn hình nhỏ, mà gom theo actor để hội đồng thấy được hệ thống vận hành end-to-end như thế nào.

Slide này mô tả hai nhóm liên quan trực tiếp đến quá trình học: learner và teacher.

Với learner, hệ thống có ba nhánh chính. Nhánh thứ nhất là practice: người học chọn kỹ năng, luyện Grammar, Vocabulary hoặc 4 kỹ năng, sau đó hệ thống ghi nhận assessment và trả feedback. Đây là vòng luyện tập ngắn, mục tiêu là giúp người học biết mình đang yếu ở đâu.

Nhánh thứ hai là mock exam: người học chọn đề, hệ thống kiểm tra coin, nếu thiếu thì cho nạp thêm, sau đó người học làm bài, nộp bài và xem kết quả. Listening và Reading có thể có kết quả gần như tức thì; Writing và Speaking cần xử lý/chấm sau vì có phần tự luận hoặc audio.

Nhánh thứ ba là courses: người học chọn khóa học, enroll và thanh toán, sau đó có thể đặt lịch học 1-1, xác nhận lịch và xem booking details. Nếu người học đã enroll rồi thì hệ thống bỏ qua bước thanh toán để tránh tạo đơn trùng.

Phía dưới là teacher workflow. Teacher đăng nhập, vào dashboard và quản lý các task liên quan đến vận hành khóa học như schedule, booking, leave request và grading Writing/Speaking. Như vậy slide này cho thấy learner không chỉ tự luyện, mà còn có thể đi tiếp sang luồng khóa học có teacher hỗ trợ.

Câu chốt slide này: workflow learner là core learning flow, còn teacher workflow là lớp hỗ trợ để hệ thống vận hành được trong bối cảnh có khóa học và lịch học thật.

## Slide 26 — Workflow Overview — Staffs & Admin

Slide tiếp theo mô tả nhóm vận hành hệ thống: staff và admin.

Với staff, sau khi đăng nhập và vào dashboard, staff chọn module nghiệp vụ cần quản lý. Các module chính gồm content, exams, practice, courses và leave. Staff chịu trách nhiệm cập nhật nội dung, đề, bài luyện tập, khóa học và các yêu cầu vận hành hằng ngày. Sau khi chỉnh sửa, hệ thống lưu lại và publish hoặc update dữ liệu để learner có thể sử dụng.

Với admin, workflow bắt đầu tương tự từ login và dashboard, nhưng phạm vi quản lý rộng hơn. Admin chọn module quản trị như users, rubrics, top-up, promo và settings. Đây là các phần ảnh hưởng đến hệ thống và business rule: tài khoản người dùng, tiêu chí đánh giá, gói nạp xu, mã khuyến mãi và cấu hình hệ thống.

Điểm cần nhấn mạnh là nhóm tách staff và admin để phân quyền theo trách nhiệm. Staff tập trung vào content and operations, còn admin quản lý system and business. Cách tách này giúp hệ thống dễ vận hành hơn và tránh việc mọi người đều có quyền thay đổi cấu hình quan trọng.

Câu chốt slide này: hai workflow phía sau bảo đảm rằng nội dung, đề thi, rubric, thanh toán và cấu hình không phải chỉnh trực tiếp trong code, mà có thể được quản lý qua giao diện theo quyền phù hợp.

## Slide 27 — Differentiation

Điểm khác biệt của hệ thống là tạo thành một vòng học tương đối đầy đủ cho 4 kỹ năng.

Người học có thể luyện tập, làm thi thử, xem feedback theo tiêu chí, nhận gợi ý dựa trên skill gap và ôn từ vựng theo chu kỳ. Ngoài ra, hệ thống có phần admin để quản lý nội dung và tiêu chí đánh giá, giúp việc vận hành rõ ràng hơn.

## Slide 28 — Achievements

Kết quả thực hiện của nhóm gồm hệ thống backend, giao diện web cho người học, ứng dụng mobile, trang quản trị, module hỗ trợ đánh giá bài luyện tập, tài liệu kiểm thử, tài liệu cài đặt và hướng dẫn sử dụng, báo cáo cuối cùng và mã nguồn.

Các thành phần này thể hiện nhóm không chỉ xây dựng giao diện, mà còn triển khai backend, quản trị, kiểm thử và tài liệu đi kèm.

## Slide 29 — Limitations

Hạn chế hiện tại là phần đánh giá Writing và Speaking mới phục vụ mục tiêu luyện tập và tham khảo, chưa thay thế giám khảo chính thức.

Ngoài ra, hệ thống cần thêm bộ dữ liệu lớn hơn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác. Một số hướng như adaptive difficulty động hoặc cá nhân hóa sâu hơn vẫn nằm trong phạm vi phát triển tương lai. Chất lượng tín hiệu từ dịch vụ AI/speech bên ngoài cũng có thể ảnh hưởng đến kết quả phân tích.

## Slide 30 — Conclusion

Tóm lại, nhóm đã xây dựng hệ thống hỗ trợ luyện thi VSTEP với các chức năng chính: luyện 4 kỹ năng, thi thử, feedback, đánh giá bài luyện tập theo tiêu chí, learning path và progress tracking.

Trong tương lai, hệ thống có thể mở rộng theo hướng điều chỉnh độ khó linh hoạt, kiểm chứng trên bộ dữ liệu lớn hơn có điểm từ giám khảo chính thức và cá nhân hóa sâu hơn cho từng người học.

## Slide 31 — Thank You

Nhóm em xin cảm ơn hội đồng đã lắng nghe.

Nhóm em sẵn sàng trả lời các câu hỏi của hội đồng.

## Câu cần nhớ khi bị hỏi về AI hoặc điểm Writing/Speaking

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ hỗ trợ lấy tín hiệu và feedback. Điểm luyện tập do backend tính từ các tiêu chí, tín hiệu và công thức trong hệ thống. Điểm Writing/Speaking là điểm luyện tập/tham khảo, không thay thế giám khảo chính thức.
```

## Câu chuyển nếu cần lướt nhanh

```text
Phần này là module hỗ trợ nên nhóm em xin phép lướt nhanh. Nếu hội đồng quan tâm, nhóm em sẽ trình bày kỹ hơn ở phần Q&A.
```
