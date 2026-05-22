# Icon Selection Criteria — Icons8

Áp dụng theo tiêu chí của `frontend-v2/docs/icon-criteria.md`.

## Source

- **Website:** https://icons8.com/icons
- **Style priority** (theo doc FE-v2):
  1. **3D Fluency** — ưu tiên #1
  2. **Color** — fallback nếu 3D Fluency thiếu
  3. **Bubbles** — fallback cuối
- **License:** Free với attribution. PNG max 256px free.
- **Attribution:** Link `<a href="https://icons8.com">Icons by Icons8</a>` ở footer (chưa add — nhớ thêm trước production).

## Quy tắc đồng bộ style (QUAN TRỌNG)

**TẤT CẢ icon trong cùng 1 nhóm (vd: 4 kỹ năng) PHẢI cùng 1 style.**
- Không mix 3D Fluency + Plasticine + Color cùng lúc → trông không đồng bộ
- Nếu 1 icon trong nhóm thiếu trong style ưu tiên → fallback **toàn bộ nhóm** sang style thấp hơn

### Ví dụ áp dụng cho 4 kỹ năng VSTEP

Test 3D Fluency có đủ 4 kỹ năng không:
- ✅ book, microphone, pencil
- ❌ **headphones** (không có trong 3D Fluency)

→ Fallback **toàn bộ 4 icon** sang **style Color** (priority #2, có đủ 4)

## Lưu ý về FE-v2

FE-v2 thực tế **mix style** (audit byte-size cho thấy headphones≈Plasticine, book≈Color, microphone≈Plasticine). Đây là **anti-pattern** — không follow theo. Doc FE-v2 nói đúng tiêu chí, code FE-v2 làm sai.

FE-v3 phải đồng bộ — chọn style nào thì cả nhóm theo style đó.

## URL pattern (free PNG)

```
https://img.icons8.com/{style-slug}/256/{icon-slug}.png
```

Style slugs:
- `3d-fluency` — priority #1
- `color` — priority #2 (đang dùng cho 4 kỹ năng)
- `bubbles` — priority #3

Test trước commit:
```powershell
curl.exe -s -o test.png "https://img.icons8.com/color/256/{slug}.png"
# Nếu response chứa '"success":false' → icon không có trong style đó
```

## Kích thước & format

| Dùng cho | Source size | Render size (Tailwind) |
|---|---|---|
| Inline text, badge | 256px | `h-4` (xs) |
| Card chip | 256px | `h-6` (sm) |
| Card hero | 256px | `h-10` (md) |
| Modal/dialog | 256px | `h-14` (lg) |
| Splash, achievement | 256px | `h-20` (xl) |

**Luôn tải 256px**. PNG raster scale xuống đẹp, scale lên xấu.

## Naming convention

```
public/icons/{slug}.png
```

- `slug` = tên tiếng Anh đơn giản, lowercase, dash-separated
- Filename = chức năng (vd: `book.png` cho Reading)
- URL slug có thể khác filename (vd: download `open-book` → save thành `book.png`)

## Component

```tsx
import { SkillIcon } from "#/components/SkillIcon"

<SkillIcon name="headphones" size="md" />
```

`SkillIcon` render `<img src="/icons/{name}.png">` — không qua bundler.

## 4 icon kỹ năng VSTEP (copy từ FE-v2)

| Skill | Filename | Source | Size |
|-------|----------|--------|------|
| Listening (Nghe) | `headphones.png` | FE-v2 `apps/frontend-v2/public/icons/headphones.png` | 17.4 KB |
| Reading (Đọc) | `book.png` | FE-v2 `apps/frontend-v2/public/icons/book.png` | 3.0 KB |
| Speaking (Nói) | `microphone.png` | FE-v2 `apps/frontend-v2/public/icons/microphone.png` | 6.6 KB |
| Writing (Viết) | `pencil.png` | FE-v2 `apps/frontend-v2/public/icons/pencil.png` | 4.3 KB |

**Note:** FE-v2 mix style cho 4 kỹ năng (headphones≈Plasticine, book≈Color, microphone≈Plasticine). FE-v3 copy y hệt (byte-by-byte match) để giữ visual consistency với FE-v2.

## 2 icon nền tảng (style: Color — FE-v2 không có PNG cho 2 mục này)

FE-v2 dùng Lucide `Languages` + `BookType` (SVG line icon). FE-v3 chọn PNG cùng họ với 4 skills:

| Mục | Filename | URL icons8 (slug) | Size |
|-----|----------|-------------------|------|
| Từ vựng | `dictionary.png` | https://img.icons8.com/color/256/dictionary.png | 4.2 KB |
| Ngữ pháp | `grammar.png` | https://img.icons8.com/color/256/grammar.png | 4.8 KB |

Map filename ↔ skill key trong `lib/skills.ts` qua field `pngIcon`.

## Quy trình thêm icon mới

```
1. Xác định icon cần (tên tiếng Anh)
2. Test trong style ƯU TIÊN của nhóm hiện có
   - Nếu nhóm đang dùng "color" → bắt buộc dùng "color"
   - Nếu là nhóm mới → bắt đầu từ 3D Fluency, fallback theo doc
3. Test URL bằng curl
4. Nếu OK → tải về public/icons/{slug}.png
5. Nếu nhóm hiện có không đủ trong style đó → CÂN NHẮC migrate cả nhóm sang style mới
6. Dùng: <SkillIcon name="{slug}" size="md" />
```

## Anti-patterns

- ❌ KHÔNG mix style trong cùng 1 nhóm icon
- ❌ KHÔNG dùng style ngoài priority list (Outlined, Glyph, iOS, Material, Doodle, Stickers, Plasticine, Cute Clipart, Fluency)
- ❌ KHÔNG dùng PNG < 256px
- ❌ KHÔNG dùng SVG cho skill icons (icons8 không free SVG)
- ❌ KHÔNG quên attribution trước production

## Khi nào dùng SkillIcon vs Icon vs StaticIcon?

| Component | Loại | Dùng cho | Source |
|-----------|------|---------|--------|
| `<Icon>` | SVG mono `currentColor` | Utility (arrow, X, check, search, more) | `src/assets/icons/*.svg?react` |
| `<StaticIcon>` | SVG multi-tone | Brand asset có sẵn (chest, streak, coin, trophy) | `src/assets/icons/*.svg` |
| `<SkillIcon>` | **PNG icons8 Color 256px** | **4 kỹ năng VSTEP + gamification mới** | `public/icons/*.png` |

## Reference Duolingo art style

Từ blog Duolingo:
- **Bold, bouncy, bright** — 3 từ khóa
- **Rounded shapes** — không sharp edges
- **Vibrant colors** — saturation cao
- **Minimal detail** — chỉ giữ chi tiết cần thiết

Style "Color" của icons8 match cả 4 tiêu chí (flat color tươi sáng, bo tròn, đơn giản).
