# Cơ Chế Khóa Học Và Booking 1-1

Tài liệu này giải thích theo góc nhìn nghiệp vụ để bảo vệ capstone. Nội dung không tập trung vào dòng code, mà tập trung vào hệ thống đang giải quyết bài toán gì, luồng đi như thế nào, đã chặn những rủi ro nào, và vì sao thiết kế như vậy.

## 1. Bức Tranh Tổng Quan

Hệ thống khóa học trong VSTEP không chỉ là trang bán khóa. Nó gồm 4 lớp nghiệp vụ chính:

1. Khóa học chính: thông tin khóa, học phí, giáo viên phụ trách, thời gian diễn ra, số lượng học viên tối đa, lịch các buổi học chính.
2. Ghi danh khóa học: learner mua/ghi danh vào khóa, hệ thống kiểm tra trạng thái mở bán, còn slot hay không, có trùng ghi danh không.
3. Cam kết học tập: learner phải hoàn thành một số bài full test trong một khoảng thời gian sau khi ghi danh để mở quyền đặt lịch 1-1.
4. Booking 1-1: learner được đặt lịch phụ đạo/chữa bài riêng với giáo viên thông qua các slot 1-1 do admin/staff tạo.

Điểm quan trọng khi bảo vệ: hệ thống không cho learner đặt 1-1 tự do ngay sau khi vào khóa. Booking 1-1 được xem như quyền lợi sau khi learner có mức độ chủ động học tập nhất định, được kiểm soát bằng cơ chế cam kết.

## 2. Khóa Học Có Những Thành Phần Nào

Một khóa học đang quản lý các thông tin nghiệp vụ sau:

- Mục tiêu trình độ: ví dụ B1, B2, C1.
- Trường/đợt thi mục tiêu: giúp khóa học gắn với bối cảnh thi thật.
- Giá tiền VND và giá gốc để hiển thị chính sách bán hàng.
- Bonus coins khi ghi danh, dùng trong hệ sinh thái luyện tập/booking.
- Số học viên tối đa.
- Số booking 1-1 tối đa mỗi learner được đặt trong khóa.
- Chi phí coin cho mỗi booking 1-1.
- Ngày bắt đầu và ngày kết thúc khóa học.
- Lịch các buổi học chính.
- Link livestream/phòng học chính.
- Giáo viên phụ trách.
- Trạng thái mở/đóng ghi danh.

Về mặt nghiệp vụ, khóa học là một “container” gom cả học chính khóa, tiến độ cam kết, quyền booking 1-1, học viên, và các hoạt động vận hành của staff/admin.

## 3. Luồng Hiển Thị Và Ghi Danh Khóa Học

### 3.1 Learner xem danh sách khóa học

Hệ thống hiển thị các khóa đang published. Với learner đã đăng nhập, hệ thống còn trả thêm trạng thái learner đã ghi danh khóa nào để UI phân biệt:

- Khóa chưa ghi danh.
- Khóa đã ghi danh.
- Buổi học tiếp theo.
- Trạng thái cam kết.

Nếu learner chưa ghi danh, một số thông tin nhạy cảm như livestream URL không được mở ra. Đây là cách tách thông tin marketing và thông tin dành cho học viên thật.

### 3.2 Điều kiện tạo đơn thanh toán ghi danh

Khi learner tạo đơn thanh toán khóa học, hệ thống kiểm tra:

- Khóa học phải đang mở ghi danh.
- Khóa học chưa kết thúc.
- Khóa học chưa đủ số lượng học viên tối đa.
- Khóa học phải có giá hợp lệ.
- Learner chưa ghi danh khóa đó.
- Learner không có đơn thanh toán active bị trùng cho cùng khóa.

Ý nghĩa nghiệp vụ: tránh tình trạng bán khóa đã đóng, khóa hết hạn, khóa đầy, hoặc một learner mua trùng cùng một khóa.

### 3.3 Sau khi thanh toán thành công

Khi payment callback xác nhận thanh toán thành công:

- Hệ thống tạo enrollment cho learner.
- Ghi nhận chữ ký/cam kết nếu có.
- Cộng bonus coins nếu khóa có chính sách bonus.
- Đánh dấu đơn thanh toán đã paid.
- Gửi invoice/email sau transaction.
- Gửi notification ghi danh thành công.

Điểm cần nhấn mạnh: việc tạo enrollment và cập nhật trạng thái thanh toán được xử lý theo hướng transaction để tránh trường hợp payment thành công nhưng learner chưa được ghi danh, hoặc ghi danh bị tạo lặp.

## 4. Cơ Chế Cam Kết Trong Khóa Học

Mỗi khóa học có 2 tham số quan trọng:

- Số bài full test learner cần hoàn thành.
- Thời hạn hoàn thành tính từ lúc ghi danh.

Trạng thái cam kết có 3 nhóm chính:

- Chưa ghi danh: learner chưa thuộc khóa.
- Đang chờ hoàn thành: learner đã ghi danh nhưng chưa đủ số bài trong thời hạn.
- Đạt cam kết: learner đã hoàn thành đủ số full test hợp lệ.
- Vi phạm cam kết: quá thời hạn nhưng chưa hoàn thành đủ.

Booking 1-1 phụ thuộc vào trạng thái cam kết. Nếu learner chưa đạt cam kết, hệ thống không cho đặt lịch 1-1.

Ý nghĩa khi bảo vệ: hệ thống khuyến khích learner tự luyện full test trước, sau đó mới sử dụng tài nguyên giáo viên 1-1. Điều này giúp giáo viên không bị quá tải bởi learner chưa có dữ liệu học tập rõ ràng.

## 5. Lịch Buổi Học Chính Của Khóa

### 5.1 Admin/staff quản lý buổi học

Admin/staff có thể tạo, sửa, xóa buổi học chính của khóa. Mỗi buổi học gồm:

- Số buổi.
- Ngày học.
- Giờ bắt đầu.
- Giờ kết thúc.
- Chủ đề.

### 5.2 Các kiểm soát nghiệp vụ đã handle

Hệ thống đang xử lý các ràng buộc sau:

- Buổi học phải nằm trong khoảng ngày bắt đầu và ngày kết thúc khóa học.
- Khi thêm buổi mới ở admin UI, không cho chọn ngày đã qua.
- Khi dời buổi học trong luồng xử lý giáo viên xin nghỉ, UI cũng check ngày phải nằm trong thời gian khóa học.
- Backend vẫn là lớp chặn cuối cho date range, tránh phụ thuộc hoàn toàn vào UI.
- Giáo viên không được có 2 buổi học chính trùng giờ, kể cả thuộc 2 khóa khác nhau.
- Buổi học chính không được trùng với slot 1-1 của giáo viên.
- Buổi học đã bị hủy không còn được tính là lịch bận khi check conflict.

Điểm quan trọng: hệ thống xem lịch của giáo viên là tài nguyên chung. Một giáo viên có thể dạy nhiều khóa, nhưng không được bị xếp 2 lớp hoặc lớp và 1-1 cùng một khung giờ.

## 6. Booking 1-1 Là Gì

Booking 1-1 là lịch học riêng giữa learner và giáo viên của khóa. Nó không phải lịch học chính. Nó dùng để:

- Chữa bài.
- Tư vấn hướng học.
- Feedback speaking/writing.
- Hỗ trợ learner sau khi đã hoàn thành cam kết luyện tập.

Luồng booking gồm 3 đối tượng:

- Teacher slot: khung giờ trống do admin/staff tạo cho giáo viên.
- Teacher booking: booking thật của learner sau khi đặt slot.
- Coin transaction: giao dịch trừ xu hoặc hoàn xu liên quan booking.

## 7. Admin/Staff Tạo Slot 1-1

### 7.1 Tạo slot đơn

Admin/staff chọn thời gian bắt đầu và thời lượng slot. Hệ thống kiểm tra:

- Slot phải nằm trong thời gian diễn ra khóa học.
- Slot không được ở quá khứ.
- Slot không được trùng slot 1-1 khác của cùng giáo viên.
- Slot không được trùng lịch buổi học chính của cùng giáo viên.
- Nếu slot đang có booking active thì không cho sửa/xóa trực tiếp.

### 7.2 Tạo slot hàng loạt

Khi admin/staff bulk create slot theo ngày, thứ trong tuần và giờ:

- Hệ thống chỉ lấy các ngày nằm trong thời gian khóa học.
- Bỏ qua các slot ở quá khứ.
- Bỏ qua slot trùng slot đã tồn tại.
- Bỏ qua slot trùng lịch buổi học chính.
- Bỏ qua slot trùng nhau trong cùng batch.
- Kết quả trả về số slot tạo được và số slot bị skip.

Ý nghĩa nghiệp vụ: admin có thể tạo nhanh nhiều lịch 1-1 nhưng hệ thống vẫn giữ an toàn lịch dạy cho giáo viên.

## 8. Learner Đặt Booking 1-1

### 8.1 Điều kiện để learner đặt booking

Learner chỉ đặt được booking nếu thỏa các điều kiện:

- Slot thuộc đúng khóa học đang xem.
- Slot chưa qua.
- Slot phải cách thời điểm hiện tại ít nhất 24 giờ.
- Slot không nằm trước ngày bắt đầu khóa.
- Learner đã đạt cam kết học tập của khóa.
- Learner chưa vượt quá số booking tối đa của khóa.
- Slot vẫn còn trạng thái open tại thời điểm transaction lock.
- Learner có đủ coin để thanh toán booking.

Điểm quan trọng: UI có thể hiển thị slot available, nhưng khi bấm đặt hệ thống vẫn lock lại slot để kiểm tra lần cuối. Điều này tránh race condition khi 2 learner cùng đặt một slot gần như đồng thời.

### 8.2 Khi đặt thành công

Hệ thống thực hiện:

- Đổi trạng thái slot từ open sang booked.
- Tạo booking.
- Trừ coin của learner.
- Gửi notification/email cho learner.
- Gửi notification/email cho teacher.
- Gửi notification/email cho admin.

Teacher nhận thông báo để cập nhật link Google Meet. Admin nhận thông báo để theo dõi vận hành.

## 9. Trạng Thái Slot Và Booking

### 9.1 Slot 1-1

Slot có thể được hiểu theo các trạng thái nghiệp vụ:

- Open: còn trống, learner có thể đặt nếu đủ điều kiện.
- Booked: đã có learner đặt.
- Past: đã qua thời gian.
- Booked by me: learner hiện tại đã đặt slot này.
- Booked by other: slot đã bị learner khác đặt.

UI learner không chỉ dựa vào status trong DB mà còn tính thêm lead time 24 giờ. Slot quá gần giờ bắt đầu sẽ không còn được xem là available.

### 9.2 Booking

Booking có thể ở các trạng thái:

- Booked: đang có hiệu lực.
- Completed: đã hoàn thành.
- Cancelled: đã hủy.

Chỉ booking active mới cho phép một số thao tác như cập nhật meet URL hoặc hủy/hoàn.

## 10. Dời Booking 1-1

Admin/staff có thể dời booking sang slot khác khi cần, đặc biệt trong tình huống giáo viên xin nghỉ.

Điều kiện dời:

- Booking gốc phải đang booked.
- Slot mới phải thuộc cùng khóa học.
- Slot mới phải còn open.
- Slot mới không được ở quá khứ.

Khi dời:

- Slot cũ được mở lại.
- Slot mới chuyển sang booked.
- Booking được cập nhật sang slot mới.
- Meet URL cũ bị reset vì lịch đã đổi.
- Learner nhận notification/email lịch mới.

Điểm nghiệp vụ: dời booking không tạo giao dịch coin mới và không refund, vì learner vẫn giữ quyền học 1-1, chỉ đổi lịch.

## 11. Hủy Booking Và Hoàn Xu

Admin/staff có thể hủy booking khi learner không thể/không muốn đổi lịch.

Khi hủy:

- Booking chuyển sang cancelled.
- Slot liên quan được mở lại nếu phù hợp.
- Hệ thống tìm giao dịch trừ coin gốc.
- Nếu chưa refund, hệ thống hoàn đúng số coin đã trừ.
- Gửi notification/email cho learner.

Điểm cần nhấn mạnh khi bảo vệ: client không tự gửi số tiền refund. Backend tự tính từ giao dịch gốc để tránh gian lận hoặc hoàn sai số xu.

## 12. Meet URL Và Trách Nhiệm Giáo Viên

Sau khi learner đặt booking, teacher được thông báo để cập nhật link Google Meet.

Khi meet URL được cập nhật:

- Learner nhận notification.
- Learner có thể xem link trong booking của mình.

Nếu link bị gỡ hoặc thay đổi, hệ thống cũng gửi thông báo tương ứng. Điều này giúp learner không bị mất thông tin lịch học hoặc vào nhầm phòng.

## 13. Luồng Giáo Viên Xin Nghỉ Liên Quan Đến Khóa Học Và Booking

Giáo viên có thể gửi đơn xin nghỉ theo ngày. Hệ thống không tự động hủy/dời mọi thứ, vì đây là nghiệp vụ cần staff cân nhắc. Thay vào đó hệ thống hiển thị impact:

- Buổi học chính bị ảnh hưởng.
- Booking 1-1 đã đặt bị ảnh hưởng.
- Slot 1-1 còn mở trong ngày nghỉ.

Staff/admin có thể xử lý thủ công:

- Dời buổi học chính.
- Hủy buổi học chính và thông báo learner.
- Dời booking 1-1.
- Hủy booking 1-1 và hoàn xu.
- Dời hoặc xóa slot 1-1 còn mở.

Lý do không tự động xử lý: mỗi trường hợp có thể khác nhau. Với booking 1-1 có thể ưu tiên dời, còn lớp chính có thể cần thông báo toàn bộ học viên hoặc sắp lịch bù.

## 14. Các Rủi Ro Nghiệp Vụ Đã Được Chặn

Hệ thống hiện đã handle các rủi ro quan trọng:

- Ghi danh trùng một khóa.
- Bán khóa đã đóng hoặc đã kết thúc.
- Vượt số lượng học viên tối đa.
- Tạo đơn thanh toán trùng đang active.
- Tạo buổi học ngoài thời gian khóa.
- Thêm buổi học mới ở ngày quá khứ.
- Xếp một giáo viên dạy 2 lớp trùng giờ.
- Xếp lớp chính trùng slot 1-1.
- Tạo slot 1-1 ngoài thời gian khóa.
- Tạo slot 1-1 trong quá khứ.
- Tạo slot 1-1 trùng slot khác của cùng giáo viên.
- Tạo slot 1-1 trùng buổi học chính của giáo viên.
- Learner đặt slot quá sát giờ học.
- Learner đặt booking khi chưa đạt cam kết.
- Learner vượt số booking tối đa.
- Hai learner cùng đặt một slot do race condition.
- Refund sai số xu do client tự gửi amount.
- Dời booking sang slot khác khóa.
- Sửa/xóa slot đã có booking active.

## 15. Tại Sao Thiết Kế Này Hợp Lý

Thiết kế tách khóa học chính và booking 1-1 giúp hệ thống linh hoạt:

- Khóa học chính phục vụ nhiều learner cùng lúc.
- Booking 1-1 phục vụ cá nhân hóa hỗ trợ learner.
- Cam kết học tập làm điều kiện mở booking để tránh lạm dụng tài nguyên giáo viên.
- Admin/staff kiểm soát lịch giáo viên để tránh conflict.
- Các thao tác nhạy cảm như refund, hủy, dời lịch đều do backend quyết định.

Về mặt vận hành, staff có đủ quyền xử lý thủ công các tình huống phát sinh, nhưng hệ thống vẫn chặn các lỗi logic nghiêm trọng.

## 16. Câu Hỏi Phản Biện Có Thể Gặp

### Vì sao không cho learner đặt 1-1 ngay sau khi mua khóa?

Vì 1-1 là tài nguyên giáo viên có giới hạn. Hệ thống yêu cầu learner hoàn thành full test trước để chứng minh đã học và có dữ liệu cho giáo viên feedback hiệu quả.

### Vì sao booking 1-1 cần đặt trước ít nhất 24 giờ?

Để giáo viên có thời gian chuẩn bị và tránh các booking sát giờ gây khó vận hành.

### Vì sao khi giáo viên xin nghỉ không tự động hủy/dời tất cả?

Vì mỗi lịch bị ảnh hưởng có cách xử lý khác nhau. Có booking nên dời, có booking cần hủy/hoàn, lớp chính có thể cần lịch bù hoặc thông báo riêng. Staff cần quyết định theo tình huống.

### Vì sao backend phải tự tính refund?

Vì refund liên quan tài sản người dùng. Nếu client gửi số xu refund, có rủi ro sai hoặc bị chỉnh payload. Backend tính từ giao dịch gốc để đảm bảo đúng và an toàn.

### Nếu một giáo viên phụ trách 2 khóa thì sao tránh trùng lịch?

Khi tạo/sửa buổi học chính, hệ thống kiểm tra lịch của giáo viên trên toàn bộ khóa. Nếu khung giờ bị trùng với buổi học khác hoặc slot 1-1, hệ thống từ chối.

### Nếu admin tạo slot 1-1 trùng giờ lớp chính thì sao?

Backend từ chối vì slot 1-1 được check overlap với lịch lớp chính của giáo viên. Bulk tạo slot cũng tự skip các slot bị trùng.

## 17. Tóm Tắt Nói Ngắn Khi Bảo Vệ

Hệ thống khóa học của em quản lý đầy đủ vòng đời từ mở bán khóa, thanh toán ghi danh, cam kết học tập, lịch học chính, đến hỗ trợ 1-1. Booking 1-1 không phải chức năng đặt lịch đơn giản mà được kiểm soát bằng cam kết học tập, giới hạn số booking, lead time 24 giờ, trạng thái slot, coin transaction và notification. Phần vận hành admin/staff có cơ chế chống trùng lịch giáo viên giữa nhiều khóa và giữa lớp chính với slot 1-1, đồng thời có quy trình xử lý khi giáo viên xin nghỉ để staff chủ động dời/hủy/hoàn xu đúng nghiệp vụ.
