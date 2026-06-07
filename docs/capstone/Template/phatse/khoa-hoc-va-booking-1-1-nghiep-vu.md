# Cơ Chế Khóa Học Và Booking 1-1

Tài liệu này mô tả luồng khóa học và booking 1-1 theo cách một người bán dịch vụ giới thiệu cho khách hàng: người học thật sự cần gì khi mua khóa, hệ thống đáp ứng nhu cầu đó như thế nào, và điểm khác biệt nào khiến khóa học trên VSTEP không chỉ là một trang bán khóa thông thường.

## 1. Người Dùng Muốn Gì Khi Vào Luồng Khóa Học

Khi một học viên tìm đến khóa học VSTEP, họ thường không chỉ muốn xem giá hay bấm mua. Nhu cầu thật của họ là tìm một lộ trình có người dẫn, có lịch học rõ ràng, có cam kết luyện tập và có cơ hội được giáo viên hỗ trợ cá nhân khi gặp điểm yếu.

Một người học VSTEP khi vào luồng khóa học thường muốn 5 điều:

- Muốn biết khóa này có phù hợp với mục tiêu B1/B2/C1 của mình không.
- Muốn biết học với ai, học khi nào, khóa kéo dài bao lâu và có bao nhiêu học viên.
- Muốn mua khóa một cách rõ ràng, không bị trùng đơn, không mua nhầm khóa đã đóng hoặc đã hết chỗ.
- Muốn có động lực luyện tập sau khi ghi danh, chứ không chỉ mua xong rồi bỏ đó.
- Muốn được gặp giáo viên 1-1 khi cần chữa bài, tư vấn hoặc xử lý điểm yếu cá nhân.

Luồng khóa học của VSTEP được thiết kế để trả lời trực tiếp các nhu cầu đó. Đây không chỉ là trang giới thiệu khóa học, mà là một hệ thống quản lý hành trình học: từ xem khóa, ghi danh, nhận quyền lợi, theo dõi cam kết, học theo lịch chính, đến đặt lịch 1-1 với giáo viên.

## 2. Thông Điệp Bán Hàng Chính

Nếu giới thiệu ngắn gọn với khách hàng, có thể nói:

VSTEP không chỉ bán một khóa học online. VSTEP bán một chương trình ôn thi có lịch học, cam kết luyện tập và quyền hỗ trợ 1-1 được kiểm soát bằng dữ liệu học tập.

Điểm đáng giá là học viên không bị bỏ mặc sau khi thanh toán. Họ có lịch học chính, có giáo viên phụ trách, có bonus xu để tiếp tục luyện trong hệ sinh thái, có mục tiêu full test cần hoàn thành, và khi đã có đủ dữ liệu luyện tập thì được mở quyền đặt lịch 1-1.

Với trung tâm hoặc đơn vị vận hành, chức năng này giúp khóa học không chỉ là sản phẩm bán một lần. Nó trở thành một quy trình vận hành có kiểm soát: quản lý học viên, lịch lớp, lịch giáo viên, booking cá nhân, xu, thông báo và các tình huống phát sinh như giáo viên xin nghỉ.

## 3. Điểm Đặc Biệt 1: Khóa Học Không Chỉ Là Trang Bán Hàng

Một khóa học trong VSTEP được thiết kế như một gói học tập hoàn chỉnh. Người học không chỉ nhìn thấy tên khóa và giá tiền, mà còn thấy mục tiêu trình độ, thời gian diễn ra, giáo viên phụ trách, lịch học, số lượng học viên tối đa, chính sách bonus xu và quyền booking 1-1.

Điều này giúp học viên trả lời được câu hỏi quan trọng trước khi mua: khóa này có dành cho mình không, học trong bao lâu, học với ai, và sau khi mua mình nhận được gì.

Giá trị khách hàng nhận được:

- Học viên có đủ thông tin để ra quyết định, không mua theo cảm tính.
- Trung tâm có thể trình bày khóa học như một sản phẩm có cấu trúc rõ ràng.
- Các quyền lợi như bonus xu, lịch học và 1-1 được gắn trực tiếp vào khóa, không bị rời rạc.
- Thông tin nhạy cảm như link học/livestream chỉ mở cho người đã ghi danh, giúp tách rõ phần marketing và phần dành cho học viên thật.

## 4. Điểm Đặc Biệt 2: Ghi Danh Có Kiểm Soát, Không Bán Bừa

Một hệ thống bán khóa tốt không chỉ cần nút thanh toán. Nó phải đảm bảo học viên chỉ mua được khóa hợp lệ, còn chỗ, đang mở ghi danh và chưa bị mua trùng.

VSTEP xử lý điều này bằng cách kiểm tra trạng thái khóa trước khi tạo đơn thanh toán. Khóa phải đang published, chưa kết thúc, còn capacity, có giá hợp lệ và learner chưa ghi danh khóa đó. Nếu học viên đã có đơn thanh toán active cho cùng khóa, hệ thống cũng chặn để tránh tạo nhiều đơn trùng.

Sau khi thanh toán thành công, hệ thống tạo enrollment, ghi nhận cam kết, cộng bonus xu nếu khóa có chính sách bonus, đánh dấu đơn đã paid và gửi thông báo cho học viên.

Giá trị khách hàng nhận được:

- Học viên không mua nhầm khóa đã đóng, khóa hết hạn hoặc khóa đã đầy.
- Trung tâm tránh tình trạng một học viên mua trùng cùng một khóa.
- Payment thành công được gắn với enrollment rõ ràng, giảm rủi ro “đã trả tiền nhưng chưa được vào khóa”.
- Bonus xu sau ghi danh giúp học viên tiếp tục luyện đề, booking hoặc dùng các dịch vụ khác trong hệ sinh thái.

## 5. Điểm Đặc Biệt 3: Cam Kết Học Tập Biến Khóa Học Thành Một Hành Trình

Điểm khác biệt lớn của luồng khóa học là cơ chế cam kết. Hệ thống không xem học viên là người mua xong rồi tùy ý sử dụng mọi tài nguyên. Thay vào đó, học viên cần hoàn thành một số bài full test trong thời hạn cam kết của khóa.

Cam kết này có ý nghĩa thực tế: học viên cần tự luyện và tạo dữ liệu năng lực trước khi dùng đến tài nguyên giáo viên 1-1. Khi giáo viên gặp học viên, giáo viên không phải hỏi từ đầu “em đang yếu gì”, mà có thể dựa trên kết quả full test để feedback hiệu quả hơn.

Trạng thái cam kết có thể hiểu đơn giản:

- Chưa ghi danh: học viên chưa thuộc khóa.
- Đang chờ hoàn thành: đã vào khóa nhưng chưa đủ full test trong thời hạn.
- Đạt cam kết: đã hoàn thành đủ yêu cầu.
- Vi phạm cam kết: quá hạn nhưng chưa hoàn thành đủ.

Giá trị khách hàng nhận được:

- Học viên có động lực luyện tập sau khi mua khóa.
- Giáo viên có dữ liệu trước khi hỗ trợ cá nhân.
- Trung tâm tránh việc học viên lạm dụng booking 1-1 khi chưa tự luyện đủ.
- Booking 1-1 trở thành quyền lợi có điều kiện, tạo cảm giác giá trị hơn.

## 6. Điểm Đặc Biệt 4: Booking 1-1 Là Quyền Lợi Cao Cấp, Không Phải Đặt Lịch Tự Do

Booking 1-1 trong VSTEP là lịch học riêng giữa learner và giáo viên của khóa. Nó dùng cho các nhu cầu như chữa bài, tư vấn hướng học, feedback Writing/Speaking hoặc xử lý điểm yếu cá nhân.

Điểm quan trọng là học viên không được đặt 1-1 ngay lập tức chỉ vì đã mua khóa. Họ cần có active enrollment, đạt cam kết, còn quota booking, slot phải còn mở, không quá sát giờ và ví xu phải đủ để thanh toán nếu booking có phí.

Thiết kế này giúp 1-1 trở thành tài nguyên được kiểm soát. Giáo viên không bị quá tải bởi các booking thiếu chuẩn bị, còn học viên có lý do để hoàn thành bài full test trước khi gặp giáo viên.

Giá trị khách hàng nhận được:

- Học viên xem 1-1 như một quyền lợi thật sự có giá trị.
- Giáo viên gặp học viên đã có dữ liệu học tập, buổi 1-1 hiệu quả hơn.
- Trung tâm kiểm soát được quota, lead time, chi phí xu và lịch giáo viên.
- Slot 1-1 không bị đặt trùng nhờ cơ chế reserve an toàn khi booking.

## 7. Điểm Đặc Biệt 5: Lịch Giáo Viên Được Xem Như Tài Nguyên Chung

Trong vận hành thật, một giáo viên có thể dạy nhiều khóa, có nhiều buổi học chính và cũng có các slot 1-1. Nếu hệ thống chỉ quản lý lịch trong từng khóa riêng lẻ, rất dễ xảy ra trùng giờ.

VSTEP xử lý lịch giáo viên như một tài nguyên chung. Khi tạo buổi học chính hoặc slot 1-1, hệ thống kiểm tra thời gian trong phạm vi khóa, không cho tạo lịch quá khứ, không cho xếp một giáo viên vào 2 lớp trùng giờ, và không cho slot 1-1 trùng với buổi học chính.

Với bulk create slot 1-1, hệ thống có thể tạo nhanh nhiều slot nhưng vẫn skip các slot không hợp lệ như ngoài thời gian khóa, quá khứ, trùng slot đã có, trùng buổi học chính hoặc trùng nhau trong cùng batch.

Giá trị khách hàng nhận được:

- Học viên không bị nhận lịch học bị trùng hoặc không thể diễn ra.
- Giáo viên không bị xếp 2 việc cùng một khung giờ.
- Staff tạo lịch nhanh nhưng vẫn an toàn vận hành.
- Trung tâm có thể mở rộng nhiều khóa, nhiều slot 1-1 mà không mất kiểm soát lịch.

## 8. Điểm Đặc Biệt 6: Dời, Hủy, Hoàn Xu Có Quy Trình Rõ Ràng

Trong vận hành khóa học thật, lịch có thể thay đổi. Giáo viên có thể xin nghỉ, học viên có thể không tham gia được, hoặc staff cần đổi slot. VSTEP không xem đây là ngoại lệ nhỏ, mà có quy trình xử lý rõ.

Khi dời booking, booking gốc phải còn active, slot mới phải cùng khóa, còn open và không ở quá khứ. Slot cũ được mở lại, slot mới được giữ chỗ, booking cập nhật sang lịch mới và meet URL cũ được reset vì lịch đã đổi.

Khi hủy booking, hệ thống chuyển booking sang cancelled, mở lại slot nếu phù hợp, tìm giao dịch trừ xu gốc và hoàn đúng số xu nếu chưa refund. Số xu hoàn không do client gửi lên, mà backend tự tính từ giao dịch gốc để tránh hoàn sai hoặc bị chỉnh payload.

Giá trị khách hàng nhận được:

- Học viên được thông báo khi lịch thay đổi.
- Nếu hủy cần hoàn xu, hệ thống hoàn đúng số đã trừ.
- Staff có công cụ xử lý tình huống thật thay vì phải sửa tay rời rạc.
- Trung tâm giữ được audit trail cho các thao tác nhạy cảm như hủy, dời và refund.

## 9. Điểm Đặc Biệt 7: Giáo Viên Xin Nghỉ Không Làm Hệ Thống Rối

Khi giáo viên xin nghỉ, hệ thống không tự động hủy toàn bộ lịch một cách máy móc. Thay vào đó, hệ thống hiển thị các tác động để staff/admin quyết định cách xử lý phù hợp.

Một ngày nghỉ có thể ảnh hưởng đến buổi học chính, booking 1-1 đã đặt và slot 1-1 còn mở. Staff có thể dời buổi học chính, hủy buổi học chính, dời booking, hủy booking và hoàn xu, hoặc dời/xóa slot còn mở.

Lý do thiết kế này hợp lý là vì mỗi tình huống có cách xử lý khác nhau. Một lớp chính có thể cần lịch bù, một booking 1-1 có thể dời sang slot khác, còn một slot trống thì chỉ cần xóa hoặc dời.

Giá trị khách hàng nhận được:

- Staff thấy rõ lịch nào bị ảnh hưởng trước khi ra quyết định.
- Học viên không bị hủy/dời lịch một cách thiếu kiểm soát.
- Giáo viên có quy trình xin nghỉ nhưng vẫn giữ vận hành ổn định.
- Trung tâm xử lý sự cố lịch theo nghiệp vụ, không phải sửa dữ liệu thủ công.

## 10. Cách Có Thể Trình Bày Khi Demo

Khi demo chức năng này, nên đi theo câu chuyện của một học viên thật thay vì đọc danh sách rule.

Một kịch bản demo tốt:

1. Học viên vào danh sách khóa học vì muốn tìm lộ trình ôn VSTEP phù hợp.
2. Học viên xem chi tiết khóa, thấy mục tiêu, lịch học, giáo viên, giá, bonus xu và quyền booking 1-1.
3. Học viên tạo đơn ghi danh, hệ thống kiểm tra khóa còn mở, còn slot và chưa mua trùng.
4. Sau khi thanh toán, học viên được ghi danh và nhận quyền lợi trong khóa.
5. Học viên cần hoàn thành full test theo cam kết để mở quyền booking 1-1.
6. Khi đạt cam kết, học viên chọn slot 1-1 còn phù hợp, hệ thống kiểm tra lead time, quota và số dư xu.
7. Giáo viên nhận booking, cập nhật meet URL, học viên nhận thông báo để tham gia buổi học.
8. Nếu phát sinh giáo viên xin nghỉ, staff xem impact và chọn dời/hủy/hoàn xu theo tình huống.

Câu chốt khi demo:

VSTEP không chỉ cho học viên mua khóa. VSTEP giúp trung tâm vận hành cả hành trình sau khi mua: lịch học, cam kết, dữ liệu luyện tập, booking 1-1, lịch giáo viên, thông báo và xử lý sự cố.

## 11. Những Nghiệp Vụ Đã Được Handle

Phần này ghi lại ngắn gọn các nghiệp vụ đã có để phục vụ báo cáo/bảo vệ, nhưng không phải trọng tâm khi sale chức năng.

- Khóa học có mục tiêu trình độ, trường/đợt thi mục tiêu, giá, giá gốc, bonus xu, capacity, thời gian khóa, giáo viên phụ trách và trạng thái published/enrollment.
- Danh sách khóa học phân biệt khóa đã ghi danh và chưa ghi danh, đồng thời ẩn thông tin phòng học/livestream với người chưa ghi danh.
- Tạo đơn ghi danh kiểm tra course published, chưa kết thúc, còn capacity, giá hợp lệ, learner chưa enrolled và không có order active trùng.
- Payment thành công tạo enrollment, ghi nhận cam kết, cộng bonus xu nếu có, đánh dấu order paid và gửi notification/email.
- Cam kết khóa học tính theo số full mock test phải hoàn thành trong commitment window.
- Booking 1-1 chỉ mở khi learner có active enrollment, đạt cam kết, còn quota, slot open, slot tương lai, đạt lead time và đủ xu.
- Buổi học chính phải nằm trong ngày bắt đầu/kết thúc khóa và không được tạo ở ngày quá khứ.
- Lịch giáo viên được check conflict giữa các buổi học chính, giữa các khóa và giữa buổi học chính với slot 1-1.
- Slot 1-1 phải thuộc thời gian khóa, không ở quá khứ, không trùng slot khác và không trùng buổi học chính của giáo viên.
- Slot đã có booking active không được sửa/xóa trực tiếp cho đến khi booking bị hủy.
- Bulk create slot tự bỏ qua slot ngoài thời gian khóa, quá khứ, trùng slot cũ, trùng lịch lớp chính hoặc trùng trong batch.
- Khi learner đặt booking, hệ thống reserve slot và trừ xu trong một thao tác an toàn để tránh hai learner cùng đặt một slot.
- Booking thành công đổi slot sang booked, tạo booking, trừ xu và gửi thông báo/email cho learner, teacher, admin.
- Booking có trạng thái booked, completed, cancelled; slot có trạng thái open/booked/past/booked by me/booked by other theo góc nhìn learner.
- Dời booking yêu cầu booking gốc còn booked, slot mới cùng khóa, còn open và không ở quá khứ.
- Dời booking mở lại slot cũ, giữ slot mới, reset meet URL và gửi thông báo lịch mới.
- Hủy booking chuyển booking sang cancelled, mở lại slot phù hợp, hoàn xu một lần dựa trên giao dịch gốc và gửi thông báo.
- Meet URL do teacher cập nhật; learner nhận thông báo khi link được thêm, đổi hoặc gỡ.
- Teacher leave request hiển thị impact gồm buổi học chính, booking đã đặt và slot còn mở để staff xử lý.
- Staff/admin có thể dời/hủy buổi học chính, dời/hủy booking 1-1, hoàn xu hoặc xử lý slot còn mở khi giáo viên xin nghỉ.

## 12. Những Rủi Ro Nghiệp Vụ Đã Được Chặn

Các rủi ro quan trọng đã được hệ thống kiểm soát:

- Bán khóa đã đóng, đã kết thúc hoặc đã đầy.
- Một learner ghi danh trùng một khóa.
- Tạo nhiều payment order active cho cùng một khóa.
- Payment thành công nhưng tạo enrollment trùng.
- Người chưa ghi danh thấy link học/livestream dành cho học viên thật.
- Learner đặt 1-1 khi chưa hoàn thành cam kết.
- Learner đặt quá số booking tối đa của khóa.
- Learner đặt slot quá sát giờ học.
- Hai learner cùng đặt một slot do thao tác đồng thời.
- Tạo buổi học hoặc slot ngoài thời gian khóa.
- Xếp giáo viên trùng lịch giữa nhiều khóa hoặc giữa lớp chính và 1-1.
- Sửa/xóa slot đã có booking active.
- Dời booking sang slot khác khóa hoặc slot không còn open.
- Refund sai số xu do client tự nhập số tiền hoàn.
- Giáo viên xin nghỉ nhưng staff không biết lịch nào bị ảnh hưởng.

## 13. Câu Hỏi Phản Biện Có Thể Gặp

### Vì sao không cho learner đặt 1-1 ngay sau khi mua khóa?

Vì 1-1 là tài nguyên giáo viên có giới hạn. Hệ thống yêu cầu learner hoàn thành full test trước để chứng minh đã học và tạo dữ liệu cho giáo viên feedback hiệu quả hơn.

### Vì sao booking 1-1 cần đặt trước ít nhất 24 giờ?

Để giáo viên có thời gian chuẩn bị và tránh booking sát giờ gây khó vận hành.

### Vì sao khi giáo viên xin nghỉ không tự động hủy/dời tất cả?

Vì mỗi lịch bị ảnh hưởng có cách xử lý khác nhau. Có booking nên dời, có booking nên hủy/hoàn, lớp chính có thể cần lịch bù hoặc thông báo riêng. Staff cần quyết định theo tình huống.

### Vì sao backend phải tự tính refund?

Vì refund liên quan tài sản người dùng. Nếu client gửi số xu refund, payload có thể sai hoặc bị chỉnh. Backend tính từ giao dịch gốc để đảm bảo đúng và an toàn.

### Nếu một giáo viên phụ trách nhiều khóa thì sao tránh trùng lịch?

Khi tạo/sửa buổi học hoặc slot 1-1, hệ thống kiểm tra lịch của giáo viên trên toàn bộ phạm vi liên quan. Nếu khung giờ trùng với lớp khác hoặc slot 1-1, hệ thống từ chối hoặc skip.

## 14. Kết Luận

Luồng khóa học và booking 1-1 nên được nhìn như một sản phẩm vận hành học tập, không phải chỉ là trang bán khóa. Giá trị lớn nhất của nó nằm ở việc kết nối 4 thứ: mua khóa, học theo lịch, cam kết luyện tập và hỗ trợ cá nhân với giáo viên.

Với học viên, đây là nơi họ tìm được lộ trình học có người dẫn và có quyền 1-1 sau khi thật sự luyện tập. Với trung tâm, đây là nơi quản lý được doanh thu khóa học, lịch giáo viên, quyền lợi học viên, booking cá nhân, xu và các tình huống vận hành phát sinh.
