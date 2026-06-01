# Prompt: HTML/CSS Prototype — VSTEP Writing Practice (Zen Focus)

Tạo **1 file HTML duy nhất** (inline CSS + JS) để prototype trang luyện viết VSTEP. Có 2 chế độ chuyển bằng toggle: **✍️ Viết bài** và **📖 Phân tích bài mẫu**.

---

## Design Tokens (BẮT BUỘC tuân thủ)

```
Background:       #fafafa
Card surface:     #ffffff
Primary:          #1a6ef5
Muted bg:         #f3f4f6
Muted text:       #6b7280
Border:           #e5e7eb
Success:          #22c55e
Warning:          #f59e0b
Destructive:      #ef4444
Writing skill:    #8b5cf6

Card chính:       border-radius 16px, background #f3f4f6, padding 20px, box-shadow 0 1px 3px rgba(0,0,0,0.1)
Card item:        border-radius 12px, border 1px solid #e5e7eb, background white, padding 16px
Button:           border-radius 8px
Pill button:      border-radius 9999px

Font:             system-ui, -apple-system, sans-serif
Page title:       24px bold
Card title:       18px semibold (600)
Body text:        14px, line-height 2.0
Label:            14px #6b7280
Tiny label:       12px #6b7280
Micro label:      10px #6b7280
```

## Quy tắc thiết kế

- Icon render trần (emoji hoặc SVG nhỏ), KHÔNG bọc trong khung có background riêng
- Hover card: chỉ nâng nhẹ (translateY -1px) + tăng shadow. KHÔNG đổi màu border
- Sticker chú thích: KHÔNG CÓ NỀN (transparent). Chỉ có dot màu + text
- Connector line: nét liền (solid), stroke-width 1.5px, màu #d4d4d8

---

## Cấu trúc tổng thể

```
┌──────────────────────────────────────────────────┐
│ Header: "Part 1 · Viết thư" (purple #8b5cf6)    │
│ Title: "Thư xin lỗi bạn bè" (24px bold)         │
│ Subtitle: mô tả ngắn (14px #6b7280)             │
├──────────────────────────────────────────────────┤
│ Config: [B1] [B2●] [C1]  ·  [✍️ Viết] [📖 Mẫu] │
├──────────────────────────────────────────────────┤
│ Prompt card (đề bài)                              │
├──────────────────────────────────────────────────┤
│                                                   │
│  NỘI DUNG CHÍNH (thay đổi theo toggle)           │
│                                                   │
├──────────────────────────────────────────────────┤
│ Footer fixed: word count + [Nộp bài]             │
└──────────────────────────────────────────────────┘
```

---

## Toggle Switcher (giữa trang, dưới config)

- Container: background #e5e7eb, border-radius 9999px, padding 4px
- 2 nút: "✍️ Viết bài" và "📖 Bài mẫu"
- Active: background white, box-shadow 0 1px 3px rgba(0,0,0,0.1), color #27272a
- Inactive: background transparent, color #6b7280
- Transition: 0.2s ease

---

## Chế độ 1: ✍️ Viết bài

Layout đơn giản, max-width 700px, căn giữa.

```
┌──────────────────────────────────────┐
│ Prompt card                          │
│ border-left: 4px solid #27272a       │
│ "You missed your best friend's..."   │
├──────────────────────────────────────┤
│                                      │
│ Textarea                             │
│ - Không border, không background     │
│ - font-size 16px, line-height 2.0    │
│ - min-height 50vh                    │
│ - placeholder: "Bắt đầu viết..."    │
│                                      │
├──────────────────────────────────────┤
│ 45 / 100-140 từ          [Nộp bài]  │
└──────────────────────────────────────┘
```

---

## Chế độ 2: 📖 Bài mẫu (PHẦN QUAN TRỌNG NHẤT)

Layout CSS Grid 3 cột, full width:

```css
grid-template-columns: 200px 1fr 200px;
gap: 24px;
```

### Cột giữa: Bài mẫu

- 1 khối text liền mạch (KHÔNG tách từng paragraph ra card riêng)
- Background white, border-radius 16px, padding 32px 40px, box-shadow 0 4px 24px rgba(0,0,0,0.06)
- Font 15px, line-height 2.0, color #27272a
- Trong text có các `<span>` highlight:
  - Vàng: `background: rgba(254, 240, 138, 0.5); border-radius: 3px; padding: 1px 3px`
  - Xanh: `background: rgba(191, 219, 254, 0.5); ...`
  - Hồng: `background: rgba(251, 207, 232, 0.5); ...`
- Cuối bài mẫu: nút "🤖 Hỏi AI về bài mẫu" (border 1px #e5e7eb, border-radius 8px, font 12px, color #1a6ef5)

### Cột trái + phải: Sticker chú thích

**QUAN TRỌNG: Sticker KHÔNG CÓ NỀN, KHÔNG CÓ BORDER. Transparent hoàn toàn.**

Mỗi sticker gồm:
- Header: dot tròn 8px (màu khớp highlight) + tiêu đề bold 12px
- Body: text 12px color #6b7280, margin-top 4px
- Sticker trái: text-align right (căn về phía bài mẫu)
- Sticker phải: text-align left (căn về phía bài mẫu)
- Khoảng cách giữa các sticker: tự do, đặt theo vị trí highlight tương ứng

### SVG Connector Lines

- 1 thẻ `<svg>` overlay toàn bộ grid, position absolute, pointer-events none
- Mỗi line: `<path>` cubic bezier, stroke #d4d4d8, stroke-width 1.5, fill none (NÉT LIỀN, không dash)
- Trái: nối từ mép phải sticker → mép trái highlight span
- Phải: nối từ mép phải highlight span → mép trái sticker
- Curve offset ~50px cho mượt
- Tính toán bằng JS `getBoundingClientRect()`, chạy lại khi resize

---

## Dữ liệu mẫu

### Đề bài
```
Part 1 · Viết thư
Thư xin lỗi bạn bè
Viết thư xin lỗi một người bạn vì đã lỡ hẹn dự sinh nhật.

"You missed your best friend's birthday party last week because of a family emergency. Write a letter to your friend to:
- Apologize for not attending the party
- Explain the reason why you could not come
- Suggest a way to make it up to them
Write your letter in about 120 words."
```

### Bài mẫu (cho chế độ Phân tích)
```
Dear Minh,

I am writing to apologize for not being able to attend your birthday party last Saturday. I feel terrible about missing such an important day.

Unfortunately, my grandmother suddenly fell ill that morning, and my family had to rush her to the hospital. Everything happened so quickly that I could not even send you a message. I am truly sorry for letting you down.

To make it up to you, I would love to take you out for dinner this weekend. We could go to that new Italian restaurant you mentioned. It would be my treat!

Once again, I am truly sorry. Please forgive me.

Best wishes,
Lan
```

### Highlight spans + Sticker data

```
HIGHLIGHT 1 (vàng): "Dear Minh," (đầu bài)
  → Sticker TRÁI: dot vàng + "Lời chào" + "Mở đầu thân mật, đúng tone thư bạn bè"

HIGHLIGHT 2 (xanh): "I am writing to apologize for"
  → Sticker PHẢI: dot xanh + "Cấu trúc B1" + "I am writing to + V — câu mở đầu thư formal"

HIGHLIGHT 3 (hồng): "Unfortunately"
  → Sticker TRÁI: dot hồng + "Từ nối" + "Chuyển đoạn mượt, tạo tone đồng cảm"

HIGHLIGHT 4 (xanh): "I would love to take you out"
  → Sticker PHẢI: dot xanh + "Nâng cấp B2" + "would love to + V — lịch sự hơn 'want to'"

HIGHLIGHT 5 (vàng): "Once again, I am truly sorry."
  → Sticker TRÁI: dot vàng + "Kết thư" + "Nhắc lại lời xin lỗi + chào kết đúng format"
```

---

## Responsive

- Dưới 1024px: ẩn 2 cột sticker + ẩn SVG connector. Grid thành 1 cột, chỉ hiện bài mẫu với highlight
- Dưới 768px: chế độ Viết padding 16px 2 bên, textarea full width

---

## Checklist output

- [ ] 1 file HTML duy nhất, mở trực tiếp trên trình duyệt
- [ ] Toggle chuyển giữa 2 chế độ hoạt động
- [ ] Chế độ Viết: textarea thoáng, word count, nút Nộp bài
- [ ] Chế độ Mẫu: 3 cột grid, bài mẫu giữa, sticker 2 lề KHÔNG CÓ NỀN
- [ ] SVG connector lines nét liền trỏ đúng từ sticker vào highlight span
- [ ] Connector tính lại khi resize
- [ ] Responsive: ẩn sticker + connector dưới 1024px
- [ ] Đúng design tokens (màu, radius, shadow, font)
