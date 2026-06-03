# Defense Pack — VSTEP Preparation System

## Mục tiêu bộ tài liệu

Tài liệu này dùng để gen slide/notes bảo vệ theo hướng: **nói core trước, demo sản phẩm sớm, chi tiết lệch scope để Q&A**.

## Đọc theo thứ tự

1. `01-noi-dung-bao-ve.md` — blueprint main deck, scope chính, demo flow.
2. `02-cham-diem-va-kiem-chung.md` — deep dive chấm điểm, validation, Q&A.

## Quy ước gen docs/slide

- Heading cấp 2 là section boundary.
- Heading cấp 3 là subsection/slide detail.
- Không biến mọi bullet thành slide riêng.
- Main deck chỉ nên có 16–18 slide; phần chi tiết để backup/Q&A.
- Demo chính trên learner web; admin dùng để chứng minh quản trị/rubric; mobile chỉ mở nhanh nếu cần.

## Tên đề tài

- **EN:** An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support
- **VI:** Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa
- **Code:** SP26SE145

## One-liner

> Hệ thống luyện thi VSTEP hỗ trợ luyện 4 kỹ năng, thi thử, chấm Writing/Speaking có căn cứ, phát hiện điểm yếu từ dữ liệu bài thi thử và gợi ý lộ trình học tiếp.

## Core story phải giữ

```text
Người học luyện tập/thi thử → hệ thống chấm có căn cứ → phát hiện điểm yếu → gợi ý học tiếp → theo dõi tiến độ.
```

## Nói chủ động vs để Q&A

Nói chủ động trên slide:

- Core learning loop và demo thật.
- Luyện 4 kỹ năng + thi thử.
- AI không quyết định điểm cuối; hệ thống tính theo rubric/formula.
- Writing/Speaking là điểm luyện tập tham khảo.
- Chưa claim official accuracy/SLA nếu chưa có số đo.

Chỉ trả lời khi hội đồng hỏi:

- Placement test riêng hiện chưa có.
- Adaptive difficulty toàn hệ thống chưa hoàn chỉnh.
- Predictive analytics hiện mới ở mức rule-based support/hướng phát triển.
- Teacher giao module cá nhân hóa chưa có.
- 99% uptime/<3s nếu bị hỏi.

## Từ nên dùng

- Tránh “điểm chính thức” → nói “điểm thi thử tham khảo” hoặc “điểm ước lượng năng lực”.
- Tránh “AI chấm điểm” → nói “hệ thống tính điểm theo công thức, AI hỗ trợ phân tích/feedback”.
- Tránh “chấm chuẩn VSTEP” → nói “bám định dạng VSTEP và có căn cứ chấm điểm”.
- Tránh “dữ liệu vàng” → nói “bộ mẫu kiểm thử nội bộ” hoặc “bộ mẫu đối chiếu”.
- Tránh “dự đoán kết quả” → nói “báo cáo tiến độ và định hướng học tiếp”.

## Code scope đã rà

- `apps/backend-v2`: API/business logic cho auth/profile, practice, thi thử, assessment jobs/results, learning path/progress, courses, wallet, notifications, admin/teacher APIs.
- `apps/frontend-v3`: learner web cho dashboard, luyện tập, thi thử, kết quả chấm, khóa học/đặt lịch, hồ sơ/wallet/promo.
- `apps/admin`: staff/admin/teacher web cho quản lý nội dung, đề/version, rubric, courses/slots/bookings, users, topup/promo/config, analytics, teacher schedule/bookings/leave.
- `apps/mobile-v2`: learner mobile companion cho tổng quan, luyện tập, thi thử, kết quả, khóa học, hồ sơ, wallet/topup, notifications.

Không đưa `_deprecated` vào scope bảo vệ.
