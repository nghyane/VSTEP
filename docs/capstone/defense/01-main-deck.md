# 01. Main deck — outline bảo vệ

## Flow theo yêu cầu defense

```text
Context -> Problems -> Actors -> Main Features by Actors -> System Architecture -> Technology -> Demo Workflow 1/2/3 -> Different -> Achievements -> Limitation -> Conclusion -> Thank You
```

## Nguyên tắc nói xuyên suốt

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ đếm/trích xuất tham số đầu vào và hỗ trợ feedback. Điểm luyện tập do backend tính bằng công thức định lượng cố định trong hệ thống.
```

Writing/Speaking score là điểm luyện tập/tham khảo, không thay thế giám khảo VSTEP chính thức.

## Timeline 10 phút theo deck 24 slide

- Slide 1–4: Context + Problems — 1 phút 20 giây.
- Slide 5–8: Actors + Main Features by Actors — 1 phút 40 giây.
- Slide 9–15: Architecture + Technology + evaluation principle — 2 phút 20 giây.
- Slide 16–19: Demo Workflow 1/2/3 — 2 phút 30 giây.
- Slide 20–24: Different + Achievements + Limitation + Conclusion + Thank You — 2 phút 10 giây.

## Câu xin phép lướt nhanh

```text
Do thời gian trình bày có giới hạn và nhóm muốn dành nhiều thời gian cho demo sản phẩm, nhóm em xin phép lướt nhanh phần bối cảnh, công nghệ và thuật toán hỗ trợ. Nhóm sẽ tập trung vào luồng học chính, công thức tính điểm luyện tập và demo ba workflow chính.
```

## Chỉ đạo của thầy cần bám sát

- Context phải nói rõ VSTEP phổ biến: đầu vào cao học, đầu ra đại học/cao đẳng, chứng chỉ năng lực tiếng Anh.
- Cấu trúc đề thi và cách tính điểm chỉ gói trong 1 slide, nói nhanh.
- Problem phải nêu thực trạng nhiều trung tâm/group Facebook/file Word/tài liệu luyện đề, nhưng chủ yếu là công cụ luyện đề rời rạc, chưa phải giải pháp học tập phát triển.
- Phần điểm Writing/Speaking phải thể hiện rõ: AI/công cụ chỉ đếm hoặc trích xuất tham số; backend dùng công thức định lượng cố định để tính điểm luyện tập; AI chỉ hỗ trợ feedback ở bước sau.
- Anki/Spaced Repetition chỉ nói rất ngắn, để “See detail” nếu hội đồng hỏi sâu.
- Chiến thuật thuyết trình: slide lướt nhanh, ưu tiên demo; nếu demo mượt có thể kết thúc sớm và chuyển Q&A.

## Outline từng slide

1. **Title** — giới thiệu đề tài và trọng tâm: luyện 4 kỹ năng, feedback, gợi ý học tiếp.
2. **VSTEP Context + Exam Format** — VSTEP phổ biến; cấu trúc 4 kỹ năng và cách tính điểm nói nhanh trong 1 slide.
3. **Problems** — nhiều trung tâm/group/tài liệu luyện đề, nhưng người học vẫn khó biết điểm yếu và luyện tập còn rời rạc.
4. **Problem Analysis** — tài liệu/file luyện đề chỉ là công cụ; hệ thống cần tạo giải pháp học tập có feedback, game hóa, tích điểm, lộ trình và adaptive support.
5. **Actors** — learner, admin/staff, teacher, mobile learner, external AI/speech services.
6. **Main Features — Learner** — practice/mock test, feedback, skill gaps, recommendation, progress.
7. **Main Features — Admin/Staff** — quản lý nội dung, đề/version, tiêu chí đánh giá, user/course/booking.
8. **Main Features — Teacher/Mobile** — teacher hỗ trợ lịch/booking; mobile là companion app cho learner.
9. **System Architecture** — web/mobile/admin → Laravel API → PostgreSQL/Redis/storage/external services.
10. **Technology** — Laravel, PostgreSQL, Redis, React, Expo/React Native, Docker/GitHub Actions.
11. **Technology — Deployment & Quality** — deployment, CI/CD, queue, kiểm thử và cô lập external services.
12. **Practice Score Formula** — bảng chỉ số: tham số đầu vào → công thức định lượng → điểm luyện tập; AI không tự bốc điểm.
13. **Writing Practice Evaluation** — ví dụ chỉ số Writing: word count, spelling errors, relevance, organization, grammar, vocabulary.
14. **Speaking Practice Evaluation** — ví dụ chỉ số Speaking: transcript, word count, speaking rate, pause, pronunciation, relevance.
15. **Abnormal Answer Handling** — bài quá ngắn/lạc đề/copy/spam/non-English bị giới hạn điểm.
16. **Demo Overview** — demo 3 workflow: learner practice, mock test/result, admin management.
17. **Demo Workflow 1 — Learner Practice** — login → practice hub → chọn kỹ năng → làm bài → feedback.
18. **Demo Workflow 2 — Mock Test & Result** — mock test 4 kỹ năng → submit → processing → result/skill gaps.
19. **Demo Workflow 3 — Admin Management** — admin quản lý nội dung, đề, tiêu chí, user/course.
20. **Different Points** — vòng học 4 kỹ năng, feedback theo tiêu chí, game hóa/tích điểm, recommendation, SRS/Anki lướt nhanh, admin-managed content.
21. **Achievements** — backend, web, mobile, admin, module hỗ trợ đánh giá, tài liệu, mã nguồn.
22. **Limitations** — điểm Writing/Speaking là tham khảo; cần dữ liệu giám khảo; adaptive difficulty là future work.
23. **Conclusion** — tổng kết đóng góp và hướng phát triển.
24. **Thank You** — cảm ơn hội đồng và chuyển sang Q&A.

## Hạn chế nên nói ở Slide 22

```text
Hạn chế hiện tại là phần đánh giá Writing và Speaking mới phục vụ mục tiêu luyện tập và tham khảo, chưa thay thế giám khảo chính thức. Ngoài ra, hệ thống cần thêm bộ dữ liệu lớn hơn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác.
```
