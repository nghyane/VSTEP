# Nghiệp Vụ Luồng Exam User

Tài liệu này mô tả luồng thi thử VSTEP theo góc nhìn nghiệp vụ và trải nghiệm khách hàng. Nội dung không đi sâu vào kỹ thuật, mà tập trung trả lời câu hỏi: người học dùng chức năng này như thế nào, hệ thống mang lại giá trị gì, và những tình huống nghiệp vụ nào đã được xử lý.

## 1. Bức Tranh Tổng Quan

Luồng Exam User là một trong các chức năng lõi của VSTEP. Đây không chỉ là màn hình làm bài thi thử, mà là một quy trình khép kín từ lúc người học tìm đề, chọn cách làm bài, vào phòng thi, làm từng kỹ năng, nộp bài, nhận điểm, xem lỗi và yêu cầu giáo viên chấm sâu hơn khi cần.

Với khách hàng, chức năng này có thể được hiểu như một phòng thi thử VSTEP online có kiểm soát:

- Người học có thư viện đề thi để lựa chọn.
- Có thể làm đủ 4 kỹ năng hoặc chỉ luyện kỹ năng đang yếu.
- Có cơ chế tính phí bằng xu theo từng lượt làm.
- Có bước chuẩn bị trước khi tính giờ để tránh lỗi loa, mic.
- Có phòng thi riêng với đồng hồ, tiến độ và cảnh báo rõ ràng.
- Có tự động lưu bài làm để giảm rủi ro mất dữ liệu.
- Có tự nộp khi hết giờ để mô phỏng áp lực thi thật.
- Có kết quả tổng quan, kết quả từng kỹ năng và phần xem lại chi tiết.
- Với Writing/Speaking, người học nhận được chẩn đoán, nhận xét AI và có thể yêu cầu giáo viên chấm lại.

Điểm quan trọng khi giới thiệu với khách hàng: hệ thống không chỉ cho học viên “làm bài”, mà giúp học viên biết mình đang ở đâu, sai ở đâu, cần cải thiện gì và có thể tiếp tục học theo dữ liệu thật.

## 2. Giá Trị Bán Hàng Của Chức Năng

Nếu nhìn theo hướng sale dịch vụ, luồng Exam User đang giải quyết 4 nỗi đau lớn của người học VSTEP:

- Không biết chọn đề nào để luyện: hệ thống có thư viện đề thi, tìm kiếm, lọc trạng thái và sắp xếp theo độ mới/phổ biến.
- Không có môi trường thi nghiêm túc: phòng thi có thứ tự kỹ năng, đồng hồ, xác nhận chuyển phần, cảnh báo khi rời phòng và tự nộp khi hết giờ.
- Làm xong nhưng không biết sai ở đâu: kết quả hiển thị tổng điểm, điểm từng kỹ năng, câu sai/câu đúng, transcript/bài đọc và đáp án đúng.
- Writing/Speaking khó tự đánh giá: hệ thống hỗ trợ chấm tự động, chỉ ra lỗi, đưa nhận xét, và mở thêm lựa chọn giáo viên chấm chuyên sâu.

Nói ngắn gọn: đây là trải nghiệm thi thử + chữa bài + định hướng cải thiện trong cùng một luồng.

## 3. Luồng Người Học Từ Đầu Đến Cuối

### 3.1 Xem thư viện đề thi

Người học vào mục Thi thử để xem danh sách đề thi. Mỗi đề hiển thị các thông tin dễ hiểu như tên đề, thời lượng, nguồn đề, tag, mức phổ biến, trạng thái làm bài và chi phí xu cho một lượt làm.

Các nghiệp vụ đã handle:

- Tìm đề theo tên.
- Lọc theo trạng thái: tất cả, chưa làm, đang làm dở, đã nộp.
- Sắp xếp đề theo mới nhất hoặc phổ biến.
- Phân trang danh sách đề để thư viện có thể mở rộng.
- Hiển thị trạng thái cá nhân hóa theo người học, ví dụ đang làm dở thì hiện nút Tiếp tục.
- Hiển thị số xu cần trả cho lượt làm nếu đề chưa có lượt active.
- Có trạng thái rỗng thân thiện khi chưa có đề, không tìm thấy đề hoặc chưa nộp đề nào.

Giá trị cho khách hàng: học viên không bị ngợp trước kho đề, có thể nhanh chóng tìm đúng đề và tiếp tục bài đang làm mà không mất công nhớ lại.

### 3.2 Xem chi tiết đề thi

Khi chọn một đề, người học được đưa vào trang chi tiết. Tại đây, hệ thống hiển thị tên đề, nguồn đề, tag, tổng thời gian, tổng số câu trắc nghiệm và số phần tự luận.

Các nghiệp vụ đã handle:

- Xem cấu trúc tổng quan của đề trước khi làm.
- Xem số lượng câu/phần theo từng kỹ năng.
- Xem lịch sử các lần đã làm bài.
- Xem ngày nộp, kỹ năng đã làm và kết quả từng lượt.
- Từ lịch sử, người học có thể quay lại xem kết quả cũ.

Giá trị cho khách hàng: người học biết rõ mình sắp làm gì, thời lượng bao lâu, đề gồm những phần nào và đã từng làm kết quả ra sao.

### 3.3 Chọn phạm vi làm bài

Hệ thống hỗ trợ 2 cách làm bài:

- Làm đủ 4 kỹ năng: Nghe, Đọc, Viết, Nói theo cấu trúc đề.
- Luyện kỹ năng: chọn một hoặc nhiều kỹ năng riêng để tập trung cải thiện điểm yếu.

Các nghiệp vụ đã handle:

- Chọn chế độ full test đủ 4 kỹ năng.
- Chọn chế độ luyện kỹ năng riêng.
- Bắt buộc chọn ít nhất 1 kỹ năng nếu làm chế độ tùy chọn.
- Hiển thị thời lượng và số câu/số phần của từng kỹ năng.
- Giữ đúng thứ tự kỹ năng: Listening, Reading, Writing, Speaking.

Giá trị cho khách hàng: sản phẩm phục vụ cả người muốn mô phỏng thi thật lẫn người muốn luyện riêng phần yếu, giúp cá nhân hóa quá trình ôn thi.

### 3.4 Chọn thời gian và tính chi phí

Trước khi vào thi, hệ thống tính tổng thời gian và chi phí xu dựa trên phạm vi bài làm.

Các nghiệp vụ đã handle:

- Full test có mức phí riêng.
- Luyện từng kỹ năng tính phí theo số kỹ năng đã chọn, nhưng không vượt quá phí full test.
- Có lựa chọn thời lượng: chuẩn, luyện chậm, ôn tập nhanh.
- Luyện chậm cộng thêm thời gian để học viên mới có thể làm thoải mái hơn.
- Ôn tập nhanh rút ngắn thời gian để phù hợp nhu cầu luyện tốc độ.
- Kiểm tra số dư ví xu trước khi bắt đầu.
- Nếu không đủ xu, hệ thống mở luồng nạp xu thay vì cho vào phòng thi.
- Khi bắt đầu thành công, hệ thống trừ xu và thông báo số xu đã trừ.

Giá trị cho khách hàng: hệ thống có thể vận hành theo mô hình trả phí bằng xu, linh hoạt giữa full test và luyện kỹ năng, đồng thời minh bạch chi phí trước khi học viên bấm bắt đầu.

### 3.5 Xử lý bài đang làm dở và làm lại

Nếu người học đã có một lượt làm đang active cùng phiên bản đề, hệ thống không tự tạo lượt mới ngay. Người học được ưu tiên tiếp tục bài cũ hoặc chủ động làm lại từ đầu.

Các nghiệp vụ đã handle:

- Hiển thị nút Tiếp tục làm bài nếu đang có lượt active.
- Nếu chọn làm lại từ đầu, hệ thống cảnh báo lượt cũ sẽ bị hủy và không hoàn xu.
- Lượt làm lại sẽ bị trừ xu như một lượt mới.
- Sau khi xác nhận, hệ thống tạo lượt mới và đưa người học vào phòng thi.

Giá trị cho khách hàng: tránh tạo trùng lượt làm, tránh mất phí không rõ ràng, đồng thời vẫn cho học viên chủ động reset khi muốn thi lại nghiêm túc.

## 4. Bước Chuẩn Bị Trước Khi Thi

Trước khi đồng hồ bắt đầu tính, người học đi qua màn hình kiểm tra cuối. Đây là điểm rất quan trọng với đề có Listening và Speaking.

Các nghiệp vụ đã handle:

- Thời gian chưa bắt đầu ở bước kiểm tra thiết bị.
- Hiển thị cấu trúc bài thi và thứ tự kỹ năng sẽ làm.
- Hiển thị tổng thời gian sau khi đã chọn chế độ thời lượng.
- Nếu có Listening, người học được nghe thử âm thanh.
- Nếu có Speaking, người học được thu âm thử và nghe lại.
- Nếu bài không có Listening/Speaking, hệ thống thông báo không cần kiểm tra âm thanh.
- Nhắc người học các luật quan trọng: chốt kỹ năng là không quay lại, bài làm được tự động lưu, nộp bài sau khi hoàn tất.

Giá trị cho khách hàng: giảm rủi ro “vào thi mới phát hiện không nghe được audio hoặc mic không hoạt động”, giúp trải nghiệm thi online chuyên nghiệp hơn.

## 5. Phòng Thi Online

Phòng thi là nơi người học thực hiện bài làm. Hệ thống thiết kế theo hướng tập trung, ít gây nhiễu, có đồng hồ, tiến độ, trạng thái lưu bài và các nút hành động rõ ràng.

Các nghiệp vụ đã handle:

- Chỉ mở phòng thi nếu lượt làm còn active.
- Nếu lượt làm đã nộp hoặc đang chấm, hệ thống chuyển sang màn hình kết quả.
- Hiển thị tên đề, kỹ năng hiện tại, tiến độ kỹ năng và thời gian còn lại.
- Hiển thị số câu trắc nghiệm đã trả lời trên tổng số câu.
- Hiển thị trạng thái tự động lưu: đang lưu, đã lưu, không lưu được.
- Chặn thao tác trả lời khi hết giờ hoặc bài không còn active.
- Cảnh báo khi người học muốn rời phòng thi.
- Nếu rời phòng, bài làm đã được lưu tự động và người học có thể quay lại trước khi hết giờ.

Giá trị cho khách hàng: phòng thi vừa giống thi thật, vừa bảo vệ dữ liệu học viên trong các tình huống thực tế như refresh, mất mạng hoặc thoát nhầm.

## 6. Luồng Làm Bài Theo Kỹ Năng

### 6.1 Listening

Phần Listening mô phỏng logic thi nghe có kiểm soát lượt phát audio.

Các nghiệp vụ đã handle:

- Chia bài nghe theo part/section.
- Hiển thị câu hỏi trắc nghiệm của part đang làm.
- Theo dõi câu nào đã trả lời, câu nào chưa trả lời.
- Có thanh điều hướng câu hỏi để nhảy nhanh tới câu cần xem.
- Ghi nhận lượt phát audio với hệ thống.
- Không cho phát lại audio đã được ghi nhận là đã phát.
- Nếu audio đã phát trước đó, hệ thống thông báo rõ cho người học.
- Nếu không ghi nhận được lượt phát hoặc trình duyệt không phát được audio, hệ thống báo lỗi để người học xử lý.
- Audio trong cùng một part có thể được phát nối tiếp theo section.

Giá trị cho khách hàng: phần nghe có kiểm soát nghiêm túc hơn so với chỉ nhúng file audio thông thường, phù hợp với mô phỏng thi thật.

### 6.2 Reading

Phần Reading hiển thị bài đọc và câu hỏi theo bố cục song song, giúp người học vừa đọc vừa trả lời.

Các nghiệp vụ đã handle:

- Chia bài đọc theo đoạn/phần.
- Hiển thị bài đọc bên trái và câu hỏi bên phải.
- Cho phép bôi/highlight nội dung bài đọc để hỗ trợ phân tích.
- Theo dõi số câu đã trả lời trong từng đoạn.
- Hiển thị cảnh báo còn bao nhiêu câu chưa trả lời ở đoạn hiện tại.
- Có điều hướng câu hỏi để nhảy nhanh đến câu cần làm.
- Có nút chuyển sang đoạn tiếp theo.

Giá trị cho khách hàng: người học không chỉ làm Reading, mà còn có công cụ đọc chủ động giống cách luyện đề nghiêm túc: đánh dấu, kiểm tra tiến độ và rà soát câu thiếu.

### 6.3 Writing

Phần Writing hỗ trợ người học viết trực tiếp trên hệ thống, có đếm từ và nhắc yêu cầu tối thiểu.

Các nghiệp vụ đã handle:

- Hiển thị đề bài và loại task như thư, bài luận, thư trang trọng, thư thân mật.
- Cho phép làm nhiều phần Writing trong cùng một đề.
- Có ô soạn bài làm riêng cho từng phần.
- Tự động đếm số từ theo thời gian thực.
- Hiển thị tiến độ đạt số từ tối thiểu.
- Cảnh báo còn thiếu bao nhiêu từ nếu chưa đạt yêu cầu.
- Cho phép chuyển giữa các phần Writing.
- Khi chuẩn bị chốt/nộp, hệ thống cảnh báo nếu phần viết chưa đủ số từ.

Giá trị cho khách hàng: người học được nhắc ngay trong quá trình viết, giảm tình trạng nộp bài quá ngắn và bị mất điểm vì lỗi cơ bản.

### 6.4 Speaking

Phần Speaking cho phép người học đọc đề, ghi âm, nghe lại và xác nhận bản ghi trước khi nộp.

Các nghiệp vụ đã handle:

- Hỗ trợ nhiều dạng bài nói: giao tiếp xã hội, giải quyết vấn đề, thảo luận chủ đề và các dạng mở rộng khác.
- Hiển thị đề bài, tình huống, phương án, nhiệm vụ hoặc câu hỏi theo từng dạng speaking.
- Có bộ ghi âm trực tiếp trong trình duyệt.
- Hiển thị đồng hồ thời gian ghi âm và thời lượng tối đa.
- Có waveform trực quan khi đang ghi.
- Cho phép dừng ghi, nghe lại, ghi lại hoặc xác nhận bản ghi.
- Sau khi xác nhận, audio được tải lên và lưu lại thông tin bản ghi.
- Có thể ghi lại nếu chưa hài lòng.
- Theo dõi phần nào đã xác nhận bản ghi, phần nào chưa.
- Khi chuẩn bị nộp, hệ thống cảnh báo nếu còn phần Speaking chưa ghi âm.

Giá trị cho khách hàng: học viên luyện Speaking ngay trong môi trường thi thử, không cần gửi file ngoài, không cần thao tác phức tạp, và vẫn có kiểm soát từng phần rõ ràng.

## 7. Chốt Kỹ Năng Và Nộp Bài

Hệ thống không cho người học chuyển kỹ năng một cách âm thầm. Mỗi lần chuyển kỹ năng hoặc nộp bài đều có hộp xác nhận.

Các nghiệp vụ đã handle:

- Khi chốt một kỹ năng để sang kỹ năng tiếp theo, hệ thống cảnh báo không thể quay lại kỹ năng trước.
- Nếu kỹ năng hiện tại còn câu chưa trả lời, bài viết thiếu từ hoặc phần nói chưa ghi âm, hệ thống hiển thị cảnh báo cụ thể.
- Khi nộp bài, hệ thống nhắc rằng các kỹ năng trước đã chốt và sau khi nộp không thể chỉnh sửa đáp án.
- Payload nộp bài gồm câu trắc nghiệm, bài viết và bản ghi speaking theo kỹ năng đã chọn.
- Sau khi nộp thành công, hệ thống cập nhật trạng thái và chuyển sang kết quả.

Giá trị cho khách hàng: hệ thống giảm rủi ro học viên bấm nhầm, đồng thời đảm bảo bài nộp là quyết định có ý thức.

## 8. Tự Động Lưu Và Tự Động Nộp

Đây là lớp an toàn quan trọng của phòng thi online.

Các nghiệp vụ đã handle:

- Tự động lưu đáp án trắc nghiệm, bài viết, bản ghi Speaking và vị trí kỹ năng hiện tại.
- Khi người học quay lại phòng thi, hệ thống khôi phục bài làm từ bản nháp đã lưu.
- Trạng thái tự động lưu được hiển thị rõ trên màn hình.
- Nếu lưu tự động thất bại, hệ thống cảnh báo nhưng không làm gián đoạn ngay việc làm bài.
- Nếu người học refresh, đóng tab hoặc bấm back trong lúc làm bài, hệ thống cảnh báo trước.
- Khi hết giờ, hệ thống dừng làm bài và tự động nộp.
- Nếu tự động nộp lỗi, hệ thống hướng dẫn tải lại phòng thi để kiểm tra trạng thái mới nhất.

Giá trị cho khách hàng: đây là tính năng tạo niềm tin. Người học không phải lo mất bài vì lỡ thoát trang, còn trung tâm có quy trình nộp bài rõ ràng khi hết giờ.

## 9. Màn Hình Kết Quả

Sau khi nộp, người học được đưa đến màn hình kết quả. Với các kỹ năng cần chấm tự động như Writing/Speaking, hệ thống có thể tiếp tục cập nhật trạng thái cho đến khi hoàn tất.

Các nghiệp vụ đã handle:

- Hiển thị tổng điểm và nhãn kết quả tổng quan.
- Hiển thị điểm từng kỹ năng.
- Hiển thị trạng thái đang chấm, chấm một phần hoặc lỗi chấm nếu có.
- Tự động cập nhật kết quả nếu còn job chấm điểm đang pending.
- Cho phép chuyển tab để xem chi tiết từng kỹ năng.
- Lưu lịch sử để người học quay lại xem kết quả các lần làm trước.

Giá trị cho khách hàng: học viên không chỉ thấy một con số, mà thấy bức tranh năng lực theo từng kỹ năng.

## 10. Xem Lại Listening Và Reading

Với kỹ năng trắc nghiệm, hệ thống giúp người học biết câu nào sai, câu nào đúng và vì sao cần xem lại.

Các nghiệp vụ đã handle:

- Xem số câu đúng/tổng câu theo từng nhóm bài.
- Lọc riêng các câu cần xem lại.
- Xem tất cả câu nếu muốn rà soát toàn bộ.
- Hiển thị câu hỏi, đáp án người học chọn, đáp án đúng.
- Tô rõ lựa chọn sai và đáp án đúng.
- Với Listening, có thể xem transcript nếu có.
- Với Reading, có thể xem lại bài đọc.

Giá trị cho khách hàng: học viên không cần tự dò đáp án thủ công. Hệ thống biến bài thi thành một buổi chữa bài cá nhân hóa.

## 11. Xem Lại Writing Và Speaking

Với Writing/Speaking, hệ thống không dừng ở điểm số. Người học được xem bài làm, chẩn đoán, điểm theo tiêu chí và nhận xét cải thiện.

Các nghiệp vụ đã handle cho Writing:

- Hiển thị lại bài viết đã nộp.
- Hiển thị số từ.
- Hiển thị đề bài để đối chiếu.
- Nếu bài quá ngắn hoặc không đáp ứng yêu cầu tối thiểu, hệ thống có thể đánh dấu cần viết lại thay vì hiển thị điểm rubric.
- Hiển thị điểm theo các tiêu chí như Task Fulfillment, Organization, Vocabulary, Grammar.
- Hiển thị lỗi chính tả, ngữ pháp, dấu câu, số câu, số đoạn, độ đa dạng từ, từ vựng nâng cao.
- Hiển thị checklist yêu cầu: đủ số từ, bao phủ yêu cầu đề bài, format thư nếu có.
- Highlight lỗi cụ thể trong bài viết và gợi ý sửa.
- Hiển thị nhận xét AI, điểm mạnh, điểm cần cải thiện và gợi ý viết lại.

Các nghiệp vụ đã handle cho Speaking:

- Hiển thị lại bản ghi âm đã nộp.
- Hiển thị đề bài để đối chiếu.
- Hiển thị điểm theo tiêu chí như Fluency, Pronunciation, Discourse Management, Vocabulary, Grammar.
- Hiển thị chẩn đoán bài nói như tốc độ nói, số lần ngắt nghỉ, số từ, phát âm, độ tin cậy transcript và mức độ nội dung.
- Cảnh báo nếu có từ/ngữ không phù hợp trong bài nói học thuật.
- Hiển thị nhận xét AI và các gợi ý cải thiện.

Giá trị cho khách hàng: đây là phần tạo khác biệt lớn so với việc chỉ bán đề thi. Người học nhận được phản hồi có hướng dẫn, giúp biết cần sửa gì để tăng band.

## 12. Yêu Cầu Giáo Viên Chấm

Sau khi có kết quả tự động cho Writing/Speaking, người học có thể yêu cầu giáo viên chấm để có đánh giá chuyên sâu hơn.

Các nghiệp vụ đã handle:

- Chỉ hiển thị lựa chọn giáo viên chấm khi bài có thể yêu cầu.
- Hiển thị chi phí xu cho yêu cầu chấm giáo viên.
- Khi gửi yêu cầu, hệ thống trừ xu và cập nhật ví.
- Hiển thị trạng thái chờ phân công giáo viên.
- Hiển thị trạng thái đã phân công giáo viên.
- Hiển thị trạng thái giáo viên đang chấm.
- Khi hoàn tất, hiển thị điểm giáo viên, điểm theo tiêu chí và feedback giáo viên.
- Xử lý trạng thái yêu cầu bị từ chối hoặc bị hủy.

Giá trị cho khách hàng: hệ thống có thể vận hành mô hình hybrid giữa AI và giáo viên thật. AI giúp phản hồi nhanh, giáo viên giúp tăng độ tin cậy và chiều sâu cho các bài quan trọng.

## 13. Các Rủi Ro Nghiệp Vụ Đã Được Chặn

Luồng Exam User đã xử lý nhiều tình huống thực tế thường gặp khi thi online:

- Người học không đủ xu nhưng vẫn muốn bắt đầu: hệ thống chuyển sang nạp xu.
- Người học có bài đang làm dở: hệ thống cho tiếp tục thay vì tạo lượt mới lung tung.
- Người học muốn làm lại: hệ thống cảnh báo mất lượt cũ và bị trừ xu lượt mới.
- Người học chưa chọn kỹ năng ở chế độ luyện riêng: không cho bắt đầu.
- Người học quên kiểm tra loa/mic: có màn hình kiểm tra trước khi tính giờ.
- Người học rời phòng thi nhầm: có cảnh báo trước khi rời.
- Người học refresh hoặc mất kết nối: có tự động lưu để khôi phục.
- Người học hết giờ nhưng chưa nộp: hệ thống tự nộp.
- Người học còn câu/phần chưa hoàn thành: hệ thống cảnh báo trước khi chốt/nộp.
- Người học bấm chuyển kỹ năng: hệ thống nhắc không thể quay lại.
- Audio Listening đã phát: hệ thống không cho phát lại tùy tiện.
- Speaking chưa upload/xác nhận bản ghi: hệ thống chưa tính là hoàn thành.
- Writing quá ngắn hoặc không đạt yêu cầu: hệ thống cảnh báo và có thể không hiển thị điểm rubric.
- Chấm AI chưa xong: kết quả tự cập nhật định kỳ.
- Người học muốn đánh giá sâu hơn: có luồng yêu cầu giáo viên chấm.

## 14. Những Nghiệp Vụ Đã Handle Trong Code

Tóm tắt các nhóm nghiệp vụ đã được hiện thực trong luồng frontend hiện tại:

- Thư viện đề thi: tìm kiếm, lọc trạng thái, sắp xếp, phân trang, trạng thái rỗng.
- Thẻ đề thi: thời lượng, nguồn đề, tag, độ phổ biến, trạng thái cá nhân, nút tiếp tục hoặc vào chi tiết.
- Chi tiết đề thi: thông tin đề, cấu trúc kỹ năng, lịch sử làm bài, xem lại kết quả.
- Chọn phạm vi: full test hoặc luyện kỹ năng riêng.
- Tính phí và thời gian: phí full test, phí theo kỹ năng, giới hạn không vượt full test, chuẩn/chậm/nhanh.
- Ví xu: kiểm tra số dư, mở nạp xu, trừ xu khi bắt đầu hoặc yêu cầu giáo viên chấm.
- Xử lý bài active: tiếp tục, làm lại, cảnh báo hủy lượt cũ.
- Kiểm tra thiết bị: nghe thử, thu âm thử, hiển thị cấu trúc bài trước khi tính giờ.
- Phòng thi active: đồng hồ, tiến độ, trạng thái lưu, điều hướng kỹ năng.
- Autosave: lưu nháp trắc nghiệm, Writing, Speaking và vị trí kỹ năng.
- Chống thoát nhầm: cảnh báo khi đóng tab/refresh/back/rời phòng.
- Listening: kiểm soát lượt phát audio, part/section, câu hỏi, tiến độ câu trả lời.
- Reading: split view bài đọc/câu hỏi, highlight passage, điều hướng câu.
- Writing: editor, đếm từ, progress số từ, cảnh báo thiếu từ.
- Speaking: ghi âm, waveform, nghe lại, upload, xác nhận hoặc ghi lại.
- Chốt kỹ năng: xác nhận trước khi sang kỹ năng tiếp theo, không quay lại kỹ năng đã chốt.
- Nộp bài: cảnh báo phần chưa hoàn thành, submit trắc nghiệm/bài viết/bản ghi.
- Tự nộp hết giờ: tự submit khi timer về 0, xử lý lỗi tự nộp.
- Kết quả: tổng điểm, điểm kỹ năng, trạng thái đang chấm/chấm lỗi/chấm một phần.
- Review trắc nghiệm: câu đúng/sai/chưa làm, đáp án đúng, đáp án đã chọn, transcript/bài đọc.
- Review Writing/Speaking: bài làm, audio, rubric, diagnostics, feedback, rewrite suggestions.
- Giáo viên chấm: gửi yêu cầu, trừ xu, trạng thái phân công/đang chấm/hoàn tất/từ chối/hủy.

## 15. Kết Luận Để Trình Bày Với Khách Hàng

Luồng Exam User của VSTEP đã được xây dựng như một sản phẩm thi thử hoàn chỉnh, không chỉ là một form làm bài. Người học có thể chọn đề, chọn cách luyện, được chuẩn bị thiết bị, làm bài trong phòng thi có kiểm soát, được tự động lưu bài, tự nộp khi hết giờ, nhận kết quả và xem lại lỗi chi tiết.

Điểm mạnh nhất khi sale chức năng này là khả năng biến một bài thi thử thành dữ liệu học tập có giá trị. Sau mỗi lượt làm, học viên không chỉ biết điểm, mà biết phần nào yếu, câu nào sai, bài viết/bài nói gặp lỗi gì, và nếu cần vẫn có thể nâng cấp lên giáo viên chấm thật. Đây là nền tảng để trung tâm vừa bán được trải nghiệm luyện thi online, vừa vận hành được dịch vụ chấm chữa bài có tính mở rộng.
