# 03. Speaker notes cho slide bảo vệ

Ghi chú này bám theo flow defense mới: **Context → Problems → Actors → Main Features by Actors → System Architecture → Technology → Demo Workflow 1/2/3 → Different → Achievements → Limitation → Conclusion → Thank You**.

Chiến thuật trình bày theo chỉ đạo của thầy: slide nói gọn, tránh giải thích dông dài, dành nhiều thời gian cho demo. Phần công thức phải nói rõ AI không tự chấm điểm; AI/công cụ chỉ lấy tham số đầu vào, backend tính điểm luyện tập bằng công thức định lượng.

## Slide 1 — An Adaptive VSTEP Preparation System

Kính chào hội đồng. Nhóm em xin trình bày đề tài **An Adaptive VSTEP Preparation System** — hệ thống hỗ trợ luyện thi VSTEP.

Trọng tâm của hệ thống là hỗ trợ người học luyện 4 kỹ năng, nhận phản hồi sau bài luyện tập, theo dõi tiến độ và nhận gợi ý nội dung học tiếp theo.

Do thời gian trình bày có giới hạn, nhóm em xin phép lướt nhanh phần bối cảnh, công nghệ và thuật toán hỗ trợ để dành trọng tâm cho công thức tính điểm luyện tập và demo sản phẩm.

## Slide 2 — VSTEP Context

VSTEP là kỳ thi đánh giá năng lực tiếng Anh được sử dụng khá phổ biến tại Việt Nam, ví dụ như yêu cầu đầu vào cao học, đầu ra ở nhiều trường đại học/cao đẳng hoặc yêu cầu chứng chỉ năng lực tiếng Anh.

Bài thi đánh giá 4 kỹ năng gồm Listening, Reading, Writing và Speaking. Phần cấu trúc đề và cách tính điểm nhóm xin nói nhanh ở mức tổng quan: Listening/Reading có đáp án khách quan, còn Writing/Speaking cần đánh giá theo nhiều tiêu chí. Vì vậy, người học không chỉ cần luyện đề, mà còn cần biết mình yếu ở kỹ năng nào và nên luyện phần nào tiếp theo.

## Slide 3 — Problems

Từ bối cảnh đó, nhóm nhận thấy vấn đề chính không phải là thiếu tài liệu luyện thi.

Hiện nay có rất nhiều trung tâm, group Facebook, file Word, ghi chú và tài liệu chia sẻ đề luyện. Tuy nhiên, các tài liệu đó chủ yếu là công cụ luyện đề rời rạc. Người học vẫn khó biết mình yếu ở đâu, Writing/Speaking thường thiếu phản hồi chi tiết, và việc luyện tập chưa tạo thành một vòng học liên tục từ làm bài, xem kết quả, nhận feedback đến luyện tiếp.

## Slide 4 — Problem Analysis

Các giải pháp hiện tại đều có ưu điểm riêng. Trung tâm luyện thi có giáo viên hỗ trợ nhưng khó cá nhân hóa liên tục cho từng người học. Các group hoặc kho tài liệu giúp người học có nhiều đề luyện, nhưng vẫn chủ yếu là file và ghi chú. Website mock test có đề luyện nhưng thường thiếu đánh giá chi tiết cho Writing và Speaking. App tiếng Anh tổng quát dễ dùng nhưng không nhất thiết bám sát format VSTEP.

Vì vậy, khoảng trống nhóm tập trung xử lý là biến việc luyện đề thành một giải pháp học tập hoàn chỉnh hơn: có phản hồi, có game hóa/tích điểm, có lộ trình học, có gợi ý thích nghi theo điểm yếu và có theo dõi tiến độ rõ ràng.

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

Ở slide này, nhóm trình bày kiến trúc tổng thể của hệ thống. Người dùng truy cập qua web app, mobile app hoặc admin panel. Các client này gọi đến Laravel API.

Backend xử lý nghiệp vụ chính và kết nối với PostgreSQL để lưu dữ liệu, Redis queue để xử lý tác vụ nền và storage để lưu file hoặc audio.

Các dịch vụ AI hoặc speech bên ngoài chỉ đóng vai trò hỗ trợ lấy tín hiệu. Phần đánh giá bài luyện tập sẽ được trình bày riêng ở các slide sau.

## Slide 10 — Technology

Slide này tóm tắt công nghệ chính của hệ thống. Backend sử dụng Laravel, cơ sở dữ liệu là PostgreSQL, Redis dùng cho queue và cache. Phía web và admin sử dụng React, còn mobile sử dụng Expo hoặc React Native.

Nhóm chọn các công nghệ này vì phù hợp với mô hình web/mobile, có hệ sinh thái ổn định và hỗ trợ triển khai thực tế.

## Slide 11 — Technology — Deployment & Quality

Về triển khai và chất lượng, hệ thống hỗ trợ Docker để đóng gói môi trường và GitHub Actions để tự động hóa build/test. Redis queue giúp xử lý các tác vụ nền, đặc biệt là những tác vụ có thể mất thời gian.

Trong kiểm thử, các dịch vụ ngoài như AI hoặc speech service được cô lập khi cần, giúp nhóm kiểm tra logic chính mà không phụ thuộc hoàn toàn vào dịch vụ bên ngoài.

## Slide 12 — Practice Evaluation Principle

Đây là slide quan trọng nhất khi nói về phần đánh giá bài luyện tập, vì hội đồng có thể hỏi rất kỹ phần này.

Nhóm không để AI tự bốc ra điểm số. AI hoặc công cụ lập trình chỉ đóng vai trò lấy tham số đầu vào, ví dụ số từ, số lỗi chính tả, transcript, tốc độ nói, số lần ngập ngừng, tín hiệu phát âm hoặc mức độ bám đề.

Sau đó backend dùng công thức định lượng cố định để tính điểm luyện tập. Có thể hiểu quy trình là: bài làm hoặc audio → trích xuất chỉ số → đưa vào công thức → ra điểm luyện tập → AI chỉ hỗ trợ tạo feedback tổng quan ở bước sau. Vì vậy, kết quả Writing và Speaking là điểm luyện tập hoặc tham khảo, không thay thế giám khảo chính thức.

Trên slide chính, nhóm nên thể hiện bằng một bảng chỉ số ngắn, ví dụ: word count lấy từ text analyzer và dùng cho WordCountCap; spelling errors dùng cho SpellingPenalty; topic relevance dùng cho Relevance hoặc OffTopicPenalty; pause count dùng cho PausePenalty; pronunciation signals dùng cho PronunciationScore.

Dòng chốt nên đặt ngay dưới bảng là: **PracticeScore = Formula(parameters) + caps/penalties**. Như vậy hội đồng nhìn thấy hệ thống có công thức định lượng cố định, nhưng slide vẫn không bị quá tải bởi công thức dài.

## Slide 13 — Writing Practice Evaluation

Với Writing, hệ thống hỗ trợ đánh giá bài luyện tập theo các chỉ số định lượng và tiêu chí như số từ, lỗi chính tả, mức độ bám đề, tổ chức bài, ngữ pháp và từ vựng.

Ví dụ, công cụ có thể lấy các tham số như word count, spelling errors, topic relevance, organization signals, grammar evidence và vocabulary evidence. Backend không lấy điểm trực tiếp từ AI, mà đưa các tham số này vào công thức để ra điểm luyện tập. Mục tiêu là giúp learner biết bài viết đang yếu ở đâu để luyện tiếp.

## Slide 14 — Speaking Practice Evaluation

Với Speaking, hệ thống hỗ trợ phân tích bài nói dựa trên transcript và một số tín hiệu audio.

Transcript giúp xem nội dung, ngữ pháp và từ vựng. Audio metrics hỗ trợ lấy các tham số như tốc độ nói, số lần ngập ngừng, độ chính xác phát âm và mức độ đầy đủ của audio. Các tham số này được backend tổng hợp bằng công thức để ra điểm luyện tập, không phải điểm chấm chính thức.

## Slide 15 — Abnormal Answer Handling

Slide này trình bày cơ chế xử lý các bài bất thường.

Nếu bài quá ngắn, lạc đề, copy lại đề, spam hoặc không dùng tiếng Anh, hệ thống sẽ giới hạn điểm hoặc áp dụng điểm trừ. Mục tiêu là tránh trường hợp bài không hợp lệ nhưng vẫn đạt điểm cao do một vài tín hiệu riêng lẻ tốt.

## Slide 16 — Demo Overview

Phần demo của nhóm gồm ba workflow chính.

Workflow thứ nhất là learner practice, cho thấy người học luyện tập và nhận feedback. Workflow thứ hai là mock test và result, cho thấy người học làm bài thi thử và xem kết quả. Workflow thứ ba là admin management, cho thấy hệ thống có thể quản lý nội dung, đề và dữ liệu vận hành.

## Slide 17 — Demo Workflow 1 — Learner Practice

Ở workflow đầu tiên, learner đăng nhập, mở practice hub, chọn kỹ năng muốn luyện, hoàn thành bài tập và submit.

Sau khi submit, hệ thống trả feedback để người học biết mình cần cải thiện phần nào. Workflow này thể hiện mục tiêu chính của hệ thống là hỗ trợ luyện tập có định hướng.

## Slide 18 — Demo Workflow 2 — Mock Test & Result

Ở workflow thứ hai, learner bắt đầu một bài mock test, hoàn thành các kỹ năng và submit bài.

Sau đó hệ thống xử lý kết quả, hiển thị score breakdown, feedback và skill gaps. Phần này giúp người học không chỉ xem điểm tổng, mà còn biết kỹ năng hoặc tiêu chí nào cần cải thiện.

## Slide 19 — Demo Workflow 3 — Admin Management

Ở workflow thứ ba, admin đăng nhập vào trang quản trị để quản lý nội dung, đề luyện hoặc đề thi thử, xem các tiêu chí đánh giá và quản lý user, course hoặc booking.

Phần admin giúp hệ thống có khả năng vận hành lâu dài, vì nội dung và dữ liệu có thể được cập nhật qua giao diện quản trị thay vì chỉnh trực tiếp trong code.

## Slide 20 — Different Points

Điểm khác biệt của hệ thống là tạo thành một vòng học tương đối đầy đủ cho 4 kỹ năng.

Người học có thể luyện tập, làm thi thử, xem feedback theo tiêu chí, nhận gợi ý dựa trên skill gap và ôn từ vựng theo chu kỳ. Ngoài ra, hệ thống có phần admin để quản lý nội dung và tiêu chí đánh giá, giúp việc vận hành rõ ràng hơn.

Riêng phần Spaced Repetition/Anki, nhóm chỉ nói ngắn gọn là hệ thống có áp dụng cơ chế ôn tập theo chu kỳ. Đây là thuật toán quen thuộc nên nhóm không giải thích dài trên slide chính; nếu hội đồng hỏi sâu, nhóm sẽ mở phần “See detail” hoặc trình bày ở Q&A.

## Slide 21 — Achievements

Kết quả thực hiện của nhóm gồm hệ thống backend, giao diện web cho người học, ứng dụng mobile, trang quản trị, module hỗ trợ đánh giá bài luyện tập, tài liệu kiểm thử, tài liệu cài đặt và hướng dẫn sử dụng, báo cáo cuối cùng và mã nguồn.

Các thành phần này thể hiện nhóm không chỉ xây dựng giao diện, mà còn triển khai backend, quản trị, kiểm thử và tài liệu đi kèm.

## Slide 22 — Limitations

Hạn chế hiện tại là phần đánh giá Writing và Speaking mới phục vụ mục tiêu luyện tập và tham khảo, chưa thay thế giám khảo chính thức.

Ngoài ra, hệ thống cần thêm bộ dữ liệu lớn hơn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác. Một số hướng như adaptive difficulty động hoặc cá nhân hóa sâu hơn vẫn nằm trong phạm vi phát triển tương lai. Chất lượng tín hiệu từ dịch vụ AI/speech bên ngoài cũng có thể ảnh hưởng đến kết quả phân tích.

## Slide 23 — Conclusion

Tóm lại, nhóm đã xây dựng hệ thống hỗ trợ luyện thi VSTEP với các chức năng chính: luyện 4 kỹ năng, thi thử, feedback, đánh giá bài luyện tập theo tiêu chí, learning path và progress tracking.

Trong tương lai, hệ thống có thể mở rộng theo hướng điều chỉnh độ khó linh hoạt, kiểm chứng trên bộ dữ liệu lớn hơn có điểm từ giám khảo chính thức và cá nhân hóa sâu hơn cho từng người học.

## Slide 24 — Thank You

Nhóm em xin cảm ơn hội đồng đã lắng nghe.

Nhóm em sẵn sàng trả lời các câu hỏi của hội đồng.

## Câu cần nhớ khi bị hỏi về AI hoặc điểm Writing/Speaking

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ đếm hoặc trích xuất tham số đầu vào và hỗ trợ feedback. Điểm luyện tập do backend tính bằng công thức định lượng cố định trong hệ thống. Điểm Writing/Speaking là điểm luyện tập/tham khảo, không thay thế giám khảo chính thức.
```

## Câu chuyển nếu cần lướt nhanh

```text
Phần này là module hỗ trợ nên nhóm em xin phép lướt nhanh. Nếu hội đồng quan tâm, nhóm em sẽ trình bày kỹ hơn ở phần Q&A.
```
