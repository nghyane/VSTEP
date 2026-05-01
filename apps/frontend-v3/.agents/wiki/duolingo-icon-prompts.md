# Duolingo-style Icon Prompts — VSTEP

Bộ prompt tạo icon theo phong cách Duolingo cho các phần của VSTEP. Paste 1 prompt → model image-gen (Midjourney / DALL·E / Nano Banana / Flux) → nhận PNG transparent độ phân giải cao.

## Bảng màu mapping

Theo `src/styles.css`:

| Phần | Subject | Hex base | Hex shadow | Hex highlight |
|---|---|---|---|---|
| Nghe (Listening) | Headphones | `#1CB0F6` | `#1899D6` | `#84D8FF` |
| Nói (Speaking) | Microphone | `#FFC800` | `#E5A700` | `#FFDE5A` |
| Đọc (Reading) | Open book | `#7850C8` | `#5C3CA0` | `#A586E0` |
| Viết (Writing) | Pencil | `#58CC02` | `#58A700` | `#89E219` |
| Từ vựng (Vocabulary) | Flashcards | `#FF4B4B` | `#EA2B2B` | `#FF9090` |
| Ngữ pháp (Grammar) | Clipboard | `#FF9600` | `#CE7B00` | `#FFC800` |
| Thi thử (Mock Exam) | Exam paper + star | `#1899D6` | `#0D6FA8` | `#5BC4F8` |
| Khóa học (Course) | Stack of books | multi-color | — | — |

## Quy ước chung (đã nhúng trong mỗi prompt)

- Output: PNG transparent, 1024×1024 hoặc cao hơn, sharp / crisp edges.
- Không text, không chữ cái, không số, không watermark.
- Style: 3 primitive (rounded rect, half circle, rounded triangle), bo tròn mọi góc, flat color, 2-tone shadow shape (không filter).
- Background: trong suốt — model phải tự tách nền sau khi render.

---

## 1. Nghe (Listening) — BLUE

```
A single flat vector icon of a chunky pair of over-ear headphones, thick rounded headband arch with two large rounded rectangle ear cups, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #1CB0F6
- Shadow: #1899D6
- Highlight: #84D8FF

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## 2. Nói (Speaking) — YELLOW

```
A single flat vector icon of a fat cartoon stage microphone, large pill-shaped mic head on a short stem with a wide base, two horizontal grille lines on the head, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #FFC800
- Shadow: #E5A700
- Highlight: #FFDE5A

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## 3. Đọc (Reading) — PURPLE

```
A single flat vector icon of a thick open book viewed from the front, two rounded rectangle pages angled in a V-shape from a center spine, a few horizontal text lines on each page, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #7850C8
- Shadow: #5C3CA0
- Highlight: #A586E0

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## 4. Viết (Writing) — GREEN

```
A single flat vector icon of a short stubby pencil tilted 45 degrees with the tip pointing bottom-left, rounded triangle wood tip, dark graphite point, fat barrel, small pink eraser at the top, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #58CC02
- Shadow: #58A700
- Highlight: #89E219
(Accent colors allowed only on small details: dark graphite tip #4B4B4B, pink eraser #FF86D0)

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## 5. Từ vựng (Vocabulary) — RED

```
A single flat vector icon of a stack of two chunky flashcards slightly fanned, the back card rotated -8 degrees peeking behind, the front card straight on top with a few short horizontal lines, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #FF4B4B
- Shadow: #EA2B2B
- Highlight: #FF9090

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## 6. Ngữ pháp (Grammar) — ORANGE

```
A single flat vector icon of a wide squat clipboard with a small clip tab at the top center, three horizontal rule lines inside the board, one small checkmark in front of the first line, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #FF9600
- Shadow: #CE7B00
- Highlight: #FFC800
(Accent allowed only on the small checkmark detail: #58CC02 green)

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## 7. Thi thử (Mock Exam) — DARK BLUE

```
A single flat vector icon of a chunky exam paper sheet with rounded corners, a small folded corner at the top-right, three horizontal text lines inside, and a small star badge in the bottom-right corner of the sheet, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette (use exactly these 3 tones, nothing else):
- Base: #1899D6
- Shadow: #0D6FA8
- Highlight: #5BC4F8
(Accent allowed only on the small star badge: #FFC800 yellow with #E5A700 shadow)

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

**Subject thay thế (chọn 1 nếu không thích "exam paper"):**
- `a chunky stopwatch with a thick rim, a round face, two small buttons on top, and the hands pointing to roughly 10 and 2`
- `a chunky trophy cup with two side handles, sitting on a wide stepped pedestal base`
- `a chunky graduation cap (mortarboard) with a flat square top, a tassel hanging on the right side, and a rounded cap underneath`

---

## 8. Khóa học (Course) — MULTI-COLOR STACK

```
A single flat vector icon of a chunky stack of three thick books stacked horizontally on top of each other, slightly offset so each book is visible, with a small bookmark ribbon hanging from the middle book, in official Duolingo illustration style.

ONLY the icon. No text, no letters, no numbers, no labels, no captions, no watermark, no logo, no UI frame, no background pattern. One subject, nothing else.

Background: fully transparent (alpha channel, PNG with no background fill, no checkerboard, no white box, no color behind the subject). The subject must be cleanly cut out — every pixel that is not part of the icon is fully transparent.

Style:
- Built from only 3 primitive shapes: rounded rectangles, half circles, rounded triangles
- ALL corners heavily rounded — zero sharp or pointy edges
- Chunky, thick, toy-like proportions (Fisher-Price block aesthetic)
- Minimalist — as few shapes as possible, clear silhouette
- Flat fill colors only, NO gradients, NO blur, NO photorealism, NO 3D rendering, NO drop-shadow filter
- Two-tone depth: a darker shadow shape sits behind/below the base shape, offset 3-4px down — drawn as a separate solid shape, not a CSS shadow
- One small lighter highlight detail (shine, inner line, accent)
- Vibrant high-saturation colors only
- High-resolution, crisp edges, no anti-aliasing halo, no jpeg artifacts, no noise, no blur — vector-clean output

Color palette — each of the 3 books uses one hue with its own shadow tone underneath:
- Top book:    base #1CB0F6  shadow #1899D6   (blue)
- Middle book: base #58CC02  shadow #58A700   (green)
- Bottom book: base #FF9600  shadow #CE7B00   (orange)
Bookmark ribbon: base #FF4B4B  shadow #EA2B2B (red).
No other colors allowed.

Composition:
- Square 1:1 frame, 1024x1024 minimum
- Subject fills ~70% of frame, centered, with even transparent padding around it
- Subject viewed straight-on, slight bottom-heavy weight (Duolingo "raised button" feel)

Forbidden:
- Any text, letters, words, numbers, symbols-as-letters, fake glyphs
- Outline-only / line-art / Lucide / Heroicons style
- Realistic textures, photographic shading, gradients, glow, sparkles
- Multiple icons, scenes, characters, mascots, owls
- Background colors, patterns, frames, borders, drop shadows on the canvas
- White background, off-white background, or any opaque fill behind the subject
- Compression artifacts, blur, noise, low resolution

Output: one clean centered icon, transparent background, sharp high-resolution edges. Bold, bouncy, bright.
```

---

## Negative prompt chung (Stable Diffusion / Flux)

```
text, letters, words, numbers, typography, captions, labels, watermark, logo, signature,
owl, mascot, character, face, multiple objects, scene,
background, white background, off-white background, gray background, checkerboard, gradient background, frame, border,
gradient, blur, glow, drop shadow, soft shadow, photographic, realistic, 3d render, raytracing,
outline only, line art, thin strokes, sharp corners, pointy edges,
dark colors, muted colors, pastel, low saturation,
jpeg artifacts, noise, grain, low resolution, pixelated, aliasing
```

## Hậu xử lý nếu nền vẫn không trong suốt

Nếu model trả PNG có nền trắng:

```bash
# remove.bg CLI (chính xác nhất cho icon đồ họa)
npx @remove-background-ai/cli icon.png -o icon-clean.png

# hoặc imagemagick (nhanh, free, đủ tốt cho nền trắng phẳng)
magick icon.png -fuzz 5% -transparent white icon-clean.png
```

## File naming

```
public/icons/{slug}.png       (256-512px, dùng cho UI thật)
src/assets/raw/{slug}-1024.png (bản gốc 1024px+, lưu để re-export)
```

Slug:
- `headphones`, `microphone`, `book`, `pencil`, `dictionary`, `grammar` (đã có trong `lib/skills.ts`)
- `mock-exam`, `course` (mới — cần thêm vào `SkillIcon` map nếu dùng)
