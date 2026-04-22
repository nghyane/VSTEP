# Exam Room Color System

## Nguyên tắc màu sắc trong phòng thi

Phòng thi (`/phong-thi`) dùng màu **thống nhất theo hệ thống**, khác với phần luyện tập (dùng skill color riêng).

### Rule: Interactive elements → `primary`

Tất cả các element tương tác trong phòng thi dùng `primary` (green), không dùng skill color:

- Jump buttons (số câu): `bg-primary`, hover `hover:border-primary/40 hover:bg-primary/5`
- Part/Passage tabs active: `bg-primary`
- Progress underline fill: `bg-primary/50`
- MCQ option selected: `border-primary bg-primary/8`, badge `bg-primary`
- Nút Phát audio, Part next, Nộp bài: `.btn .btn-primary`

### Rule: Skill color → identifier only

Skill color (`skill-listening`, `skill-reading`, ...) chỉ dùng cho:

- Badge nhận dạng phần: "Phần 1" badge trong passage/section header
- Audio indicator (đang phát): border + text
- Progress bar audio: `bg-skill-listening`
- Footer skill label: "Nghe (1/1)", "Đọc (1/1)"
- Icon volume indicator

### MCQQuestion — prop `skill`

`MCQQuestion` có prop `skill?: "listening" | "reading"` nhưng **hiện tại cả hai đều dùng `primary`**. Prop được giữ lại cho tương lai (nếu cần differentiate). `SKILL_CLASSES` lookup đã bị xóa — dùng class tĩnh `primary`.

### ReadingPanel vs luyện tập

- `ReadingPanel` (exam): `primary` cho interactive, `skill-reading` chỉ cho badge "Phần X"
- `ReadingInProgress` (practice): `skill-reading` cho tất cả — intentionally different

### Lý do

User đang làm toàn bộ bài thi 4 kỹ năng liên tiếp. Màu nhất quán giúp UX mượt, tránh cognitive load khi chuyển skill. Skill color chỉ cần đủ để nhận dạng "đang ở phần nào".
