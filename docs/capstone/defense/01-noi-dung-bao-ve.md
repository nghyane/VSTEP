# 01. Nội dung bảo vệ

## Message chính

> Đây là nền tảng luyện thi VSTEP thích ứng. Trọng tâm không phải chỉ là kho đề, mà là vòng học: luyện tập/thi thử → kết quả có căn cứ → phát hiện điểm yếu → gợi ý học tiếp → theo dõi tiến độ.

## Deck blueprint hợp lý

Gom deck thành 5 nhóm chính để hội đồng thấy mạch rõ: **vì sao làm → làm gì → làm thế nào → demo → kết quả/giới hạn**.

1. **Opening & problem** — slides 1–4: đặt bối cảnh, nói nhanh VSTEP format và vấn đề người học.
2. **Product scope** — slides 5–7: chứng minh sản phẩm đúng đề tài qua core learning loop, actor/app scope và main features.
3. **Solution design** — slides 8–11: giải thích architecture, assessment mechanism, rubric versioning, learning path/SRS.
4. **Product demo** — slides 12–14: chứng minh hệ thống chạy thật theo luồng dashboard → practice/thi thử → result → learning path/progress.
5. **Result & closing** — slides 15–18: chốt achievements, limitations, future work và Q&A.

## 1. Opening & problem

### Slide nên có

- **Title:** tên đề tài, nhóm, GVHD; đọc đúng tên theo phiếu đăng ký.
- **VSTEP context:** VSTEP phục vụ tốt nghiệp, cao học, chứng chỉ; nói nhanh trong 1 slide.
- **VSTEP format:** 4 kỹ năng, thang band tổng quan; không giảng học thuật sâu.
- **Problem:** tài liệu rời rạc, thiếu lộ trình, khó biết điểm yếu, Writing/Speaking thiếu feedback nhanh.

### Câu chuyển

> Vì vậy nhóm không chỉ làm một thư viện đề, mà thiết kế một vòng học khép kín từ luyện tập đến phản hồi và theo dõi tiến độ.

## 2. Product scope

### Scope chính nên nói trên slide

- **Learner web:** dashboard, practice hub, vocab SRS, grammar, 4-skill practice, thi thử, grading result, courses/1-1 booking, profile, wallet/promo. Đây là demo chính.
- **Mobile app:** tổng quan, luyện tập, thi thử, kết quả chấm, khóa học, hồ sơ, wallet/topup, notifications. Nói là learner companion app, không cần demo hết.
- **Admin/staff web:** dashboard/analytics, vocab/grammar, đề thi/version, practice content, rubric, courses/slots/bookings, users, topup/promo/config. Dùng để chứng minh hệ thống quản trị được.
- **Teacher web:** dashboard, lịch dạy, buổi học 1-1, đơn nghỉ. Nói đúng phạm vi hiện tại.
- **Backend API:** auth/profile, assessment jobs/results, progress/learning path/streak/heatmap, audio, courses, wallet, notifications, admin/teacher APIs. Nêu trong architecture.

### Main features by actor

- **Learner:** quản lý hồ sơ/mục tiêu, luyện 4 kỹ năng, học vocab/grammar, thi thử, xem kết quả/rubric/feedback, learning path/progress/streak, đăng ký khóa học và đặt lịch 1-1.
- **Teacher:** xem dashboard lịch dạy, lịch học chung/1-1, danh sách booking, gửi đơn nghỉ.
- **Staff/Admin:** quản lý nội dung học, đề thi/version, practice content, rubric chấm điểm, khóa học/slot/booking, người dùng, wallet/topup/promo/config, analytics.

## 3. Solution design

### Architecture slide

```text
Learner Web / Mobile / Admin Web
        ↓
Laravel API
        ↓
Database + Queue + Storage
        ↓
AI / language / speech services as signal providers
```

Nói ngắn: frontend phục vụ learner/admin/teacher; backend giữ nghiệp vụ; tác vụ Writing/Speaking chạy qua assessment jobs/results.

### Assessment mechanism slide

Điểm cần nói chủ động:

- Listening/Reading: chấm theo đáp án.
- Writing/Speaking: hệ thống tính điểm theo rubric/formula.
- AI/công cụ ngoài chỉ hỗ trợ trích tín hiệu và feedback.
- Điểm Writing/Speaking là điểm luyện tập/thi thử tham khảo, không phải điểm chính thức.

### Rubric versioning slide

- Admin tạo draft từ version cũ.
- Chỉnh policy/trọng số trong version mới.
- Simulate/kiểm tra rồi activate.
- Kết quả cũ giữ liên kết với version tiêu chí đã dùng.

### Learning path/SRS slide

Nói vừa đủ:

- Learning path dùng mục tiêu profile, điểm thi thử và tiến độ luyện tập.
- Vocab có SRS để ôn tập ngắt quãng.
- Không cần trình bày sâu thuật toán nếu chưa bị hỏi.

## 4. Product demo

### Demo chính trên learner web

1. Login learner.
2. Dashboard: mục tiêu, streak, heatmap, năng lực 4 kỹ năng, điểm qua các lần thi.
3. Practice hub: vocab/grammar, 4 kỹ năng, gợi ý ưu tiên từ learning path.
4. Thi thử: thư viện đề, phiên đang làm/đã nộp, kết quả theo kỹ năng.
5. Chi tiết kết quả: Listening/Reading đúng-sai; Writing/Speaking có rubric, feedback, transcript/audio nếu có.
6. Quay lại learning path/progress để chỉ ra điểm yếu và next action.
7. Nếu còn thời gian: admin rubric versioning hoặc mobile learner app.

### Không đưa vào trọng tâm demo

- Wallet/topup/promo: có trong code nhưng là vận hành, không phải giá trị học tập lõi.
- Course enrollment/booking 1-1: chỉ demo nếu hỏi business flow.
- Teacher leave/schedule: đúng scope teacher portal, không cần demo main flow.
- Backend rule-based risk endpoint: không trình bày như predictive analytics đã kiểm chứng.

## 5. Result & closing

### Achievements nên nói

- Hoàn chỉnh core learning loop cho learner.
- Có luyện tập/thi thử đủ 4 kỹ năng.
- Writing/Speaking có rubric, evidence, feedback và formula.
- Có dashboard/progress/learning path/SRS.
- Có admin quản trị nội dung, đề thi/version và rubric versioning.
- Có learner mobile companion.

### Limitations nên nói ngắn

- **Writing/Speaking scoring:** điểm tham khảo để luyện tập, không thay điểm chính thức/giám khảo.
- **Validation:** chưa có bộ dữ liệu VSTEP chính thức do giám khảo chấm quy mô lớn.
- **Predictive/SLA:** chưa claim ML predictive accuracy, 99% uptime hoặc <3s nếu chưa có benchmark.

### Future work nếu cần

- Dynamic adaptive difficulty toàn hệ thống.
- Predictive analytics khi có dữ liệu thực tế đủ lớn.
- Teacher-assigned personalized modules.
- Large-scale validation với bài chấm chính thức.
- SLA/scale testing production.

## Scope alignment với phiếu đăng ký

### Nói chủ động trên slide

- **Comprehensive skill assessment:** có luyện tập và thi thử đủ 4 kỹ năng; Listening/Reading chấm theo đáp án, Writing/Speaking chấm theo rubric/formula.
- **Personalized learning support:** learning path/gợi ý học tiếp dựa trên mục tiêu, điểm thi thử và tiến độ luyện tập.
- **Adaptive exercises:** trình bày là gợi ý luyện tập theo điểm yếu và SRS cho từ vựng.
- **AI module:** AI/công cụ ngoài hỗ trợ lấy tín hiệu và feedback; điểm cuối do formula/rubric của hệ thống tính.
- **Rubric update:** admin quản lý rubric versioning: draft, simulate, activate; kết quả cũ giữ version đã dùng.
- **Mobile application:** có learner mobile companion; demo chính vẫn trên web.
- **Reporting/analytics:** learner có dashboard/streak/heatmap/score trend; admin có analytics vận hành.

Chi tiết các phần thu hẹp so với phiếu đăng ký để ở `02-cham-diem-va-kiem-chung.md` mục Q&A, không tự đưa hết lên slide chính.

## Câu chốt

> Giá trị sản phẩm nằm ở vòng học: thi thử → phát hiện điểm yếu → gợi ý học tiếp → luyện tập → theo dõi tiến bộ.
