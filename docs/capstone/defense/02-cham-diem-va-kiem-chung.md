# 02. Chấm điểm, kiểm chứng và Q&A

## Cách dùng file này

File này là **deep dive/backup**, không phải toàn bộ nội dung main deck. Main deck chỉ cần nói ngắn: AI không quyết định điểm cuối, hệ thống tính theo rubric/formula, Writing/Speaking là điểm luyện tập tham khảo.

## Message chính

> AI không quyết định điểm cuối. Hệ thống dùng rubric/formula do nhóm kiểm soát; AI/công cụ ngoài chỉ hỗ trợ trích xuất tín hiệu và tạo feedback.

## Thi thử: cách định vị

| Kỹ năng | Cách chấm | Cách nói |
|---|---|---|
| Listening / Reading | Theo đáp án | Khách quan hơn vì có đáp án đúng/sai. |
| Writing / Speaking | Ước lượng theo tiêu chí | Điểm tham khảo để luyện tập, không phải điểm chính thức. |

Mục đích bài thi thử: mô phỏng trải nghiệm thi, ước lượng năng lực, phát hiện điểm yếu và cập nhật learning path từ dữ liệu bài thi thử.

## Scoring formula backup

### Tầng tính điểm trong code

| Tầng | Công thức/cách tính | Ghi chú |
|---|---|---|
| Listening / Reading skill | `round(correct_answers / total_questions * 10, 0.1)` | Câu chưa trả lời vẫn nằm trong mẫu số. |
| Writing task | `round_to_0.5(weighted_average(Task Fulfillment, Organization, Grammar, Vocabulary))` | Trọng số lấy từ rubric version đang active. |
| Writing skill trong bài thi thử | `round_to_0.5((Task 1 + 2 × Task 2) / 3)` | Chỉ có điểm khi cả hai task đã được chấm. |
| Speaking task/part | `round_to_0.5(weighted_average(Grammar, Vocabulary, Fluency, Discourse, Pronunciation))` | Trọng số lấy từ rubric version đang active. |
| Speaking skill trong bài thi thử | Trung bình các part/submission đã có `overall_band` | Part chưa có band không vào trung bình; nếu chưa có part nào thì chưa có skill score. |
| Overall full-test | `round_to_0.5((Listening + Reading + Writing + Speaking) / 4)` | Chỉ hiện khi đủ 4 kỹ năng có điểm. |

### Writing

```text
Writing task score = round_to_0.5(weighted_average(Task Fulfillment, Organization, Grammar, Vocabulary))
Writing test score = round_to_0.5((Task 1 + 2 × Task 2) / 3)
```

| Tiêu chí | Tín hiệu đầu vào | Vai trò |
|---|---|---|
| Task Fulfillment | yêu cầu được đáp ứng, độ bám đề, độ dài bài | tính điểm nội dung, giới hạn bài lạc đề/quá ngắn |
| Organization | số đoạn, từ nối, mạch lạc, định dạng Task 1 | tính điểm bố cục |
| Grammar | lỗi ngữ pháp/chính tả/dấu câu, cấu trúc câu | tính điểm kiểm soát ngôn ngữ |
| Vocabulary | mức CEFR, độ đa dạng, collocation, lỗi chính tả | tính điểm vốn từ |

### Speaking

```text
Speaking part score = round_to_0.5(weighted_average(Grammar, Vocabulary, Fluency, Discourse Management, Pronunciation))
Speaking test score = average(part overall bands)
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
| UI label “AI chấm” | shorthand trên giao diện cho luồng phân tích/chấm tự động | AI là giám khảo hoặc tự quyết định điểm cuối |

Nếu slide nói “tiêu chí từ Bộ Giáo dục”, cần có nguồn trích dẫn. Nếu không có nguồn chính thức trong slide, nói an toàn hơn: hệ thống bám định dạng VSTEP công khai và dùng tiêu chí chấm minh bạch do nhóm cấu hình.

## Rubric versioning / cập nhật tiêu chí

| Điểm cần chứng minh | Cách nói |
|---|---|
| Tiêu chí có version | Bộ tiêu chí chấm được lưu theo skill và version. |
| Không sửa kết quả cũ | Kết quả chấm giữ liên kết với version tiêu chí đã dùng tại thời điểm chấm. |
| Admin cập nhật | Admin tạo draft từ version cũ, chỉnh cấu hình, simulate rồi activate version mới. |
| Một version active | Mỗi skill chỉ có một version tiêu chí đang được áp dụng tại một thời điểm. |

> Khi tiêu chí thay đổi, hệ thống không sửa trực tiếp active version hoặc kết quả lịch sử. Admin tạo version mới, kiểm tra, rồi activate để các bài sau dùng version mới.

## Learning path/progress: căn cứ dữ liệu

| Phần hiển thị | Căn cứ trong hệ thống | Cách nói an toàn |
|---|---|---|
| Dashboard năng lực 4 kỹ năng | Điểm từ các exam session gần nhất | “Trung bình từ bài thi thử đã làm”, không nói năng lực chính thức. |
| Score trend | Lịch sử điểm các phiên thi đã nộp | “Theo dõi tiến độ qua các lần thi thử.” |
| Activity heatmap/streak | Bảng hoạt động hằng ngày theo practice/exam/vocab | “Theo dõi thói quen luyện tập.” |
| Learning path | Target profile, band kỹ năng, vocab SRS coverage, grammar practice coverage | “Gợi ý học tiếp từ dữ liệu bài thi thử và tiến độ luyện tập.” |
| Risk learners trong course | Backend rule-based endpoint theo band/streak/deadline | Nếu hỏi, nói là rule-based support/hướng phát triển, chưa claim predictive accuracy. |

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

## Q&A scope alignment

### Phiếu đăng ký có predictive analytics, hiện làm đến đâu?

Hiện sản phẩm có báo cáo tiến độ, điểm yếu kỹ năng và gợi ý học tập dựa trên dữ liệu bài thi thử. Backend có rule-based risk endpoint cho học viên trong khóa, nhưng chưa trình bày như mô hình dự đoán đã được kiểm chứng nếu chưa có UI/demo và báo cáo đánh giá riêng.

### Có placement test riêng không?

Chưa có placement test riêng. Người học thiết lập profile/mục tiêu trong onboarding, sau đó bài thi thử/luyện tập đầu tiên được dùng làm baseline cho tiến độ và learning path.

### Adaptive exercise đã hoàn chỉnh chưa?

Chưa theo nghĩa dynamic difficulty toàn hệ thống. Hiện hệ thống adaptive ở mức gợi ý luyện tập theo skill gap và ôn từ vựng theo SRS. Dynamic difficulty là hướng phát triển.

### Teacher có giao module cá nhân hóa chưa?

Chưa. Teacher portal hiện hỗ trợ lịch dạy, booking 1-1 và đơn nghỉ. Giao module cá nhân hóa hoặc dashboard phân tích sâu cho giáo viên là future work.

### 99% uptime / dưới 3 giây thì sao?

Chưa có báo cáo SLA/benchmark production nên không claim. Writing/Speaking là tác vụ nặng và xử lý qua background job.

### Giao diện có chữ “AI chấm”, giải thích sao?

Đó là shorthand trên UI cho luồng chấm tự động. Khi bảo vệ, giải thích rõ: AI/công cụ ngoài hỗ trợ phân tích tín hiệu và feedback; điểm cuối lưu trong kết quả được tính theo rubric/formula của hệ thống, kèm evidence và calculation trace.

### Không có VSTEP chuẩn thì chứng minh bằng gì?

Bằng tiêu chí chấm rõ ràng, tín hiệu có nguồn tham chiếu, bộ mẫu kiểm thử nội bộ, tình huống rủi ro và căn cứ chấm điểm có thể kiểm tra lại.

## Không nên nói

- “Độ chính xác 100%.”
- “Hệ thống chấm chuẩn VSTEP.”
- “AI thay giám khảo.”
- “Thi thử ra điểm giống kỳ thi thật.”
- “Đã chứng minh dự đoán kết quả học tập chính xác.”
- “Teacher dashboard đã phân tích sâu điểm yếu học viên” nếu không demo được màn đó.
- “Mobile có đầy đủ mọi chức năng admin/web.”
- “Hệ thống đạt 99% uptime” nếu chưa có số liệu vận hành.
- “Tất cả xử lý dưới 3 giây” nếu chưa có báo cáo đo kiểm.
