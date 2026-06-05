# Logic tính điểm năng lực và lọc nhiễu

File này ghi lại logic đã thống nhất cho dashboard learner, đặc biệt khi user thi thử một kỹ năng nhiều lần hoặc có lượt điểm rất thấp bất thường.

## 1. Vấn đề ban đầu

Dashboard có các khu vực hiển thị điểm:

- `Overview` / Tổng quan 4 kỹ năng.
- `Kỹ năng` trong trang luyện tập.
- `Điểm qua các lần thi`.
- `Năng lực 4 kỹ năng` / spider chart.

Trước đó có tình huống:

- Overview lấy điểm mới nhất nên Listening có thể hiện `0.0 / 10`.
- Kỹ năng/Luyện tập lấy điểm trung bình nên Listening vẫn hiện `6.8 / ≥6.0`.

Điều này gây mâu thuẫn: cùng một kỹ năng nhưng hai nơi hiển thị khác nhau.

## 2. Quyết định chính

Hai phần sau phải dùng cùng logic điểm trung bình/năng lực hiện tại:

- Overview.
- Kỹ năng/Luyện tập.

Không dùng điểm mới nhất đơn lẻ để đại diện năng lực hiện tại.

## 3. Phân biệt lịch sử thi và năng lực hiện tại

### Lịch sử thi

`Điểm qua các lần thi` vẫn hiển thị điểm thật của từng lượt thi.

Ví dụ nếu user thường 8–9 điểm nhưng hôm nay làm được 1–2 điểm, biểu đồ lịch sử vẫn phải hiện lượt 1–2 đó.

Mục đích: minh bạch lịch sử.

### Năng lực hiện tại

`Overview`, `Kỹ năng`, `Spider chart` dùng điểm năng lực đã tính trung bình và có lọc nhiễu.

Mục đích: không để một lượt bất thường kéo tụt toàn bộ đánh giá.

## 4. Điểm 0, 1, 2 được hiểu thế nào?

Điểm thấp không tự động bị xóa.

Một lượt 0–2 có thể là:

- user thật sự làm yếu;
- user nộp trắng;
- user test hệ thống;
- lỗi mạng/lỗi submit;
- user chỉ làm một kỹ năng;
- bài bị thiếu dữ liệu.

Vì vậy:

- vẫn lưu và hiển thị trong lịch sử;
- không cho một lượt duy nhất kéo tụt mạnh năng lực;
- nếu điểm thấp lặp lại nhiều lần, coi đó là xu hướng thật.

## 5. Median score là gì?

Median score là điểm trung vị.

Cách tính:

1. Sắp xếp danh sách điểm từ thấp đến cao.
2. Lấy điểm nằm giữa.
3. Nếu số lượng điểm là chẵn, lấy trung bình của hai điểm giữa.

Ví dụ:

```txt
8.5, 8.8, 8.2, 9.0, 1.5
```

Sắp xếp:

```txt
1.5, 8.2, 8.5, 8.8, 9.0
```

Median là:

```txt
8.5
```

Median chống nhiễu tốt hơn trung bình cộng, vì một điểm quá thấp không kéo tụt mạnh kết quả.

## 6. Ngưỡng `-3.0` là gì?

Rule outlier hiện tại:

```txt
score < comparison_median - 3.0
```

Nghĩa là nếu một điểm thấp hơn phong độ gần đây từ 3 điểm trở lên thì coi là bất thường. Backend dùng median của các điểm còn lại trong window để so sánh, nên có thể phát hiện cả outlier nằm giữa lịch sử chứ không chỉ điểm mới nhất.

Ví dụ:

```txt
history_median = 8.5
outlier threshold = 8.5 - 3.0 = 5.5
latest_score = 1.5
```

Vì `1.5 < 5.5`, lượt này là điểm tụt bất thường.

## 7. Rule lọc nhiễu hiện tại

Áp dụng cho từng kỹ năng riêng biệt.

Điều kiện:

```txt
Nếu có ít nhất 5 điểm kỹ năng:
  duyệt các điểm trong window gần đây
  lấy median của các điểm còn lại
  nếu điểm đang xét thấp hơn median từ 3.0 điểm trở lên:
    nếu điểm liền trước và liền sau không thấp bất thường:
      coi là isolated outlier và bỏ khỏi trung bình năng lực
    nếu có điểm thấp liền kề:
      giữ lại, coi là cụm thấp/xu hướng thật
```

Nói ngắn gọn:

```txt
1 lần tụt sâu: nghi là nhiễu
2 lần tụt sâu liên tiếp: có thể là năng lực thật đang giảm
```

### Trường hợp thấp rồi cao lại

Logic backend đã được nâng cấp để lọc **isolated outlier** trong toàn bộ window gần đây, không chỉ điểm mới nhất.

Do đó:

#### Case A — bài thấp là bài mới nhất

```txt
8.6, 8.8, 8.4, 9.0, 8.7, 1.7
```

Kết quả:

```txt
1.7 được xem là outlier đơn lẻ và chưa kéo tụt năng lực hiện tại.
```

#### Case B — bài thấp rồi bài sau cao lại

```txt
8.6, 8.8, 8.4, 9.0, 1.7, 8.7
```

Kết quả:

```txt
1.7 nằm giữa các điểm cao ổn định nên được xem là isolated outlier.
Điểm này vẫn hiển thị trong lịch sử nhưng không kéo tụt năng lực hiện tại.
```

Rule hiện tại:

```txt
Nếu một điểm thấp bất thường,
và điểm trước/sau nó không thấp bất thường,
thì coi là outlier đơn lẻ và không tính vào năng lực.

Nếu có 2 điểm thấp liên tiếp,
thì coi là xu hướng thật và tính vào năng lực.
```

Ví dụ:

```txt
8.6, 8.8, 1.7, 8.7, 8.9
=> 1.7 là isolated outlier, nên bỏ khỏi năng lực.

8.6, 8.8, 1.7, 2.0, 8.9
=> 1.7 và 2.0 là cụm thấp liên tiếp, nên tính vào năng lực.
```

## 8. Ví dụ đã seed để test

Profile:

```txt
learner@vstep.test
Minh
```

Dữ liệu đã seed:

```txt
Lượt 1: khoảng 8–9
Lượt 2: khoảng 8–9
Lượt 3: khoảng 8–9
Lượt 4: khoảng 8–9
Lượt 5: khoảng 8–9
Lượt 6 mới nhất: khoảng 1–2
```

Kết quả mong đợi:

```txt
Overview / Kỹ năng / Spider chart: vẫn khoảng 8.x
Điểm qua các lần thi: vẫn thấy lượt mới nhất 1–2
```

## 9. Những thay đổi đã implement

### Backend

File:

```txt
apps/backend-v2/app/Services/ProgressService.php
```

Thay đổi:

- Thêm `ROBUST_MIN_SAMPLES = 5`.
- Thêm `OUTLIER_DROP_THRESHOLD = 3.0`.
- `computeChart()` không dùng average thô nữa.
- Listening/Reading/Writing/Speaking đều đi qua `robustAvgBand()`.
- `robustAvgBand()` bỏ isolated outlier trong window gần đây nếu đủ điều kiện.
- Nếu có hai outlier liên tiếp thì không bỏ nữa.
- Trả thêm `overview.scores.quality` để frontend hiển thị cảnh báo theo đúng kết luận backend, tránh frontend tự đoán lệch.

Nguồn dữ liệu trả về:

```txt
overview.scores.spider
```

Đây là điểm năng lực hiện tại dùng cho:

- Overview;
- Kỹ năng/Luyện tập;
- Spider chart;
- predicted level.

Metadata cảnh báo:

```txt
overview.scores.quality = {
  status: "normal" | "single_outlier" | "consecutive_low",
  has_outlier: boolean,
  consecutive_low: boolean,
  outlier_skills: SkillKey[]
}
```

Ý nghĩa:

```txt
status: mã trạng thái để frontend tự map nội dung cảnh báo.
has_outlier: lượt mới nhất có kỹ năng tụt bất thường.
consecutive_low: có ít nhất một kỹ năng tụt thấp 2 lượt liên tiếp.
outlier_skills: danh sách kỹ năng bị ảnh hưởng.
```

Backend không trả câu chữ UI trực tiếp; frontend map message từ `status`.

Chart cũng trả sample size theo từng kỹ năng:

```txt
overview.scores.spider.skill_sample_sizes = {
  listening: number,
  reading: number,
  writing: number,
  speaking: number
}
```

Mục đích: tránh hiểu nhầm `sample_size` là số mẫu bằng nhau cho cả 4 kỹ năng.

### Frontend Overview

File:

```txt
apps/frontend-v3/src/features/dashboard/components/StatsRow.tsx
```

Thay đổi:

- Overview không lấy latest score từ timeline nữa.
- Overview lấy điểm từ `scores.spider`.
- Bỏ badge `vs bài trước`.
- Hiển thị nhãn `Trung bình gần đây`.

### Frontend ScoreTrend

File:

```txt
apps/frontend-v3/src/features/dashboard/components/ScoreTrend.tsx
```

Thay đổi:

Trước đây:

```ts
const v = test[s.key] ?? 0
```

Điều này biến điểm thiếu `null` thành `0`, gây hiểu nhầm.

Hiện tại:

```ts
const v = test[s.key]
if (v === null) return null
```

Nghĩa là nếu thiếu điểm thì không vẽ cột 0 giả.

Ngoài ra, `ScoreTrend` hiện có thêm cảnh báo dựa trên `overview.scores.quality.status` do backend trả về:

```txt
Lượt thi mới nhất thấp bất thường so với phong độ gần đây. Hệ thống vẫn ghi nhận trong lịch sử, nhưng cần thêm 1 lượt xác nhận trước khi cập nhật năng lực hiện tại.
```

Nếu điểm thấp xuất hiện 2 lượt liên tiếp, backend trả cảnh báo khác:

```txt
Điểm thấp đã xuất hiện ở ít nhất 2 lượt liên tiếp. Hệ thống đã bắt đầu cập nhật năng lực hiện tại theo xu hướng mới.
```

Điều kiện do backend xác định cho lượt mới nhất:

```txt
- Có ít nhất 5 điểm của kỹ năng đó.
- Điểm kỹ năng mới nhất thấp hơn median lịch sử của chính kỹ năng đó từ 3.0 điểm trở lên.
- Nếu lượt liền trước chưa thấp: cảnh báo outlier lần đầu.
- Nếu lượt liền trước cũng thấp: cảnh báo xu hướng thấp liên tiếp.
```

Lưu ý: `robustAvgBand()` có thể lọc isolated outlier nằm giữa lịch sử, nhưng `quality.status` chỉ dùng để cảnh báo user khi **lượt mới nhất** đang bất thường hoặc có xu hướng thấp liên tiếp. Như vậy UI không cảnh báo lại các nhiễu cũ đã được khôi phục bởi điểm cao mới.

Mục đích:

```txt
Giải thích cho user vì sao biểu đồ có một lượt điểm rất thấp nhưng Overview/Kỹ năng vẫn chưa tụt ngay.
```

Label đường xanh trên biểu đồ đã đổi từ:

```txt
Trung bình
```

sang:

```txt
TB kỹ năng có điểm
```

để tránh hiểu nhầm khi user làm custom test chỉ có 1–2 kỹ năng.

Biểu đồ cũng hỗ trợ lọc nhiều kỹ năng:

```txt
- Click Nghe/Đọc/Viết/Nói để bật/tắt từng kỹ năng.
- Có thể chọn nhiều kỹ năng cùng lúc.
- Không cho tắt hết toàn bộ kỹ năng.
- Nút “Tất cả” đưa biểu đồ về 4 kỹ năng.
- Cột điểm, đường “TB kỹ năng có điểm” và tooltip đều tính theo các kỹ năng đang chọn.
```

Ví dụ:

```txt
Nếu chỉ chọn Nói, biểu đồ chỉ hiển thị Speaking và đường trung bình chính là điểm Speaking theo từng lượt.
Nếu chọn Nghe + Đọc, đường trung bình là trung bình của Nghe/Đọc có điểm trong lượt đó.
```

### Frontend DoughnutCard

File:

```txt
apps/frontend-v3/src/features/dashboard/components/DoughnutCard.tsx
```

Thay đổi:

```txt
- Donut “Số bài thi đã làm” phóng nhẹ phần đang hover.
- Legend phía dưới hover cũng đồng bộ với donut.
- Tooltip/card nổi theo vị trí phần đang hover, nằm ngoài vòng donut để không đè lên số ở giữa.
- Tooltip chỉ hiển thị điểm trung bình của kỹ năng đó, không lặp lại số lượt.
- Số lượt vẫn nằm ở center/legend như UI gốc.
```

Điểm trung bình trong tooltip được tính từ `overview.data.scores.timeline` theo từng kỹ năng:

```txt
average(skill) = trung bình các điểm khác null của kỹ năng đó trong timeline đang có
```

## 10. Các lệnh đã kiểm tra

Frontend:

```bash
bunx biome check src/features/dashboard/components/StatsRow.tsx src/features/dashboard/components/ScoreTrend.tsx
bun run build
```

Backend trong Docker:

```bash
docker compose exec backend php -l app/Services/ProgressService.php
docker compose exec backend ./vendor/bin/pint --dirty
```

Rebuild Docker local:

```bash
docker compose build backend frontend
docker compose up -d backend frontend
```

## 11. Hạn chế hiện tại

Logic hiện tại mới lọc theo điểm outlier, chưa dựa trên metadata làm bài.

Để chính xác hơn, backend nên có thêm các field như:

```txt
answered_count
total_questions
word_count
spoken_duration
is_valid_attempt
```

Khi có metadata này, hệ thống có thể loại các bài nộp trắng/làm thiếu dữ liệu chính xác hơn thay vì chỉ suy luận từ điểm thấp.

Các giới hạn cần nắm khi thuyết trình:

```txt
1. Ngưỡng 3.0 là heuristic, chưa phải chuẩn thống kê tuyệt đối.
2. Với custom test 1 kỹ năng, đường trung bình trên chart là TB kỹ năng có điểm, không phải TB đủ 4 kỹ năng.
3. Chưa có field is_valid_attempt để phân biệt bài làm thật, nộp trắng, lỗi mạng, hoặc auto-submit.
```

## 12. Ghi chú seed/test demo

Khi seed dữ liệu demo để test score/outlier, cần seed đồng bộ cả:

```txt
1. ExamSession
2. ExamMcqAnswer
3. ExamWritingSubmission / ExamSpeakingSubmission
4. AssessmentAttempt / AssessmentResult
5. ProfileDailyActivity
```

Nếu thiếu `ProfileDailyActivity`, dashboard vẫn có điểm thi nhưng phần hoạt động luyện tập/heatmap sẽ trống.

Case đã seed để test outlier một kỹ năng:

```txt
Profile: learner@vstep.test / Minh
Nghe: cao ổn định ~8.x
Đọc: cao ổn định ~8.x
Viết: cao ổn định ~8.x
Nói: lượt mới nhất thấp bất thường ~1.5
```

Kỳ vọng:

```txt
overview.scores.quality.outlier_skills = ["speaking"]
Overview/Kỹ năng vẫn giữ Speaking khoảng 8.x nếu đây là lượt thấp đầu tiên.
Biểu đồ lịch sử vẫn hiển thị Speaking 1.5 ở lượt cuối.
Notice hiển thị “Kỹ năng bị ảnh hưởng: Nói”.
Activity heatmap vẫn có ngày hoạt động tương ứng với các lượt thi.
```

## 13. Chốt logic cuối

```txt
Lịch sử thi: hiển thị điểm thật.
Năng lực hiện tại: dùng điểm trung bình đã chống nhiễu.
Một lượt tụt sâu: không kéo tụt năng lực ngay.
Một lượt tụt sâu: hiện cảnh báo giải thích cho user.
Nhiều lượt tụt sâu liên tiếp: cập nhật năng lực xuống thật và hiện cảnh báo xu hướng.
Điểm thiếu null: không hiển thị thành 0.
```

## 14. Gợi ý thuyết trình trước hội đồng

### Cách trình bày ngắn gọn

Có thể nói theo flow sau:

```txt
Trong dashboard học viên, em phân biệt hai khái niệm: lịch sử điểm và năng lực hiện tại.

Lịch sử điểm luôn hiển thị điểm thật của từng lượt thi, kể cả điểm rất thấp.

Tuy nhiên năng lực hiện tại không nên bị một lượt bất thường kéo tụt ngay, vì lượt đó có thể do nộp trắng, lỗi mạng, test hệ thống hoặc làm bài không nghiêm túc.

Vì vậy hệ thống dùng cơ chế lọc nhiễu: so sánh điểm với median của các điểm còn lại trong window gần đây. Nếu một điểm thấp hơn phong độ gần đây từ 3 điểm trở lên và không có điểm thấp liền kề, hệ thống xem đó là outlier đơn lẻ và không dùng để tính năng lực. Nếu điểm thấp lặp lại liên tiếp, hệ thống coi đó là xu hướng thật và bắt đầu điều chỉnh năng lực.

Điểm thấp không bị xóa. Nó vẫn nằm trong biểu đồ lịch sử và hệ thống hiển thị cảnh báo cho user để giải thích vì sao năng lực chưa hoặc đã bị điều chỉnh.
```

### Các câu hội đồng có thể hỏi và cách trả lời

#### Hỏi: Có phải hệ thống đang che điểm xấu không?

Trả lời:

```txt
Không. Điểm thấp vẫn được lưu và hiển thị trong lịch sử thi. Hệ thống chỉ tách riêng lịch sử điểm và năng lực hiện tại. Một điểm thấp đơn lẻ có thể là nhiễu nên chưa dùng để cập nhật năng lực ngay.
```

#### Hỏi: Vì sao chọn ngưỡng 3 điểm?

Trả lời:

```txt
Vì thang điểm là 0–10. Chênh lệch 0.5–2 điểm có thể do đề khó/dễ hoặc tâm lý làm bài. Nhưng tụt từ khoảng 8.5 xuống 1–2 là bất thường rõ ràng. Ngưỡng 3.0 là heuristic ban đầu để cân bằng giữa phát hiện nhiễu và không bỏ qua sa sút thật. Khi có dữ liệu lớn hơn, ngưỡng này có thể được hiệu chỉnh bằng thống kê thực nghiệm.
```

#### Hỏi: Nếu học viên thật sự sa sút thì sao?

Trả lời:

```txt
Nếu chỉ một lượt thấp thì hệ thống coi là nghi nhiễu. Nhưng nếu có 2 lượt thấp liên tiếp, hệ thống bắt đầu tính vào năng lực hiện tại. Như vậy hệ thống không bỏ qua xu hướng sa sút thật.
```

#### Hỏi: Nếu một bài thấp rồi bài sau cao lại thì sao?

Trả lời:

```txt
Hệ thống đã lọc isolated outlier trong window gần đây. Nếu một điểm thấp nằm giữa các điểm cao ổn định thì điểm đó vẫn hiển thị trong lịch sử nhưng không tính vào năng lực hiện tại. Nếu có cụm điểm thấp liên tiếp thì hệ thống coi là xu hướng thật và vẫn tính.
```

#### Hỏi: Nếu user chỉ thi một kỹ năng thì trung bình có đúng không?

Trả lời:

```txt
Biểu đồ lịch sử dùng nhãn “TB kỹ năng có điểm”, nghĩa là trung bình chỉ trên các kỹ năng có dữ liệu trong lượt đó. Còn năng lực từng kỹ năng vẫn tính riêng theo từng kỹ năng. Trong phiên bản nâng cấp, nếu cần đánh giá tổng thể 4 kỹ năng, hệ thống nên yêu cầu đủ dữ liệu cả 4 kỹ năng trong một khoảng thời gian nhất định.
```

#### Hỏi: Làm sao biết điểm thấp là nộp trắng hay làm thật?

Trả lời:

```txt
Hiện tại hệ thống suy luận từ biến động điểm. Đây là lớp chống nhiễu ban đầu. Để chính xác hơn, backend nên bổ sung metadata như số câu đã trả lời, thời gian làm bài, số từ bài viết, thời lượng nói và cờ is_valid_attempt. Khi đó có thể phân biệt nộp trắng/lỗi submit với bài làm thật.
```

### Nên nhấn mạnh khi bảo vệ

```txt
1. Không xóa điểm xấu.
2. Có minh bạch lịch sử.
3. Có tách “điểm từng lượt” và “năng lực hiện tại”.
4. Có cảnh báo cho user khi điểm bất thường.
5. Logic hiện tại là heuristic thực dụng, có hướng nâng cấp rõ ràng bằng metadata và thống kê.
```

### Không nên nói

Tránh nói:

```txt
Hệ thống tính chính xác tuyệt đối.
Ngưỡng 3.0 là chuẩn khoa học cố định.
Điểm 0–2 chắc chắn là lỗi.
Median giải quyết mọi trường hợp.
```

Nên nói:

```txt
Đây là cơ chế chống nhiễu ban đầu, giúp dashboard ổn định hơn và vẫn giữ minh bạch điểm thật. Hệ thống có thể nâng cấp bằng dữ liệu hành vi làm bài và hiệu chỉnh ngưỡng bằng dữ liệu thực tế.
```
