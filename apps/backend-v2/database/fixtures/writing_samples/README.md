# Bộ mẫu kiểm chứng Writing

Thư mục này chứa các bài Writing dùng bởi lệnh `php artisan validate:assessment-engine`.

## Ghi chú ngắn cho hội đồng

Nhóm tách dữ liệu kiểm chứng thành hai bộ:

- **Benchmark có nguồn**: bài viết đã có điểm và nhận xét từ nguồn độc lập, dùng để đo độ khớp CEFR.
- **Guardrail theo VSTEP**: tình huống rủi ro như lạc đề, quá ngắn, copy đề, spam hoặc không phải tiếng Anh, dùng để kiểm tra hệ thống không chấm cao sai lệch.

VSTEP là chuẩn mục tiêu của hệ thống. Cambridge/FCE chỉ là benchmark phụ vì có bài mẫu kèm điểm/nhận xét từ nguồn độc lập.

Hai bộ này không trộn lẫn với nhau để tránh làm nhiễu số liệu đánh giá.

## Cách xem nhanh

Benchmark sample chỉ cần đọc các dòng này:

```yaml
sample_id: "cambridge-fce-environment-001-grade3"
source_id: "cambridge_b2_first"
expected_level: "B1"
source_grade: 3
criterion_grades:
  task_fulfillment: 3
  organization: 3
  vocabulary: 3
  grammar: 3
```

- `source_grade`: điểm gốc từ nguồn.
- `criterion_grades`: điểm từng tiêu chí từ nguồn.
- `expected_level`: mức năng lực tham chiếu dùng để so sánh.

Guardrail sample chỉ cần đọc các dòng này:

```yaml
sample_id: "guardrail-writing-off-topic-001"
reference_id: "vstep_writing"
risk_type: "off_topic"
expected_behavior:
  max_level: "Không đạt"
  max_band: 3.5
criterion_scores:
  task_fulfillment: 2.0
  organization: 4.0
  vocabulary: 5.0
  grammar: 6.0
```

- `risk_type`: loại rủi ro cần kiểm tra.
- `reference_id`: chuẩn format/rubric mục tiêu, hiện là VSTEP Writing.
- `expected_behavior`: giới hạn hệ thống không được vượt qua.

## Ghi chú kỹ thuật

Nguyên tắc:

- Chỉ đưa vào các mẫu có nguồn và thang đánh giá rõ ràng.
- Không đưa vào bài tự gán nhãn CEFR hoặc điểm số cảm tính.
- Metadata bắt buộc phải có trong frontmatter; thiếu thông tin thì validator báo lỗi rõ, không tự đoán.
- Metadata nguồn/thang điểm được khai báo một lần trong `sources/*.yaml`.
- Mỗi sample chỉ lưu source id, CEFR kỳ vọng, điểm gốc từ nguồn và điểm từng tiêu chí.
- Quy đổi sang band nội bộ chỉ dùng để kiểm thử trong ứng dụng, không phải tuyên bố quy đổi chính thức từ nguồn.
- `b1_plus_accept_b1_or_b2` chỉ dùng cho các mẫu có nguồn và nằm ở biên B1+/B2.

Frontmatter bắt buộc:

Benchmark:

```yaml
sample_type: "benchmark"
sample_id: "stable-id"
source_id: "cambridge_b2_first"
label: "Human-readable label"
expected_level: "B1|B2|C1|Không đạt"
expected_level_policy: "strict|b1_plus_accept_b1_or_b2"
source_grade: 3
criterion_grades:
  task_fulfillment: 3
  organization: 3
  vocabulary: 3
  grammar: 3
```

Guardrail:

```yaml
sample_type: "guardrail"
sample_id: "stable-id"
reference_id: "vstep_writing"
risk_type: "off_topic|too_short|copied_prompt|repeated_spam|non_english"
task_type: "writing_task_2_essay"
expected_behavior:
  max_level: "B1|Không đạt"
  max_band: 4.0
reason: "Lý do cần case này"
criterion_scores:
  task_fulfillment: 2.0
  organization: 2.0
  vocabulary: 2.0
  grammar: 2.0
```

Lệnh kiểm chứng:

```bash
php artisan validate:assessment-engine --suite=benchmark
php artisan validate:assessment-engine --suite=guardrail
php artisan validate:assessment-engine --suite=all --technical
```

Bộ nguồn hiện tại:

- VSTEP Writing nằm trong `references/vstep_writing.yaml`, dùng làm chuẩn mục tiêu cho format/rubric và guardrail.
- Cambridge B2 First writing samples, dùng thang đánh giá Cambridge 0–5.
- Chi tiết nguồn và calibration nội bộ nằm trong `sources/cambridge_b2_first.yaml`.
- Các mẫu VSTEP/ZIM tìm được trong quá trình research chưa được đưa vào golden set vì chủ yếu là đề/bài mẫu gợi ý, không phải bài làm thí sinh có điểm giám khảo ổn định.
