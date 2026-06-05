# 01. Main deck — outline bảo vệ

## Flow theo yêu cầu defense

```text
Context -> Problems -> Actors -> Main Features by Actors -> System Architecture -> Technology -> Workflow Overview 1/2 -> Differentiation -> Achievements -> Limitations -> Conclusion -> Thank You
```

## Nguyên tắc nói xuyên suốt

```text
Hệ thống không hỏi AI “bài này mấy điểm”. AI/công cụ ngoài chỉ hỗ trợ lấy tín hiệu và feedback. Điểm luyện tập do backend tính từ các tiêu chí, tín hiệu và công thức trong hệ thống.
```

Writing/Speaking score là điểm luyện tập/tham khảo, không thay thế giám khảo VSTEP chính thức.

## Timeline 10 phút theo deck 24 slide

- Slide 1–4: Context + Problems — 1 phút 20 giây.
- Slide 5–8: Actors + Main Features by Actors — 1 phút 40 giây.
- Slide 9–15: Architecture + Technology + evaluation principle — 2 phút 20 giây.
- Slide 25–26: Workflow Overview 1/2 — 2 phút 30 giây.
- Slide 20–24: Different + Achievements + Limitation + Conclusion + Thank You — 2 phút 10 giây.

## Câu xin phép lướt nhanh

```text
Do thời gian trình bày có giới hạn, nhóm em xin tập trung vào core learning flow, kiến trúc hệ thống và cơ chế đánh giá bài luyện tập. Một số phần hỗ trợ nhóm em xin phép lướt nhanh và sẽ trình bày kỹ hơn nếu hội đồng có câu hỏi.
```

## Outline từng slide

1. **Title** — giới thiệu đề tài và trọng tâm: luyện 4 kỹ năng, feedback, gợi ý học tiếp.
2. **VSTEP Context** — VSTEP đánh giá 4 kỹ năng, người học cần luyện tập có định hướng.
3. **Problems** — khó biết điểm yếu; Writing/Speaking thiếu phản hồi; luyện tập rời rạc.
4. **Problem Analysis** — giải pháp hiện có có ưu điểm nhưng chưa tạo vòng học đầy đủ bám VSTEP.
5. **Actors** — learner, admin/staff, teacher, mobile learner, external AI/speech services.
6. **Main Features — Learner** — practice/mock test, feedback, skill gaps, recommendation, progress.
7. **Main Features — Admin/Staff** — quản lý nội dung, đề/version, tiêu chí đánh giá, user/course/booking.
8. **Main Features — Teacher/Mobile** — teacher hỗ trợ lịch/booking; mobile là companion app cho learner.
9. **System Architecture** — web/mobile/admin → Laravel API → PostgreSQL/Redis/storage/external services.
10. **Technology** — Laravel, PostgreSQL, Redis, React, Expo/React Native, Docker/GitHub Actions.
11. **Technology — Deployment & Quality** — deployment, CI/CD, queue, kiểm thử và cô lập external services.
12. **Practice Evaluation Principle** — AI không quyết định điểm; backend tính điểm luyện tập.
13. **Writing Practice Evaluation** — tiêu chí: đáp ứng đề, tổ chức bài, ngữ pháp, từ vựng.
14. **Speaking Practice Evaluation** — tiêu chí: ngữ pháp, từ vựng, độ trôi chảy, phát triển ý, phát âm.
15. **Abnormal Answer Handling** — bài quá ngắn/lạc đề/copy/spam/non-English bị giới hạn điểm.
25. **Workflow Overview — Learner & Teacher** — learner practice/mock exam/course; teacher schedule, booking, leave request, grading.
26. **Workflow Overview — Staffs & Admin** — staff quản lý content/exam/practice/course/leave; admin quản lý users/rubrics/top-up/promo/settings.
27. **Differentiation** — vòng học 4 kỹ năng, feedback theo tiêu chí, recommendation, SRS, admin-managed content.
28. **Achievements** — backend, web, mobile, admin, module hỗ trợ đánh giá, tài liệu, mã nguồn.
29. **Limitations** — điểm Writing/Speaking là tham khảo; cần dữ liệu giám khảo; adaptive difficulty là future work.
30. **Conclusion** — tổng kết đóng góp và hướng phát triển.
31. **Thank You** — cảm ơn hội đồng và chuyển sang Q&A.

## Hạn chế nên nói ở Slide 22

```text
Hạn chế hiện tại là phần đánh giá Writing và Speaking mới phục vụ mục tiêu luyện tập và tham khảo, chưa thay thế giám khảo chính thức. Ngoài ra, hệ thống cần thêm bộ dữ liệu lớn hơn do giám khảo chấm để kiểm chứng và hiệu chỉnh độ chính xác.
```
