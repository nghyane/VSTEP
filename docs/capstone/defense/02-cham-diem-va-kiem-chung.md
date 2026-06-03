# 02. Chấm điểm và kiểm chứng

## Message chính

> AI không quyết định điểm cuối. Hệ thống dùng công thức chấm cố định do nhóm kiểm soát; AI/công cụ ngoài chỉ hỗ trợ trích xuất tín hiệu và tạo feedback.

## Thi thử: cách định vị

| Kỹ năng | Cách chấm | Cách nói |
|---|---|---|
| Listening / Reading | Theo đáp án | Khách quan hơn vì có đáp án đúng/sai. |
| Writing / Speaking | Ước lượng theo tiêu chí | Điểm tham khảo để luyện tập, không phải điểm chính thức. |

Mục đích bài thi thử: mô phỏng trải nghiệm thi, ước lượng năng lực, phát hiện điểm yếu và cập nhật lộ trình học từ dữ liệu bài thi thử.

## Công thức chấm cần đưa vào slide

### Writing

```text
Writing score = round_half((TF + Organization + Grammar + Vocabulary) / 4)
```

| Tiêu chí | Tín hiệu đầu vào | Vai trò |
|---|---|---|
| Task Fulfillment | yêu cầu được đáp ứng, độ bám đề, độ dài bài | tính điểm nội dung, giới hạn bài lạc đề/quá ngắn |
| Organization | số đoạn, từ nối, mạch lạc, định dạng Task 1 | tính điểm bố cục |
| Grammar | lỗi ngữ pháp/chính tả/dấu câu, cấu trúc câu | tính điểm kiểm soát ngôn ngữ |
| Vocabulary | mức CEFR, độ đa dạng, collocation, lỗi chính tả | tính điểm vốn từ |

### Speaking

```text
Speaking score = round_half((Grammar + Vocabulary + Fluency + Discourse + Pronunciation) / 5)
```

| Tiêu chí | Tín hiệu đầu vào | Vai trò |
|---|---|---|
| Pronunciation | độ chính xác phát âm, độ trôi chảy, ngữ điệu | tính điểm phát âm tham khảo |
| Fluency | tốc độ nói, khoảng ngắt, độ dài câu trả lời | đánh giá khả năng duy trì lời nói |
| Discourse | mức bám đề, từ nối, phát triển ý | tránh chấm cao câu trả lời lạc đề/quá ngắn |
| Grammar/Vocabulary | lỗi trong bản ghi lời nói, mức từ vựng, cấu trúc câu | tính điểm ngôn ngữ |

## Vai trò của AI/công cụ ngoài

| Thành phần | Vai trò đúng | Không nói |
|---|---|---|
| AI | hỗ trợ phân tích yêu cầu, bám đề, tạo feedback | AI tự chấm điểm |
| Công cụ kiểm tra ngôn ngữ | phát hiện lỗi ngữ pháp/chính tả/dấu câu | công cụ này quyết định điểm grammar |
| Nhận dạng giọng nói | tạo bản ghi lời nói và tín hiệu phát âm | dịch vụ này quyết định điểm Speaking |
| Công thức hệ thống | tổng hợp tín hiệu thành điểm cuối | phụ thuộc 100% vào AI |

Nếu slide nói “tiêu chí từ Bộ Giáo dục”, cần có nguồn trích dẫn. Nếu không có nguồn chính thức trong slide, nói an toàn hơn: hệ thống bám định dạng VSTEP công khai và dùng tiêu chí chấm minh bạch do nhóm cấu hình.

## Guardrails / tình huống rủi ro

- Bài quá ngắn.
- Lạc đề.
- Copy đề.
- Spam/lặp câu.
- Không phải tiếng Anh.
- Bài nói/bản ghi lời nói quá ngắn hoặc độ tin cậy nhận dạng thấp.

## Kiểm chứng hiện tại

Không có bộ dữ liệu VSTEP chính thức do giám khảo chấm, nên không claim official accuracy. Nhóm chứng minh bằng kiểm thử nội bộ:

| Nhóm kiểm chứng | Kết quả có thể nêu |
|---|---|
| Bộ mẫu đối chiếu có nguồn | 9/9 khớp CEFR, 9/9 trong ±0.5 band |
| Tình huống rủi ro | 5/5 đạt |
| Writing theo quy trình đầy đủ | 9/9 mẫu trong ±0.5 band, sai số tuyệt đối trung bình 0.33 band |

## Ôn tập ngắt quãng / SRS

Chỉ nói ngắn trên slide:

> Hệ thống có cơ chế ôn tập ngắt quãng cho từ vựng. Đây là phần hỗ trợ học tập; nếu hội đồng hỏi sâu thì mở slide “See detail”.

Không cần trình bày sâu thuật toán nếu không bị hỏi.

## Q&A chuẩn

### Hệ thống có chỉ là app chấm điểm không?

Không. Chấm điểm là một phần lõi. Sản phẩm gồm luyện 4 kỹ năng, thi thử, phản hồi Writing/Speaking, học từ vựng/ngữ pháp, lộ trình học và bảng tiến độ.

### Bài thi thử có ý nghĩa gì nếu Writing/Speaking không chính thức?

Bài thi thử giúp mô phỏng trải nghiệm thi và ước lượng năng lực. Điểm Writing/Speaking là tham khảo để phát hiện điểm yếu và định hướng luyện tập.

### Không có VSTEP chuẩn thì chứng minh bằng gì?

Bằng tiêu chí chấm rõ ràng, tín hiệu có nguồn tham chiếu, bộ mẫu kiểm thử nội bộ, tình huống rủi ro và căn cứ chấm điểm có thể kiểm tra lại.

### Phiếu đăng ký có predictive analytics, hiện làm đến đâu?

Hiện sản phẩm có báo cáo tiến độ, điểm yếu kỹ năng và gợi ý học tập dựa trên dữ liệu bài thi thử. Mô hình dự đoán kết quả/rủi ro học tập là hướng phát triển nếu chưa có đánh giá riêng.

## Không nên nói

- “Độ chính xác 100%.”
- “Hệ thống chấm chuẩn VSTEP.”
- “AI thay giám khảo.”
- “Thi thử ra điểm giống kỳ thi thật.”
- “Đã chứng minh dự đoán kết quả học tập chính xác.”
- “Hệ thống đạt 99% uptime” nếu chưa có số liệu vận hành.
- “Tất cả xử lý dưới 3 giây” nếu chưa có báo cáo đo kiểm.
