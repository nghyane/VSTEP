# Tài liệu chốt kịch bản trình bày VSTEP — 10 phút slide

Tài liệu này là bản chốt cho phần trình bày slide 10 phút. Mục tiêu: nói nhanh phần bối cảnh và tính năng, tập trung vào cơ chế chấm điểm Writing/Speaking không phụ thuộc hoàn toàn vào AI, sau đó trình bày 3 demo workflow bằng diagram. Phần này khác với demo live trên web.

---

## 1. Thông điệp chính

```text
Hệ thống không chỉ là website luyện đề VSTEP.
Hệ thống tạo vòng học tập:
Practice -> Scoring -> Feedback -> Recommendation -> Review -> Progress Tracking.

Điểm Writing/Speaking không lấy trực tiếp từ AI.
AI chỉ hỗ trợ evidence/content relevance và feedback.
Điểm cuối được backend scoring module tính bằng rubric/formula do nhóm kiểm soát.
```

Câu bắt buộc phải nói khi trình bày scoring:

```text
Hệ thống không hỏi AI "bài này mấy điểm". AI chỉ hỗ trợ phân tích bằng chứng và diễn giải feedback. Điểm cuối được tính bằng công thức trong code dựa trên rubric, trọng số và các chỉ số đầu vào.
```

---

## 2. Timeline 10 phút

| Phần | Slide | Nội dung | Thời lượng |
|---|---:|---|---:|
| 1 | 1-3 | Opening + agenda | 30s |
| 2 | 4-6 | Context + test structure + problems | 1m30s |
| 3 | 7-10 | Solution + actors + main features + learner flow | 1m00s |
| 4 | 11-16 | Core scoring mechanism | 3m00s |
| 5 | 17-19 | Anki + architecture + technology | 1m00s |
| 6 | 20-23 | Demo workflow diagram 1, 2, 3 | 2m15s |
| 7 | 24-28 | Different + achievements + limitations + conclusion + thank you | 45s |

Tổng: 10 phút.

Nguyên tắc:

- Không giải thích dài VSTEP.
- Không nói sâu Anki/FSRS, chỉ nhắc có phụ lục.
- Architecture và Technology chỉ nói tổng quan.
- Demo workflow trên slide là diagram/flow, không thao tác web live.
- Scoring mechanism là phần phải nói chắc nhất.

---

## 3. Slide-by-slide bản 10 phút

### Slide 1 — Title

**Thời lượng:** 10s

**Nội dung:**

- Tên đề tài.
- Project code: SP26SE145.
- Group: GSP26SE63.
- Web Application + Mobile App.

**Lời nói:**

```text
Kính chào hội đồng. Nhóm em xin trình bày hệ thống luyện thi VSTEP thích ứng, hỗ trợ luyện tập bốn kỹ năng, đánh giá theo rubric, phản hồi nhanh và gợi ý học tập cá nhân hóa.
```

---

### Slide 2 — Team Members

**Thời lượng:** 5s

**Nội dung:** tên 4 thành viên.

**Lời nói:**

```text
Đây là các thành viên thực hiện đề tài. Nhóm em xin chuyển nhanh vào nội dung chính.
```

---

### Slide 3 — Agenda / Strategy

**Thời lượng:** 15s

**Nội dung:** context, problems, features, scoring, demo, conclusion.

**Lời nói:**

```text
Do thời gian chỉ có 10 phút, nhóm em sẽ lướt nhanh phần bối cảnh và tập trung vào hai phần chính: cơ chế chấm điểm Writing/Speaking không phụ thuộc hoàn toàn vào AI và các demo workflow diagram.
```

---

### Slide 4 — Context: Why VSTEP Matters

**Thời lượng:** 30s

**Nội dung:**

- VSTEP phổ biến tại Việt Nam.
- Dùng cho chuẩn đầu ra đại học.
- Dùng cho một số chương trình sau đại học.
- Dùng cho chứng chỉ/nghề nghiệp.
- Cần luyện đủ 4 kỹ năng.

**Lời nói:**

```text
VSTEP có nhu cầu thực tế với sinh viên và người đi làm. Vì bài thi đánh giá bốn kỹ năng, người học cần một hệ thống luyện tập có định hướng thay vì chỉ làm đề rời rạc.
```

---

### Slide 5 — VSTEP Test Structure

**Thời lượng:** 20s

**Nội dung:**

- Listening/Reading: answer key.
- Writing/Speaking: rubric/formula.
- Band nội bộ 0-10, làm tròn 0.5.

**Lời nói:**

```text
Listening và Reading có thể chấm bằng đáp án. Writing và Speaking cần đánh giá theo tiêu chí, nên đây là phần nhóm em thiết kế cơ chế scoring riêng.
```

---

### Slide 6 — Problems

**Thời lượng:** 40s

**Nội dung:**

- Trung tâm chủ yếu bán khóa học/tài liệu.
- Tài liệu phân tán: Word, PDF, Facebook, Google Drive.
- Người học luyện đề nhiều nhưng thiếu lộ trình.
- Writing/Speaking thiếu feedback nhanh và nhất quán.
- Khó biết kỹ năng/tiêu chí nào yếu.

**Lời nói:**

```text
Vấn đề chính không phải là thiếu tài liệu. Người học có nhiều đề và file học, nhưng thiếu một hệ thống có cấu trúc để biết mình yếu ở đâu, được phản hồi nhanh và biết nên học gì tiếp theo.
```

---

### Slide 7 — Product Positioning / Solution

**Thời lượng:** 30s

**Nội dung:**

```text
Practice -> Scoring -> Feedback -> Recommendation -> Review -> Progress Tracking
```

- Luyện bốn kỹ năng.
- Rubric/formula scoring.
- AI hỗ trợ, không quyết định điểm cuối.
- Learning path, vocabulary review, progress tracking.

**Lời nói:**

```text
Giải pháp của nhóm là một vòng học tập liên tục. Người học luyện tập, được chấm điểm, nhận feedback, nhận gợi ý học tiếp, ôn tập và theo dõi tiến bộ.
```

---

### Slide 8 — Actors

**Thời lượng:** 15s

**Nội dung:** Learner, Teacher, Staff, Admin.

**Lời nói:**

```text
Learner là actor trung tâm. Teacher, Staff và Admin hỗ trợ quản lý, vận hành và định hướng học tập.
```

---

### Slide 9 — Main Features by Actors

**Thời lượng:** 25s

**Nội dung:**

- Learner: practice, mock test, result, progress, learning path, vocabulary.
- Teacher/Staff/Admin: support, content, user, configuration, reports.

**Lời nói:**

```text
Với learner, các chức năng chính là luyện tập, mock test, xem kết quả, learning path và vocabulary review. Các vai trò còn lại hỗ trợ nội dung và vận hành.
```

---

### Slide 10 — Learner Flow

**Thời lượng:** 20s

**Nội dung:**

```text
Login -> Practice/Mock Test -> Submit -> Scoring -> Feedback -> Recommendation -> Review/Progress
```

**Lời nói:**

```text
Đây là luồng chính của người học. Điểm quan trọng nhất là sau khi nộp bài, hệ thống chấm Writing và Speaking như thế nào.
```

---

## 4. Phần trọng tâm: Core Scoring Mechanism

### Slide 11 — Core Scoring Principle

**Thời lượng:** 45s

**Nội dung:**

- Không để AI quyết định điểm cuối.
- Rubric, trọng số, tham số được cấu hình.
- Backend scoring module tính điểm bằng công thức cố định.
- AI chỉ hỗ trợ evidence, content relevance, feedback.
- Final score không lấy trực tiếp từ AI response.

**Lời nói:**

```text
Đây là điểm nhóm em muốn nhấn mạnh. Hệ thống không hỏi AI bài này mấy điểm. AI chỉ hỗ trợ trích xuất bằng chứng, nhận diện mức độ liên quan và diễn giải feedback. Điểm cuối được backend scoring module tính bằng công thức do nhóm kiểm soát.
```

---

### Slide 12 — Rubric Source and Standardization

**Thời lượng:** 25s

**Nội dung:**

- Tham khảo định dạng VSTEP và hướng đánh giá của Bộ GD&ĐT.
- Chuẩn hóa thành criteria, weights, parameters, thresholds.
- Automated thresholds là calibration nội bộ cho luyện tập.
- Không thay thế điểm chính thức.

**Lời nói:**

```text
Rubric được thiết kế theo định dạng VSTEP và chuẩn hóa thành tiêu chí, trọng số và tham số. Các ngưỡng tự động phục vụ luyện tập, không thay thế giám khảo chính thức.
```

---

### Slide 13 — Scoring Pipeline

**Thời lượng:** 30s

**Nội dung:**

```text
Input -> Feature Extraction -> Criterion Scores -> Formula -> Final Band -> Feedback
```

**Lời nói:**

```text
Pipeline cho thấy AI không nằm ở bước quyết định điểm. Hệ thống lấy input, trích xuất chỉ số, tính điểm từng tiêu chí, tổng hợp bằng formula, rồi mới tạo feedback.
```

---

### Slide 14 — Writing Scoring Formula

**Thời lượng:** 55s

**Nội dung:**

| Criterion | Weight | Signals |
|---|---:|---|
| Task Fulfillment | 25% | points covered, depth, position, relevance, word count |
| Organization | 25% | paragraphs, linking words, sentence variety |
| Grammar | 25% | structures, grammar errors, punctuation errors |
| Vocabulary | 25% | unique ratio, readability, CEFR/advanced ratio, spelling errors |

```text
final_band = round_to_0_5(weighted_mean(criteria_scores))
Task Fulfillment <= avg(Grammar, Vocabulary, Organization) * tf_cap_ratio
```

**Lời nói:**

```text
Writing có bốn tiêu chí, mỗi tiêu chí 25%. Điểm cuối là trung bình có trọng số và làm tròn 0.5. Hệ thống còn có TF cap để tránh trường hợp nội dung có vẻ đúng nhưng grammar, vocabulary và organization quá yếu vẫn được chấm cao.
```

---

### Slide 15 — Speaking Scoring Formula

**Thời lượng:** 40s

**Nội dung:**

| Criterion | Weight | Signals |
|---|---:|---|
| Grammar | 20% | structures, language errors |
| Vocabulary | 20% | unique ratio, word length, complex vocabulary |
| Fluency | 20% | speaking rate, pause count |
| Discourse | 20% | linking words, sentence variety, content relevance |
| Pronunciation | 20% | pronunciation score |

```text
final_band = round_to_0_5(weighted_mean(criteria_scores))
```

**Lời nói:**

```text
Speaking có năm tiêu chí, mỗi tiêu chí 20%. Hệ thống dùng transcript, speech signals và pronunciation score để tính điểm từng tiêu chí. Điểm cuối vẫn do formula tính.
```

---

### Slide 16 — Guardrails

**Thời lượng:** 25s

**Nội dung:**

- Off-topic.
- Too short.
- Copy prompt.
- Spam/repeated content.
- Non-English.
- Invalid audio.

**Lời nói:**

```text
Hệ thống có guardrails để không chấm cao cho bài bất thường như lạc đề, quá ngắn, copy đề hoặc spam. Khi gặp các case này, hệ thống giới hạn điểm và giải thích bằng feedback.
```

---

## 5. Anki, Architecture, Technology

### Slide 17 — Vocabulary Review: Anki / Spaced Repetition

**Thời lượng:** 20s

**Nội dung:**

- Spaced repetition theo hướng Anki/FSRS.
- Flashcard, gõ từ, nghe, đảo nghĩa.
- State: new, learning, review, relearning.
- See detail ở phụ lục.

**Lời nói:**

```text
Vocabulary review áp dụng spaced repetition theo hướng Anki/FSRS. Vì thuật toán này không mới, nhóm em chỉ nói ngắn; nếu hội đồng hỏi sâu sẽ mở phụ lục.
```

---

### Slide 18 — System Architecture

**Thời lượng:** 25s

**Nội dung:**

- Client: Learner Web, Mobile App, Admin Portal.
- Backend API: auth, validation, business logic, assessment workflow.
- Data: PostgreSQL, Redis/Queue, object storage.
- External: AI, speech, payment.

**Lời nói:**

```text
Kiến trúc gồm client apps, backend API, data layer và external services. Backend là nơi kiểm soát business logic, assessment workflow và công thức chấm điểm.
```

---

### Slide 19 — Technology

**Thời lượng:** 15s

**Nội dung:**

- Laravel/PHP.
- PostgreSQL, Redis.
- React/TypeScript.
- React Native/Expo.
- Background jobs.

**Lời nói:**

```text
Hệ thống dùng Laravel cho backend, React cho web, React Native/Expo cho mobile, PostgreSQL và Redis. Các tác vụ chấm điểm nặng chạy bằng background jobs.
```

---

## 6. Demo Workflow bằng diagram trong 2 phút 15 giây

### Slide 20 — Demo Plan

**Thời lượng:** 10s

**Nội dung:**

```text
Workflow 1: Practice Submission
Workflow 2: Assessment Result
Workflow 3: Learning Path + Vocabulary Review
```

**Lời nói:**

```text
Nhóm em xin chuyển sang phần demo workflow. Đây là các diagram mô tả luồng hoạt động chính của hệ thống, không phải demo live trên web.
```

---

### Slide 21 — Demo Workflow 1: Practice Submission

**Thời lượng:** 35s

**Diagram nên thể hiện:**

- Learner đăng nhập.
- Learner chọn bài Writing/Speaking practice.
- Learner nộp text/audio.
- Backend validate input.
- Backend tạo assessment attempt.
- Queue/background job xử lý scoring nếu cần.

**Lời nói:**

```text
Workflow đầu tiên mô tả cách bài làm của người học đi vào hệ thống. Sau khi learner nộp text hoặc audio, backend validate dữ liệu, tạo assessment attempt và chuẩn bị input cho scoring pipeline.
```

---

### Slide 22 — Demo Workflow 2: Assessment Result

**Thời lượng:** 60s

**Diagram nên thể hiện:**

- Assessment attempt được xử lý.
- Feature extraction tạo các chỉ số đầu vào.
- Formula tính criterion scores.
- Weighted formula tính final band.
- Feedback/evidence được sinh cho learner.
- Learner xem overall band, criterion scores và feedback.

**Lời nói:**

```text
Workflow thứ hai mô tả luồng tạo kết quả chấm. Điểm từng tiêu chí và điểm tổng được tính bằng rubric/formula. AI chỉ hỗ trợ evidence và diễn giải feedback, không quyết định điểm cuối.
```

---

### Slide 23 — Demo Workflow 3: Learning Path + Vocabulary Review

**Thời lượng:** 50s

**Diagram nên thể hiện:**

- Assessment result cập nhật progress dashboard.
- Hệ thống phát hiện weak skill/criterion.
- Learning path đề xuất nội dung luyện tiếp.
- Vocabulary review lấy các từ đến hạn ôn.
- Learner review.
- Spaced repetition cập nhật due date/interval.

**Lời nói:**

```text
Workflow thứ ba mô tả cách kết quả chấm được chuyển thành hành động học tập. Hệ thống cập nhật progress, phát hiện điểm yếu, đề xuất nội dung luyện tiếp và hỗ trợ ôn từ bằng spaced repetition.
```

---

## 7. Kết bài trong 45 giây

### Slide 24 — Different / Differentiation

**Thời lượng:** 15s

**Nội dung:**

- Không chỉ là tài liệu/luyện đề.
- Có rubric/formula scoring.
- Có feedback, recommendation, progress.
- AI hỗ trợ, code tính điểm cuối.

**Lời nói:**

```text
Khác biệt chính là hệ thống không chỉ cung cấp đề luyện, mà có scoring có thể giải thích, feedback, gợi ý học tiếp và theo dõi tiến bộ.
```

---

### Slide 25 — Achievements

**Thời lượng:** 10s

**Nội dung:**

- Web/Mobile/Admin + Backend.
- Practice/mock test 4 kỹ năng.
- Rubric-based assessment.
- Learning path, progress, vocabulary review.

**Lời nói:**

```text
Nhóm đã hoàn thành vòng học tập chính từ luyện tập, chấm điểm, feedback đến gợi ý học tập.
```

---

### Slide 26 — Limitations

**Thời lượng:** 10s

**Nội dung:**

- Chỉ VSTEP B1-C1.
- Automated scoring chỉ hỗ trợ luyện tập.
- Không thay thế giám khảo chính thức.
- Future work: adaptive difficulty, predictive analytics, large-scale validation.

**Lời nói:**

```text
Hệ thống hiện tập trung vào VSTEP B1-C1. Chấm điểm tự động chỉ phục vụ luyện tập, không thay thế giám khảo chính thức.
```

---

### Slide 27 — Conclusion

**Thời lượng:** 10s

**Nội dung:**

Hệ thống trả lời:

1. Tôi đang ở trình độ nào?
2. Tôi yếu kỹ năng/tiêu chí nào?
3. Tôi nên luyện gì tiếp theo?

**Lời nói:**

```text
Tóm lại, hệ thống giúp người học biết trình độ hiện tại, điểm yếu cụ thể và nội dung nên luyện tiếp theo.
```

---

### Slide 28 — Thank You

**Thời lượng:** 5s

**Lời nói:**

```text
Phần trình bày của nhóm em đến đây là kết thúc. Nhóm em xin cảm ơn hội đồng và sẵn sàng trả lời câu hỏi.
```

---

## 8. Nếu bị thiếu giờ

### Phải giữ

- Slide 1: Title.
- Slide 4: VSTEP context.
- Slide 6: Problems.
- Slide 7: Solution.
- Slide 11: AI không quyết định điểm cuối.
- Slide 14: Writing formula.
- Slide 15: Speaking formula.
- Slide 22: Assessment result workflow diagram.
- Slide 26: Limitations.
- Slide 27: Conclusion.

### Có thể lướt cực nhanh

- Slide 2: Team.
- Slide 3: Agenda.
- Slide 5: Test structure.
- Slide 8: Actors.
- Slide 9: Main features.
- Slide 10: Learner flow.
- Slide 12: Rubric source.
- Slide 13: Pipeline.
- Slide 16: Guardrails.
- Slide 17: Anki.
- Slide 18: Architecture.
- Slide 19: Technology.
- Slide 21: Practice submission workflow diagram.
- Slide 23: Learning path/vocabulary workflow diagram.
- Slide 24: Different.
- Slide 25: Achievements.

---

## 9. Q&A cần chuẩn bị

### Q1. AI có phải bên chấm điểm cuối không?

```text
Không. AI không quyết định điểm cuối. AI chỉ hỗ trợ evidence, content relevance và feedback. Điểm cuối được backend scoring module tính bằng công thức cố định dựa trên rubric, trọng số và các chỉ số đầu vào.
```

### Q2. Vì sao Writing ra 7.5?

```text
Writing được tính từ Task Fulfillment, Organization, Grammar và Vocabulary, mỗi tiêu chí 25%. Hệ thống tính điểm từng tiêu chí từ các chỉ số đầu vào, sau đó lấy weighted mean và làm tròn 0.5.
```

### Q3. Nếu bài lạc đề hoặc copy đề thì sao?

```text
Hệ thống có guardrails như content cap, short essay cap và kiểm tra evidence. Nếu bài lạc đề, quá ngắn, copy hoặc spam, hệ thống sẽ giới hạn điểm và feedback sẽ giải thích lý do.
```

### Q4. Anki/FSRS có phải đóng góp mới không?

```text
Không. Đây là hướng spaced repetition đã phổ biến. Đóng góp của nhóm là ứng dụng vào vocabulary review trong hệ thống luyện thi VSTEP và kết hợp với learning path/progress tracking.
```

### Q5. Điểm tự động có thay thế giám khảo không?

```text
Không. Điểm tự động phục vụ luyện tập và phản hồi nhanh. Official score vẫn cần giám khảo hoặc đơn vị có thẩm quyền xác nhận.
```

---

## 10. Checklist cho phần slide 10 phút

- [ ] Slide 20-23 là workflow diagram, không phải demo live web.
- [ ] Workflow 1 có đủ: learner -> submit -> backend validate -> assessment attempt -> queue/job.
- [ ] Workflow 2 có đủ: feature extraction -> criterion scores -> formula -> final band -> feedback/result.
- [ ] Workflow 3 có đủ: result -> progress -> weak skill -> recommendation -> vocabulary review -> due date update.
- [ ] Mỗi workflow có mũi tên rõ, ít chữ, nhìn được trong 10-15 giây.
- [ ] Không dùng chữ khiến hội đồng hiểu là AI chấm điểm cuối.
- [ ] Tập nói workflow đúng 2 phút 15 giây.
- [ ] Tập nói tổng đúng 10 phút, có bấm giờ.
- [ ] Speaker thuộc câu: AI không quyết định điểm cuối.
