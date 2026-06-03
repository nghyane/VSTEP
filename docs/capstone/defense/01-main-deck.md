# 01. Main deck

Sườn theo thầy:

```text
Context -> Problems -> Actors -> Main Features by Actors -> System Architecture -> Technology -> Demo Workflow 1/2/3 -> Different -> Achievements -> Limitation -> Conclusion -> Thank You
```

## Timeline 10 phút

- Slide 1–3: mở đầu + context — 1 phút.
- Slide 4–8: problems + actors + features — 1 phút 40 giây.
- Slide 9–12: architecture + technology + scoring formula — 2 phút 20 giây.
- Slide 13–18: demo workflow — 4 phút.
- Slide 19–22: different + achievements + limitation + conclusion — 1 phút.

## Câu bắt buộc

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ hỗ trợ lấy tín hiệu và feedback. Điểm cuối do backend tính bằng rubric và công thức trong code.
```

## Main deck

### Slide 1 — Title

**Slide:** tên đề tài, nhóm, mã đề tài, thành viên.

**Nói:** Kính chào hội đồng. Nhóm em trình bày hệ thống luyện thi và thi thử VSTEP, tập trung vào luyện 4 kỹ năng, phản hồi kết quả và theo dõi tiến độ.

### Slide 2 — Context

**Slide:** VSTEP dùng cho học tập/chứng chỉ; người học cần luyện 4 kỹ năng.

**Nói:** VSTEP có nhu cầu thực tế. Vì bài thi gồm 4 kỹ năng, người học cần một hệ thống luyện tập có định hướng.

### Slide 3 — Cấu trúc VSTEP

**Slide:** Listening/Reading có đáp án; Writing/Speaking theo rubric.

**Nói:** Listening/Reading chấm trực tiếp hơn. Writing/Speaking cần tiêu chí nên nhóm thiết kế scoring bằng rubric và formula.

### Slide 4 — Problems

**Slide:** tài liệu phân tán; luyện đề rời rạc; thiếu feedback nhanh; khó biết điểm yếu.

**Nói:** Vấn đề không phải thiếu tài liệu, mà thiếu hệ thống có cấu trúc để biết yếu ở đâu và nên học gì tiếp.

### Slide 5 — Actors

**Slide:** Learner, Admin/Staff, Teacher, Mobile learner.

**Nói:** Learner là trung tâm. Admin vận hành nội dung/rubric. Teacher và mobile là phần mở rộng đúng phạm vi hiện có.

### Slide 6 — Learner Features

**Slide:** dashboard, luyện 4 kỹ năng, thi thử, kết quả, learning path.

**Nói:** Learner đi theo luồng: dashboard -> luyện tập/thi thử -> xem kết quả -> nhận gợi ý học tiếp.

### Slide 7 — Admin/Staff Features

**Slide:** quản lý nội dung, đề/version, rubric, user/khóa học/booking.

**Nói:** Admin giúp hệ thống vận hành được: quản lý nội dung, version đề và rubric chấm Writing/Speaking.

### Slide 8 — Teacher/Mobile Features

**Slide:** teacher lịch dạy/booking/đơn nghỉ; mobile companion cho learner.

**Nói:** Phần này chỉ nói đúng scope hiện có, không claim teacher analytics sâu.

### Slide 9 — System Architecture

**Slide:**

```text
Web/Admin/Mobile -> Laravel API -> PostgreSQL
                         |
                         -> Redis Queue/Horizon
                         -> Storage
```

**Callout:** AI/speech/language chỉ là support layer.

**Nói:** Backend giữ business logic và công thức tính điểm; tác vụ Writing/Speaking chạy qua queue nếu cần.

### Slide 10 — Technology + Anki

**Slide:** Laravel, PostgreSQL, Redis, React, Expo/React Native, Anki/FSRS See detail.

**Nói:** Công nghệ chia theo tầng. Anki/FSRS chỉ dùng cho ôn từ vựng, không nói sâu nếu hội đồng chưa hỏi.

### Slide 11 — Writing Formula

**Slide:**

```text
Text -> signals -> 4 criteria -> task score -> writing band

TaskFulfillmentScore = ContentCoverage + DevelopmentDepth + PositionBonus - OffTopicPenalty
OrganizationScore    = Paragraphing + LinkingDevices + SentenceVariety
GrammarScore         = (StructureRange + GrammarAccuracy) / 2 - PunctuationPenalty
VocabularyScore      = LexicalQuality - SpellingPenalty

TaskScore   = round_to_0.5((TaskFulfillmentScore + OrganizationScore + GrammarScore + VocabularyScore) / 4)
WritingBand = round_to_0.5((Task1Score + 2 × Task2Score) / 3)
```

**Callout:** bài quá ngắn/lạc đề/copy/spam bị giới hạn điểm.

**Nói:** Writing có 4 tiêu chí, mỗi tiêu chí có công thức riêng. Backend tính điểm từng task, sau đó Task 2 có trọng số cao hơn trong Writing band.

### Slide 12 — Speaking Formula

**Slide:**

```text
Audio -> transcript/signals -> 5 criteria -> speaking score

GrammarScore       = (StructureRange + GrammarAccuracy) / 2
VocabularyScore    = 3 + DiversityBonus + DifficultyBonus + ReadabilityBonus
FluencyScore       = 3 + SpeakingRateBonus - PausePenalty
DiscourseScore     = IdeaDevelopment × ContentRelevance
PronunciationScore = 0.45×Accuracy + 0.20×Fluency + 0.20×Prosody + 0.15×Completeness - Penalty

SpeakingScore = round_to_0.5((GrammarScore + VocabularyScore + FluencyScore + DiscourseScore + PronunciationScore) / 5)
```

**Callout:** bài quá ngắn/audio kém/lạc đề bị giới hạn điểm.

**Nói:** Speaking bắt đầu từ audio. Hệ thống lấy transcript, tốc độ nói, pause, pronunciation và mức bám đề; backend tính 5 tiêu chí rồi lấy trung bình.

### Slide 13 — Demo Overview

**Slide:** Demo 1 learner dashboard; Demo 2 practice/thi thử/result; Demo 3 admin rubric/content.

**Nói:** Demo theo hành trình learner trước, sau đó admin để chứng minh hệ thống quản trị được nội dung và rubric.

### Slide 14 — Demo 1.1: Dashboard

**Slide:** screenshot dashboard.

**Nói:** Learner xem mục tiêu, tiến độ, streak/heatmap và trạng thái kỹ năng.

### Slide 15 — Demo 1.2: Learning Path

**Slide:** screenshot learning path/progress.

**Nói:** Learning path dựa trên mục tiêu, kết quả thi thử và tiến độ luyện tập; không claim dự đoán điểm chính thức.

### Slide 16 — Demo 2.1: Practice/Thi thử

**Slide:** screenshot practice hub/test room.

**Nói:** Learner chọn kỹ năng hoặc bài thi thử, làm bài và submit. Writing/Speaking đi qua assessment workflow.

### Slide 17 — Demo 2.2: Result/Feedback

**Slide:** screenshot result.

**Nói:** Learner xem điểm theo kỹ năng, tiêu chí và feedback. Writing/Speaking là điểm luyện tập tham khảo.

### Slide 18 — Demo 3: Admin Rubric/Content

**Slide:** screenshot admin rubric/content.

**Nói:** Admin quản lý đề/nội dung/rubric, clone draft, simulate, activate; kết quả cũ giữ version đã dùng.

### Slide 19 — Different

**Slide:** 4 cards: 4 skills, thi thử, scoring formula, learning path.

**Nói:** Khác biệt là hệ thống tạo vòng học hoàn chỉnh, không chỉ cung cấp đề luyện.

### Slide 20 — Achievements

**Slide:** learner web, admin portal, mobile companion, backend API, assessment flow.

**Nói:** Nhóm đã hoàn thành core learning loop từ luyện tập/thi thử đến chấm, feedback và progress.

### Slide 21 — Limitation + Conclusion

**Slide:** limitations bên trái, conclusion bên phải.

**Nói:** Điểm tự động chỉ phục vụ luyện tập/thi thử tham khảo. Kết luận: hệ thống giúp learner biết hiện tại ở đâu, yếu gì và nên học gì tiếp.

### Slide 22 — Thank You

**Slide:** Thank you / Q&A.

**Nói:** Nhóm em xin cảm ơn hội đồng và sẵn sàng trả lời câu hỏi.

## Nếu thiếu giờ

Giữ: Slide 4, 9, 11, 12, 13–18, 21.

Lướt nhanh: Slide 1, 3, 5, 8, 10, 19–20.
