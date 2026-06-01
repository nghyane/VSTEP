# Decision Record — Assessment Scoring Principles

## Mục đích

Ghi lại các quyết định đã chốt về cơ chế chấm điểm Writing/Speaking để thống nhất khi phát triển, viết báo cáo và bảo vệ.

## Quyết định

### 1. AI không quyết định điểm cuối

Hệ thống không gửi bài làm cho AI để hỏi trực tiếp “bài này được bao nhiêu điểm”. AI chỉ hỗ trợ trích bằng chứng, hỗ trợ đánh giá độ liên quan nội dung khi cần, và tạo phản hồi diễn giải cho người học.

Điểm cuối do hệ thống tính bằng công thức rubric, trọng số và các rule kiểm soát.

### 2. Writing được tính theo rubric 4 tiêu chí

Mỗi bài Writing Task 1 hoặc Task 2 được chấm trên thang 0-10 theo 4 tiêu chí trọng số bằng nhau:

```text
Writing task band =
Task Fulfillment × 25%
+ Organization × 25%
+ Grammar × 25%
+ Vocabulary × 25%
```

| Tiêu chí | Tín hiệu sử dụng |
|---|---|
| Task Fulfillment | Số ý đúng yêu cầu, độ bám đề, ví dụ, quan điểm |
| Organization | Số đoạn, từ nối, bố cục, mạch lạc |
| Grammar | Lỗi ngữ pháp, số câu, độ đa dạng cấu trúc |
| Vocabulary | Độ đa dạng từ, từ nâng cao, lỗi chính tả |

Khi tính điểm kỹ năng Writing cho một đề thi đủ 2 task, dùng trọng số format VSTEP công khai:

```text
Final Writing band = round_half(Task 1 band × 1/3 + Task 2 band × 2/3)
```

Task 1 không bị hạ trần điểm. Task 1 và Task 2 đều có thể đạt 10/10; khác biệt nằm ở trọng số tổng hợp cuối cùng.

### 3. Speaking được tính theo rubric và tín hiệu nói

```text
Speaking Score =
Grammar × 20%
+ Vocabulary × 20%
+ Fluency × 20%
+ Discourse × 20%
+ Pronunciation × 20%
```

Các nhóm tín hiệu chính:

- Transcript dùng cho grammar/vocabulary/discourse.
- Speaking rate và pause count dùng cho fluency.
- Pronunciation score dùng cho phát âm.
- Content relevance dùng để điều chỉnh phần tổ chức/nội dung khi cần.

### 4. Không lấy trung bình đơn giản cho bài bất thường

Các trường hợp như lạc đề, quá ngắn, copy đề, lặp/spam hoặc không phải tiếng Anh phải bị giới hạn điểm bằng rule rõ ràng.

```text
Nếu Task Fulfillment/Content Relevance quá thấp
→ áp dụng content cap
→ giới hạn điểm tối đa
```

### 5. Mỗi kết quả cần có trace giải thích

Kết quả chấm cần lưu được điểm từng tiêu chí, trọng số, rule cap/penalty đã áp dụng, trace tính điểm và bằng chứng/tín hiệu đã dùng.

### 6. Chỉ giữ một rubric stable cho mỗi productive skill

Backend seed đúng một rubric active cho `writing` và một rubric active cho `speaking` để tránh drift giữa các version thử nghiệm.

Các threshold tự động như số lỗi ngữ pháp, số đoạn, từ nối, CEFR vocabulary hoặc pronunciation provider score là calibration nội bộ của hệ thống. Không trình bày các threshold này như descriptor chính thức của Bộ GD&ĐT.

## Cách trình bày khi bảo vệ

Nên nói:

```text
AI hỗ trợ trích bằng chứng và phản hồi; điểm cuối được tính bằng công thức rubric do hệ thống kiểm soát.
```

Không nên nói:

```text
AI chấm điểm bài viết/nói và trả điểm cuối.
```
