# [Feature] Seed bộ đề chuẩn VSTEP cho Admin sử dụng ngay

## Context

Backend đã có validation chặn blueprint sai cấu trúc VSTEP. Tuy nhiên hệ thống hiện chưa có bộ đề mẫu chuẩn để Admin có thể dùng ngay sau khi deploy/local setup.

Kết quả là luồng vận hành thực tế vẫn chậm: phải tự tạo thủ công toàn bộ câu hỏi + exam blueprint trước khi có thể test/demo.

## Goal

Seed sẵn **ít nhất 3 đề mẫu** (B1, B2, C1), mỗi đề bám chuẩn cấu trúc đang enforce:

- Listening: 35 items, phân part **8 / 12 / 15**
- Reading: 40 items, phân part **10 / 10 / 10 / 10**
- Writing: 2 tasks
  - Part 1 (letter): minWords >= 120
  - Part 2 (essay): minWords >= 250
- Speaking: 3 parts (mỗi part 1 question)

## Scope

### In scope

1. Tạo dữ liệu seed câu hỏi mẫu tối thiểu cho đủ 3 đề B1/B2/C1 theo đúng part/skill.
2. Tạo exam records + blueprint liên kết đúng questionIds.
3. Đảm bảo seed chạy idempotent (chạy lại không tạo trùng vô hạn).
4. Cập nhật hướng dẫn run seed cho team.

### Out of scope

- Viết full ngân hàng câu hỏi production-scale.
- Tối ưu nội dung học thuật/biên soạn sâu từng prompt.
- Frontend authoring UX.

## Deliverables

- Script seed backend tạo dữ liệu đề chuẩn B1/B2/C1.
- Tài liệu ngắn mô tả dữ liệu nào được seed và cách verify nhanh.
- 1 checklist verify sau seed.

## Acceptance Criteria

1. Sau khi chạy seed, DB có ít nhất 3 exam active: `B1`, `B2`, `C1`.
2. Mỗi exam pass qua validate blueprint của backend (không bị reject khi tạo/update).
3. Mỗi exam có đủ 4 skills (L/R/W/S) với cấu trúc chuẩn nêu trên.
4. Có thể start exam session thành công cho cả 3 đề đã seed.
5. Tài liệu team có lệnh chạy seed + lệnh verify cơ bản.

## Implementation Notes (đề xuất)

- Ưu tiên đặt seed trong `apps/backend/seed/` theo convention hiện tại.
- Nội dung câu hỏi có thể ở mức demo nhưng phải hợp lệ schema từng part.
- Nên thêm marker/tag trong title (ví dụ: `Seed B1 Standard`) để nhận diện dữ liệu seed.

## Suggested Tasks

- [ ] Thiết kế fixture questions cho Listening/Reading/Writing/Speaking theo từng part.
- [ ] Implement seed script tạo questions + exams + blueprint map.
- [ ] Bổ sung guard/idempotency (check theo title/tag trước khi insert).
- [ ] Verify bằng chạy API list exams và start session.
- [ ] Cập nhật README/notes cho team.

## Definition of Done

Issue được xem là done khi một thành viên mới clone repo có thể chạy seed và có ngay bộ đề B1/B2/C1 hợp chuẩn để demo flow end-to-end mà không cần tạo đề thủ công.
