# Claude Design Prompt — Luồng 4 Kỹ Năng

## Design System (bắt buộc)

Phong cách: Duolingo gamification — friendly, rounded, 3D depth illusion.

Signature pattern — Depth border:
- Neutral card: viền xám nhạt trên + viền xám đậm dưới (border-2 border-b-4), bg trắng
- Semantic card: border-{color}/15 trên, border-{color}/40 dưới, bg-{color}/10
- Filled button: bg solid + viền oklch tối hơn, active ấn xuống 3px

Colors:
- Primary: vivid blue
- Listening: sky blue
- Reading: green
- Writing: purple
- Speaking: orange
- Success: duo green, Warning: duo yellow, Destructive: duo red
- Coin: amber (exception)

Radius: large card 16px, medium card 12px, button 8px, badge full
Typography: rounded sans-serif, bold headings
Icons: Icons8 3D Fluency PNG (gamification) + Lucide (UI), KHÔNG bọc bg

Interaction:
- Button: hover brightness tăng, active translate-y 3px (ấn xuống)
- Card (div): hover shadow-md, KHÔNG có active
- MCQ option (button): hover bg nhạt, active ấn xuống

Forbidden: gradient offset shadow, emoji Unicode, rounded-3xl, dark: variants, raw Tailwind palette (slate/emerald/rose...), icon bọc bg circle

---

## Yêu cầu: Design lại luồng 4 kỹ năng (Listening, Reading, Writing, Speaking)

### Luồng hiện tại (cần redesign):

**Trang 1: Skill Hub** (`/luyen-tap/ky-nang`)
- Tab bar 4 kỹ năng (Nghe, Đọc, Nói, Viết) với skill-coded underline
- Sidebar chọn category (Part 1/2/3 hoặc Level A2/B1/B2/C1)
- Grid danh sách bài tập (ExerciseCard)

**Trang 2: Session (làm bài)** — khác nhau theo skill:

- **Listening** (`/luyen-tap/ky-nang/nghe/$exerciseId`):
  - Audio player (TTS) + subtitle sync
  - MCQ questions bên dưới
  - Submit → kết quả

- **Reading** (`/luyen-tap/ky-nang/doc/$exerciseId`):
  - Split panel: passage trái + MCQ questions phải
  - Highlight text, interactive passage
  - Submit → kết quả

- **Writing** (`/luyen-tap/ky-nang/viet/$exerciseId`):
  - Đề bài + word count target
  - Text editor (textarea)
  - Submit → AI grading (annotated feedback với stickers)
  - Sub-flow: Luyện theo câu (`/viet/cau/$topicId`) — nghe + điền từ

- **Speaking** (`/luyen-tap/ky-nang/noi/$exerciseId`):
  - Shadowing mode: nghe câu mẫu → ghi âm nhại theo
  - Audio bar (play/speed) + Record button (mic)
  - Nav pills (câu 1, 2, 3...)
  - Submit → kết quả

**Trang 3: Kết quả** (`/ket-qua`):
- Score card (% đúng)
- Chi tiết từng câu (đúng/sai + giải thích)
- Nút "Làm lại" / "Về danh sách"

### Data mẫu:

Listening exercise:
- Title: "Part 1 — Hội thoại ngắn #3"
- 8 items (MCQ 4 options mỗi câu)
- Audio TTS, estimated 15 phút

Reading exercise:
- Title: "Part 2 — Đọc hiểu đoạn văn #5"
- Passage 300 từ + 6 MCQ questions
- Estimated 20 phút

Writing exercise:
- Title: "Task 1 — Viết thư phản hồi"
- Min 120 từ, max 150 từ
- Estimated 25 phút
- AI grading: 4 criteria (Task Achievement, Coherence, Lexical, Grammar) mỗi cái 0-10

Speaking exercise:
- Title: "B1 — Mô tả hình ảnh #2"
- 5 sentences to shadow
- Estimated 10 phút

### Constraints:
- Mobile-first, responsive
- Session pages: max-width 3xl (single column) hoặc 6xl (split panel cho Reading)
- Hub page: max-width 5xl
- Mỗi skill có accent color riêng xuyên suốt session
- Progress indicator rõ ràng (câu mấy / tổng)
- Footer cố định với nút Submit/Next
