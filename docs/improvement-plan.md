# VSTEP - Kế hoạch cải tiến & phát triển

> Cập nhật: 2026-04-09

---

## 1. Luyện tập (Practice)

- [ ] Coi lại tổng thời lượng, tổng bài tập cho đúng ở trang luyện tập
- [ ] Cấp độ không nên thể hiện trình độ (B1, B2…) — chỉ hiển thị cấp độ (Cấp 1, Cấp 2, Cấp 3) thôi, bỏ label level CEFR
- [ ] Thêm toggle mode luyện tập: bật/tắt hỗ trợ gợi ý cụm từ
- [ ] Cho user luyện theo bộ đề (nhóm đề có hệ thống)
- [ ] Xem lại logic phân chia section

---

## 2. Từ vựng (Vocabulary) — Cần làm lại lớn

- [ ] Sử dụng Anki (spaced repetition) để hiển thị phần học từ vựng
- [ ] Học theo bộ từ, phân loại theo trình độ B1/B2/C1
- [ ] Làm thêm data từ vựng (seed thêm dữ liệu)
- [ ] Gắn từ vựng, mẫu câu theo độ khó theo cấp độ CEFR
- [ ] Cần người chịu trách nhiệm đưa bộ từ vào (admin/content manager)
- [ ] Cho user học từ vựng trước trong flow học tập

---

## 3. Ngữ pháp (Grammar) — Module mới

- [ ] Lưu ngữ pháp ở database cho legit (không hardcode)
- [ ] Tìm github repo english grammar để lấy nguồn data seed
- [ ] Mỗi grammar point có cấu trúc câu + bộ câu ví dụ
- [ ] Luyện theo câu thuộc về phần viết (sentence practice → writing)
- [ ] Flow: học lý thuyết trước → sau đó mới rèn luyện kỹ năng

---

## 4. Viết (Writing)

- [ ] Thêm book sticker vào writing (template/mẫu câu có sẵn)
- [ ] Thêm mẫu câu có sẵn để người dùng tự gõ vào (sentence starters)
- [ ] Format lại giao diện writing practice
- [ ] Thiếu cấu trúc câu trong chấm điểm — thêm grammar/structure analysis
- [ ] Sửa lại giao diện hiển thị sau khi chấm điểm: chỉ rõ sai ở đâu, liệt kê ngữ pháp

---

## 5. Thi thử (Exam)

- [ ] Format lại kết quả chấm bài thi thử cho tốt hơn
- [ ] Tạo giờ theo đề thi cho user chọn (chọn thời lượng → tạo đề phù hợp)
- [ ] Khi mới vào cho user chọn thi bao nhiêu phút rồi generate đề
- [ ] Cho thêm thi thử mất xu (monetization)

---

## 6. Tiến độ (Progress Tracking)

- [ ] Đặt tên nickname ở trang tiến độ
- [ ] Độ đậm nhạt commit tiến độ (heatmap kiểu GitHub contributions)
- [ ] Đưa mục tiêu lên đầu trang dashboard
- [ ] Sửa lại biểu đồ theo dõi tiến độ sang stacked column
- [ ] UI nhấn mạnh goal-oriented: tập trung để đạt mục tiêu

---

## 7. Lớp học (Classroom) — Đơn giản hóa

- [ ] Làm đơn giản lại lớp học
- [ ] Phòng thi theo ngày, theo khóa có sẵn
- [ ] Cho giáo viên qua Google Meet hoặc tương tự
- [ ] Gần ngày thi gửi thông báo nhắc nhở cho user
- [ ] Giới hạn slot để mua gói học với giáo viên

---

## 8. Monetization & Gói dịch vụ — Module mới

- [ ] Cho user mua gói thi (N lần thi trong M ngày)
- [ ] Cam kết trong vòng bao nhiêu ngày/tháng — nếu vi phạm có penalty
- [ ] Nếu không thi đúng cam kết → đóng tài khoản + gửi thông báo cảnh báo
- [ ] Khi mới bắt đầu cho user mua theo khóa (onboarding → chọn gói)

---

## 9. Hệ thống & Kỹ thuật (Technical)

- [ ] Xử lý lại nộp trễ — thời gian có ảnh hưởng gì không, kiểm tra toàn diện
- [ ] Kiểm tra lại toàn bộ vấn đề kỹ thuật
- [ ] Lưu tiêu chí chấm điểm chuẩn: tỉ lệ đóng góp của các phần thi mỗi kỹ năng vào DB
- [ ] Kiểm tra thông tư đồ án chuẩn (đối chiếu quy định VSTEP chính thức)

---

## 10. Tổ chức & UX

- [ ] Design lại phần tổ chức (restructure navigation/layout)
- [ ] Làm lại các tính năng cơ bản cho chắc trước khi thêm mới

---

## Thứ tự ưu tiên đề xuất

| Ưu tiên | Nhóm | Lý do |
|---------|-------|-------|
| 🔴 Cao | Fix bug & polish (1, 9) | Sửa những gì đang sai trước |
| 🔴 Cao | Core learning flow: Từ vựng → Ngữ pháp → Luyện tập (2, 3, 1) | Nền tảng học tập |
| 🟡 Trung bình | Writing & Exam (4, 5) | Nâng cao trải nghiệm luyện/thi |
| 🟡 Trung bình | Progress & UX (6, 10) | Dashboard & navigation |
| 🟢 Thấp | Classroom đơn giản hóa (7) | Giảm complexity |
| 🟢 Thấp | Monetization (8) | Làm sau cùng khi core ổn định |
