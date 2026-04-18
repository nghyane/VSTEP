# Icon Selection Criteria — Icons8

## Source

- **Website:** https://icons8.com/icons
- **License:** Free với attribution (link Icons8 ở footer). PNG max 96px free. SVG cần paid hoặc dùng PNG.
- **Attribution:** Thêm link `<a href="https://icons8.com">Icons by Icons8</a>` ở footer app.

## Tiêu chí chọn icon (dựa trên Duolingo art style)

### 1. Style bắt buộc: **"3D Fluency"** hoặc **"Color"**

Duolingo dùng icon style:
- **Rounded, bouncy** — góc bo tròn, không sharp edge
- **Bright, vibrant colors** — màu tươi sáng, không muted/pastel
- **Slight gradient/3D feel** — có chiều sâu nhẹ, không hoàn toàn flat
- **Minimal detail** — đơn giản, nhận diện nhanh trên màn hình nhỏ
- **White negative space** — icon có khoảng trống, không chật

→ Trên Icons8, style **"3D Fluency"** gần nhất. Fallback: **"Color"** hoặc **"Bubbles"**.

**KHÔNG dùng:** Outlined, Glyph, iOS, Windows, Material, Doodle, Stickers.

### 2. Keyword search trên Icons8

Khi cần icon mới, search theo thứ tự ưu tiên:

```
1. Search: "{keyword}" → Filter style: "3D Fluency"
2. Nếu không có → Filter style: "Color"  
3. Nếu không có → Filter style: "Bubbles"
4. Nếu vẫn không có → dùng Phosphor Icons fill (fallback 1 màu)
```

### 3. Kích thước download

| Dùng cho | Size | Format |
|---|---|---|
| Icon trong card, chip, badge | 48px hoặc 64px | PNG |
| Icon hero (lesson complete, achievement) | 96px | PNG |
| Icon nhỏ inline text | 32px | PNG |

**Lưu ý:** Free chỉ có PNG max 96px. Đủ dùng vì icon gamification không cần scale lớn hơn.

### 4. Naming convention

File đặt tại `public/icons/` với tên:

```
{tên-tiếng-anh}.png
```

Ví dụ: `fire.png`, `heart.png`, `trophy.png`, `headphones.png`

### 5. Danh sách icon cần thiết

| # | Tên | Keyword search Icons8 | Dùng cho |
|---|---|---|---|
| 1 | `fire` | "fire" | Streak |
| 2 | `heart` | "heart" | Hearts/lives |
| 3 | `star` | "star" | Rating, achievement |
| 4 | `trophy` | "trophy" | Achievement, leaderboard |
| 5 | `gem` | "gem" hoặc "diamond" | Premium (dự phòng) |
| 6 | `lightning` | "lightning" hoặc "flash" | Combo, XP, energy |
| 7 | `book` | "book" hoặc "open book" | Reading skill |
| 8 | `target` | "target" hoặc "bullseye" | Daily quest |
| 9 | `headphones` | "headphones" | Listening skill |
| 10 | `microphone` | "microphone" | Speaking skill |
| 11 | `pencil` | "pencil" hoặc "edit" | Writing skill |
| 12 | `lock` | "lock" hoặc "padlock" | Locked content |
| 13 | `gift` | "gift" hoặc "present" | Rewards nhỏ |
| 14 | `chest` | "treasure chest" hoặc "chest" | Reward chest lớn |
| 15 | `graduation` | "graduation cap" | Level/XP |
| 16 | `clock` | "clock" hoặc "alarm" | Time |
| 17 | `rocket` | "rocket" | Level up |
| 18 | `crown` | "crown" | Leaderboard #1 |
| 19 | `coin` | "coin" hoặc "gold coin" | Xu (nếu không dùng custom) |
| 20 | `check` | "checkmark" hoặc "done" | Correct |
| 21 | `cross` | "cross" hoặc "cancel" | Wrong |
| 22 | `users` | "group" hoặc "people" | Lượt thi |
| 23 | `notification` | "bell" hoặc "notification" | Thông báo |
| 24 | `streak-calendar` | "calendar" hoặc "schedule" | Streak calendar |

### 6. Tiêu chí visual khi chọn giữa nhiều kết quả

Khi search ra nhiều icon cùng keyword, chọn theo thứ tự ưu tiên:

1. **Có gradient/3D nhẹ** > hoàn toàn flat
2. **Góc bo tròn** > góc vuông
3. **Ít chi tiết** > nhiều chi tiết (icon phải đọc được ở 24px)
4. **Màu tươi sáng** > màu tối/muted
5. **Không có text bên trong** icon
6. **Không có nền/background** (transparent)
7. **Cùng visual weight** với các icon đã chọn (không quá dày hoặc quá mỏng)

### 7. Quy trình thêm icon mới

```
1. Xác định cần icon gì → check danh sách trên
2. Vào icons8.com/icons → search keyword
3. Filter style "3D Fluency" (hoặc "Color")
4. Chọn icon theo tiêu chí visual (mục 6)
5. Download PNG 96px (hoặc 64px nếu chỉ dùng nhỏ)
6. Đặt vào public/icons/{name}.png
7. Dùng: <NotoIcon name="{name}" className="size-6" />
   (rename component thành GameIcon sau khi chốt)
```

### 8. Fallback khi Icons8 không có

Nếu Icons8 không có icon phù hợp cho 1 use case:

1. **Phosphor Icons fill** — cho UI icon 1 màu (arrow, chevron, plus, x, check)
2. **Custom asset** — cho brand-specific (coin Lottie, streak fire GIF, notification GIF)
3. **Không tự vẽ** — không dùng Lucide, không dùng emoji Unicode

### 9. Attribution (bắt buộc cho free tier)

Thêm vào footer app:

```html
<a href="https://icons8.com" target="_blank" rel="noopener">
  Icons by Icons8
</a>
```

Hoặc trong About/Credits page nếu không muốn ở footer chính.

### 10. Duolingo art style reference

Từ blog chính thức Duolingo (blog.duolingo.com/shape-language-duolingos-art-style/):

- **Bold, bouncy, bright** — 3 từ khóa chính
- **Rounded shapes** — không có góc nhọn
- **Exaggeration** — icon hơi phóng đại proportion
- **Minimal detail** — chỉ giữ chi tiết cần thiết để nhận diện
- **White negative space** — icon "thở", không chật
- **Vibrant colors** — saturation cao, lightness 0.65-0.85
- **Slight 3D/gradient** — không flat hoàn toàn, có chiều sâu nhẹ

→ Đây là lý do chọn "3D Fluency" trên Icons8 — style này match nhất với Duolingo.
