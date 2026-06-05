# Short Presentation Script

File này tổng hợp script ngắn gọn cho các slide đã gửi. Số slide được đánh lại từ 1 theo thứ tự trình bày trong nhóm slide này.

## Slide 1 — Why VSTEP Matters?

Kính thưa hội đồng, trước khi đi vào vấn đề và giải pháp, nhóm em xin đặt một chút bối cảnh về VSTEP.

VSTEP là kỳ thi đánh giá năng lực tiếng Anh được sử dụng khá phổ biến tại Việt Nam. Đối với người học, chứng chỉ này có thể gắn với nhiều nhu cầu thực tế như điều kiện tốt nghiệp, yêu cầu đầu vào cao học hoặc yêu cầu năng lực tiếng Anh trong công việc.

Nhu cầu luyện thi VSTEP xuất hiện ở nhiều nhóm người học, đặc biệt là sinh viên, học viên cao học và người đi làm. Vì vậy, việc xây dựng một hệ thống hỗ trợ luyện thi VSTEP có cấu trúc, có phản hồi và có theo dõi tiến độ là một hướng đi có tính thực tiễn.

## Slide 2 — VSTEP Test Structure

Bài thi VSTEP gồm 4 kỹ năng: Listening, Reading, Writing và Speaking.

Listening và Reading có đáp án khách quan nên có thể chấm dựa trên số câu đúng. Ngược lại, Writing và Speaking cần đánh giá theo nhiều tiêu chí hơn, ví dụ như nội dung, tổ chức bài, ngữ pháp, từ vựng, độ trôi chảy hoặc phát âm.

Vì vậy, điểm quan trọng là hệ thống không chỉ cho learner làm bài, mà còn hỗ trợ phản hồi theo tiêu chí, đặc biệt cho Writing và Speaking.

## Slide 3 — Current Learner Problems

Kính thưa hội đồng, vấn đề chính của learner hiện nay không phải là thiếu tài liệu luyện thi.

Người học có rất nhiều nguồn như Word, PDF, Facebook group hoặc Google Drive, nhưng các nguồn này khá phân tán và không tạo thành một lộ trình rõ ràng.

Bên cạnh đó, feedback cho Writing và Speaking còn hạn chế. Learner thường chỉ biết điểm hoặc nhận xét chung, nhưng khó biết mình yếu ở kỹ năng hay tiêu chí nào.

Ngoài ra, nhiều hoạt động luyện tập vẫn thiên về làm mock test. Người học làm nhiều đề nhưng thiếu hướng dẫn nên luyện tiếp phần nào. Vì vậy, tiến độ học dễ bị rời rạc và khó theo dõi cải thiện lâu dài.

## Slide 4 — Proposed Solution

Giải pháp của nhóm là một nền tảng luyện thi VSTEP tích hợp.

Hệ thống gồm ba phần chính. Thứ nhất là Practice và Mock Test, giúp learner luyện 4 kỹ năng và làm bài thi thử theo flow gần với bài thi thật.

Thứ hai là Rubric Assessment, tức là hệ thống hỗ trợ chấm điểm và phản hồi, đặc biệt cho Writing và Speaking. Các tín hiệu từ AI hoặc speech service chỉ đóng vai trò hỗ trợ lấy dữ liệu đầu vào; phần tính điểm sẽ do backend xử lý theo công thức và tiêu chí của hệ thống.

Thứ ba là Learning Path, giúp người học biết kỹ năng nào nên ưu tiên luyện tiếp, đồng thời hỗ trợ ôn từ vựng theo spaced repetition.

Các phần này được hỗ trợ bởi web app, mobile app, admin portal và course management.

## Slide 5 — System Actors

Hệ thống có bốn nhóm người dùng chính.

Learner là người luyện tập, làm mock exam, nhận feedback và theo dõi tiến độ.

Teacher hỗ trợ lịch học, booking, hướng dẫn learner và review Writing/Speaking khi learner gửi yêu cầu.

Staff vận hành nội dung, khóa học, lịch học, booking và các grading task.

Admin quản lý user, phân quyền, cấu hình hệ thống, thanh toán, khuyến mãi, đề thi và analytics.

Việc tách actor như vậy giúp hệ thống không chỉ phục vụ learner, mà còn có thể vận hành như một nền tảng học tập hoàn chỉnh.

## Slide 6 — Learner Features

Với learner, hệ thống tạo một vòng học liên tục từ học, đánh giá đến cải thiện.

Đầu tiên, learner đăng ký, đăng nhập và thiết lập profile cùng target level. Sau đó learner có thể luyện 4 kỹ năng hoặc làm mock test đầy đủ.

Sau bài làm, hệ thống chấm Listening/Reading tự động theo đáp án, còn Writing/Speaking được đánh giá theo rubric và có thể có teacher review khi learner yêu cầu.

Tiếp theo, learner nhận feedback, điểm theo tiêu chí, dashboard và xu hướng tiến bộ. Từ đó, learning path gợi ý kỹ năng nên ưu tiên, từ vựng cần ôn bằng SRS và hoạt động luyện tập tiếp theo.

Mục tiêu là giúp learner biết trình độ hiện tại, hiểu điểm yếu và luyện tập có định hướng hơn.

## Slide 7 — Teacher Features

Với teacher, hệ thống hỗ trợ các nghiệp vụ liên quan đến lớp học và hỗ trợ learner.

Teacher có dashboard để xem tổng quan và notification. Teacher cũng có thể xem lịch dạy theo tuần, xem lớp học và các slot 1-1.

Ở phần booking, teacher có thể xem các buổi học mà learner đã đặt và tham gia meeting nếu có link. Ngoài ra, teacher có thể gửi leave request và theo dõi trạng thái như pending, approved hoặc rejected.

Một phần quan trọng nữa là grading task. Khi learner gửi yêu cầu review bài Writing hoặc Speaking, teacher có thể nhận task, xem bài, chấm/review và gửi lại score cùng feedback cho learner.

## Slide 8 — Staff & Admin Features

Slide này trình bày phần vận hành hệ thống qua staff và admin.

Staff phụ trách các hoạt động hằng ngày như quản lý khóa học, lịch học, teacher slots, nội dung học, bài luyện, đề thi, enrollment và booking.

Staff cũng có thể phân công các Writing/Speaking review task cho teacher khi learner gửi yêu cầu, đồng thời xử lý notification và các hoạt động vận hành thường ngày.

Admin tập trung vào quản trị hệ thống: quản lý user và phân quyền, cấu hình hệ thống, quản lý exams, promo codes, top-up packages, payment orders, dashboard và analytics.

Nhờ vậy, hệ thống có thể vận hành và cập nhật nội dung qua giao diện quản trị, không cần chỉnh sửa thủ công trong code.

## Câu chuyển sang phần tiếp theo

Tóm lại, các slide vừa rồi trình bày bối cảnh, vấn đề, giải pháp và các nhóm người dùng chính. Tiếp theo, nhóm em sẽ trình bày kiến trúc hệ thống và công nghệ được sử dụng để triển khai các chức năng này.
