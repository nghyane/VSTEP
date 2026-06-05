# 01. Main deck — blueprint bảo vệ

File này dùng để cả team nắm nhanh flow bảo vệ, nhiệm vụ từng slide và phần nào cần nói/lướt/demo.

## Hướng đã chốt

- Deck chính dùng **22 slide**: có `Outline` và `Team`, nhưng không tách quá nhiều slide kỹ thuật.
- Bám flow thầy: `Context -> Problems -> Actors -> Main Features by Actors -> System Architecture -> Technology -> Demo Workflow 1/2/3 -> Different -> Achievements -> Limitation -> Conclusion -> Thank You`.
- Phần công thức là nội dung bắt buộc, nhưng chỉ để **1 slide** sau Technology.
- Không đưa Writing/Speaking formula chi tiết hoặc abnormal handling thành nhiều slide chính. Những phần đó để Q&A/backup.
- Slide 14–17 chỉ preview demo workflow. Sau Slide 17 chuyển sang demo sản phẩm thật.

## Câu bắt buộc về AI/scoring

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ đếm hoặc trích xuất chỉ số đầu vào và hỗ trợ feedback. Điểm Writing/Speaking trong practice và mock test do backend tính bằng công thức định lượng cố định.
```

Điểm Writing/Speaking trong hệ thống là điểm tham khảo cho luyện tập/thi thử, không thay thế giám khảo VSTEP chính thức.

## Timeline 10 phút

- **Slide 1–6 — Mở đầu, context, problem:** 1 phút 30 giây.
- **Slide 7–10 — Actors và features:** 1 phút 30 giây.
- **Slide 11–13 — Architecture, technology, assessment formula:** 2 phút.
- **Slide 14–17 — Demo workflow preview:** 45 giây đến 1 phút.
- **Demo sản phẩm thật:** ưu tiên thời gian còn lại.
- **Slide 18–22 — Different, achievements, limitation, conclusion:** lướt nhanh 1 phút 30 giây.

## Câu xin phép lướt nhanh

```text
Do thời gian trình bày có giới hạn và nhóm muốn dành nhiều thời gian cho demo sản phẩm, nhóm em xin phép trình bày ngắn gọn phần slide. Nhóm sẽ tập trung vào vấn đề chính, công thức tính điểm Writing/Speaking và demo ba workflow.
```

## Slide-by-slide brief

### Phase 1 — Mở đầu và đặt vấn đề

**Slide 1 — Title**

- Tên đề tài, mã nhóm, supervisor/team.
- Thông điệp: hệ thống hỗ trợ luyện thi VSTEP có feedback và learning path.

**Slide 2 — Outline**

- Nêu cấu trúc bài trình bày.
- Báo trước nhóm sẽ nói slide ngắn và ưu tiên demo.

**Slide 3 — Team**

- Thành viên và vai trò chính.
- Gợi ý chia role: backend/API, web/admin, mobile, QA/docs.

**Slide 4 — VSTEP Context + Exam Format**

- VSTEP phổ biến: đầu vào cao học, đầu ra đại học/cao đẳng, chứng chỉ năng lực tiếng Anh.
- 4 kỹ năng; Writing/Speaking cần đánh giá theo tiêu chí.
- Chỉ nói 2 ý trên; công thức tính điểm để slide 13.

**Slide 5 — Problems**

- Không thiếu tài liệu luyện thi.
- Thiếu feedback, thiếu định hướng, người học khó biết điểm yếu.

**Slide 6 — Problem Analysis**

- File đề/group/tài liệu chỉ là công cụ luyện đề.
- Hệ thống cần biến luyện đề thành learning loop: làm bài → feedback → biết điểm yếu → luyện tiếp.

### Phase 2 — Người dùng và tính năng

**Slide 7 — Actors**

- Learner, admin/staff, teacher, mobile learner.
- AI/speech là service hỗ trợ kỹ thuật, không phải actor nghiệp vụ chính.

**Slide 8 — Main Features: Learner**

- Practice/mock test.
- Feedback, skill gaps, recommendation.
- Dashboard, progress, streak/coin, vocabulary.

**Slide 9 — Main Features: Admin/Staff**

- Quản lý nội dung, đề/version, tiêu chí đánh giá.
- Quản lý user, course, booking.

**Slide 10 — Main Features: Teacher/Mobile**

- Teacher: schedule, booking, leave request.
- Mobile: companion app cho learner.
- Nói ngắn, không phải trọng tâm demo chính.

### Phase 3 — Kiến trúc, công nghệ, công thức

**Slide 11 — System Architecture**

- Client → Laravel API → PostgreSQL/Redis/storage → external AI/speech.
- Backend là trung tâm điều phối, lưu kết quả và tính điểm Writing/Speaking.
- Speaking có audio pipeline: record → storage → queue job → speech signals → backend formula.

**Slide 12 — Technology**

- Backend: Laravel/PHP.
- Data: PostgreSQL.
- Queue: Redis/Horizon.
- Client: React web/admin, Expo/React Native mobile.
- Speech/audio: Web Speech API hoặc Azure Speech.
- Storage/deployment: S3-compatible/R2, Docker, GitHub Actions.

**Slide 13 — Writing/Speaking Assessment Formula**

- Bắt buộc có bảng chỉ số ngắn: `Input metric / Extracted by / Used for`.
- Bắt buộc có dòng: `Writing/Speaking score = fixed formula(input metrics) + caps / penalties`.
- Cho ví dụ ngắn: bài đủ dài, ít lỗi, bám đề → công thức → kết quả ví dụ (không claim chính thức).
- Nói rõ AI/công cụ chỉ lấy chỉ số đầu vào; backend tính điểm.
- Nhắc một câu: chi tiết Writing/Speaking formula và guardrails để ở Q&A.

### Phase 4 — Demo workflow preview

**Slide 14 — Demo Overview**

- Nêu ba workflow sẽ demo.
- Chưa demo ngay trên slide.

**Slide 15 — Demo Workflow 1: Learner Practice**

- Login → practice hub → skill → answer → feedback.

**Slide 16 — Demo Workflow 2: Mock Test & Result**

- Exam → submit → processing → điểm thành phần/skill gaps.

**Slide 17 — Demo Workflow 3: Admin Management**

- Content/exam/criteria/user/course/booking.
- Sau slide này chuyển sang demo sản phẩm thật.

### Phase 5 — Tổng kết

**Slide 18 — Different Points**

- Đánh giá + feedback cho Writing/Speaking, trong khi các mock test web thường chỉ chấm Listening/Reading.
- Điểm Writing/Speaking tính bằng công thức định lượng cố định, không phải AI tự cho điểm.
- Tạo vòng học khép kín (làm bài → feedback → gợi ý → luyện tiếp), không chỉ là kho đề.
- Các điểm hỗ trợ: gamification/tích điểm, lộ trình học, SRS/Anki, admin-managed content.

**Slide 19 — Achievements**

- Backend, web, mobile, admin.
- Assessment support module.
- Tests/docs/source.

**Slide 20 — Limitations**

- Điểm Writing/Speaking chỉ dùng để tham khảo trong practice/mock test.
- Cần dataset lớn do giám khảo chấm để kiểm chứng/calibrate.
- Audio/speech signal có rủi ro chất lượng.

**Slide 21 — Conclusion**

- Tổng kết hệ thống và future work.

**Slide 22 — Thank You**

- Cảm ơn và Q&A.

## Bảng bắt buộc cho Slide 13

```text
Input metric           Extracted by          Used for
Word count             Text analyzer         Length cap
Spelling errors        Text analyzer         Spelling penalty
Topic relevance        AI-assisted analysis  Relevance score / off-topic penalty
Pause count            Speech analyzer       Fluency penalty
Pronunciation signals  Speech service        Pronunciation score

Writing/Speaking score = fixed formula(input metrics) + caps / penalties
```

## Câu chuyển từ Slide 17 sang demo sản phẩm

```text
Ba slide vừa rồi là kịch bản demo để hội đồng nắm trước luồng thao tác. Sau đây nhóm em xin chuyển sang demo trực tiếp trên sản phẩm, bắt đầu từ luồng learner luyện tập, sau đó là mock test/result và cuối cùng là phần admin quản lý nội dung.
```

## Hạn chế nên nói ở Slide 20

```text
Hạn chế hiện tại là phần đánh giá Writing và Speaking mới phục vụ mục tiêu luyện tập và thi thử tham khảo, chưa thay thế giám khảo chính thức. Ngoài ra, hệ thống cần thêm bộ dữ liệu lớn hơn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác.
```
