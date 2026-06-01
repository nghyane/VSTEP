# RFC 0002 — Design System (Duolingo Gamification)

| Field | Value |
|---|---|
| Status | Accepted (v3) |
| Created | 2025-07-14 |
| Updated | 2026-04-18 |
| Latest rewrite | v3 — chốt từ `/design-test` thực tế, icon library Icons8, màu Duolingo-bright |
| Absorbs | v1 tokens, v2 component spec |

## Summary

VSTEP dùng phong cách **Duolingo gamification**: friendly, rounded, color-coded,
3D depth illusion. RFC này là source of truth duy nhất. Mọi quyết định visual đã
được verify trực quan tại `/design-test` page và chốt bởi product owner.

## Philosophy — 6 nguyên tắc Duolingo

| # | Nguyên tắc | VSTEP implementation |
|---|---|---|
| 1 | **Skill-coded colors** | 4 hue oklch: listening/reading/writing/speaking |
| 2 | **3D depth illusion** | `border-2 border-b-4` với border-bottom tối hơn 0.20 lightness |
| 3 | **Flat cards** | Không gradient shadow, không offset |
| 4 | **Virtual economy** | Coin xu (amber branded, exception) |
| 5 | **Streak + progress** | Solid progress bar với inner shadow 3D |
| 6 | **No mascot in UI** | Mascot chỉ ở landing page, không trong app |

## Color tokens

Source: `src/styles.css`. Đã tune theo Duolingo palette (sáng, tươi, lightness 0.65-0.83).

```css
/* Neutral */
--background: oklch(0.99 0.002 260)
--card: oklch(1 0 0)
--muted: oklch(0.965 0.003 260)
--border: oklch(0.925 0.006 260)

/* Brand — VSTEP blue (Duolingo-bright) */
--primary: oklch(0.65 0.2 258)

/* Semantic — Duolingo-bright */
--success: oklch(0.75 0.2 150)
--warning: oklch(0.83 0.16 85)
--destructive: oklch(0.65 0.24 25)

/* Skill — Duolingo-bright hues */
--skill-listening: oklch(0.72 0.14 230)  /* Duo blue */
--skill-reading:   oklch(0.75 0.2 150)   /* Duo green */
--skill-writing:   oklch(0.72 0.17 305)  /* Duo purple */
--skill-speaking:  oklch(0.75 0.16 65)   /* Duo orange */
```

### Forbidden colors

- **Raw Tailwind palette:** `slate-*`, `gray-*`, `zinc-*`, `neutral-*`, `stone-*`,
  `emerald-*`, `red-*`, `rose-*`, `blue-*`, `green-*`, `yellow-*`, `orange-*`,
  `indigo-*`, `violet-*`, `purple-*`, `fuchsia-*`, `pink-*`, `sky-*`, `teal-*`, `cyan-*`
- **Hex codes** trong className
- **`bg-white` / `text-white`** (trừ trên filled bg như `bg-primary`)

### Exceptions

| Exception | Nơi | Lý do |
|---|---|---|
| `amber-*` | Coin system, level badge | Coin branding (gold universal) |
| Landing page own palette | `routes/-components/landing/**` | Marketing visual khác app |
| `oklch(...)` arbitrary | Border depth color (nội bộ variant) | Phải tối hơn bg để tạo depth |

### Opacity pattern

1 color token + opacity để tạo variant:

```tsx
"bg-success/10 text-success"           // Light background + solid text
"border-success/15 border-b-success/40" // Depth border (top nhạt, bottom đậm)
```

**Max 2 hue ngoài neutral per component.** Không multi-hue borders.

## Radius

| Element | Class |
|---|---|
| Large card (hub, feature, dialog) | `rounded-2xl` |
| Medium card (exercise, stat, MCQ) | `rounded-xl` |
| Button, input, package item | `rounded-lg` |
| Tag hashtag | `rounded-md` |
| Pill, badge, icon-only button | `rounded-full` |

**Forbidden:** `rounded-3xl` trên mọi element.

## Typography

Font: **DIN Round** (Duolingo-esque friendly rounded sans-serif).

| Role | Class |
|---|---|
| Display (hub H1) | `text-3xl font-bold tracking-tight md:text-4xl` |
| Title (sub-page H1) | `text-2xl font-bold` |
| Subtitle (card title) | `text-lg font-semibold` hoặc `text-lg font-bold` |
| Body | `text-sm` |
| Caption | `text-xs text-muted-foreground` |
| Stat big | `text-3xl font-bold tabular-nums` |

**Forbidden:** `text-[Npx]` arbitrary → dùng `text-xs`. `font-thin`, `font-light`.

## Spacing

- Section trong page: `space-y-6`
- Card content: `p-5` (medium), `p-6` (large)
- Stat card: `p-4`
- Gap stat cards: `gap-3` hoặc `gap-4`
- Gap hub cards: `gap-4` hoặc `gap-6`
- Page với fixed footer: `pb-24`

## Container max-width

| Page | Class |
|---|---|
| Hub / list | `max-w-5xl` |
| Split passage + questions | `max-w-6xl` |
| Single-column session | `max-w-3xl` |
| Form, dialog, onboarding | `max-w-lg` → `max-w-2xl` |

## 3D Depth — signature pattern

Mọi element tương tác hoặc cần nhấn mạnh đều có **depth border**. Đây là signature
Duolingo.

### Formula

```
border-2 (viền trên/trái/phải) + border-b-4 (viền dưới dày hơn)
Viền trên nhạt hơn bg ~0.12 lightness
Viền dưới đậm hơn bg ~0.20 lightness
```

### Neutral depth (card mặc định)

```tsx
"border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card"
```

### Semantic depth

| Token | Viền trên | Viền dưới |
|---|---|---|
| primary | `border-primary/15` | `border-b-primary/40` |
| success | `border-success/15` | `border-b-success/40` |
| warning | `border-warning/15` | `border-b-warning/40` |
| destructive | `border-destructive/15` | `border-b-destructive/40` |
| skill-* | `border-skill-*/20` | `border-b-skill-*/50` |

### Filled button depth (bg solid)

Vì `border-X/15` sẽ tàng hình trên `bg-X`, dùng arbitrary oklch:

| Variant | bg | Border top | Border bottom |
|---|---|---|---|
| primary | `bg-primary` (L=0.65) | `border-[oklch(0.48_0.2_258)]` | `border-b-[oklch(0.35_0.2_258)]` |
| success | `bg-success` (L=0.75) | `border-[oklch(0.58_0.2_150)]` | `border-b-[oklch(0.45_0.2_150)]` |
| destructive | `bg-destructive` (L=0.65) | `border-[oklch(0.50_0.2_27)]` | `border-b-[oklch(0.38_0.2_27)]` |
| coin (amber) | `bg-amber-500` | `border-amber-600` | `border-b-amber-800` |

## Component library (chốt từ `/design-test`)

### 1. Button — Primary CTA

```tsx
// Primary
"border-2 border-[oklch(0.48_0.2_258)] border-b-4 border-b-[oklch(0.35_0.2_258)]
 bg-primary text-primary-foreground
 rounded-lg font-bold transition-all
 hover:brightness-105
 active:translate-y-[3px] active:border-b active:pb-[3px]
 disabled:pointer-events-none disabled:opacity-50"
```

#### Sizing

| Size | Class |
|---|---|
| sm | `h-9 px-4 text-xs` |
| md (default) | `h-11 px-6 text-sm` |
| lg | `h-14 px-8 text-base` |

#### Variants

- **primary** — CTA chính (Bắt đầu, Làm bài)
- **secondary** — Action phụ (`border-b-border`, `bg-card`)
- **success** — Xác nhận, hoàn thành
- **destructive** — Xóa, hủy
- **coin** — Nạp xu, amber exception
- **locked** — Chưa mở khóa

### 2. Card — Interactive (clickable)

```tsx
"rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
 bg-card p-6 cursor-pointer transition-all
 hover:shadow-md"
```

**Không đổi viền khi hover** (card không phải button). Chỉ add `shadow-md`.

### 3. Card — Info (read-only)

```tsx
"rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
 bg-muted/50 p-5"
```

### 4. Card — Selected (skill-coded)

```tsx
"rounded-xl border-2 border-skill-writing/20 border-b-4 border-b-skill-writing/50
 bg-skill-writing/10 p-4"
```

### 5. Card — Semantic (stat, feedback)

```tsx
// Primary stat
"rounded-xl border-2 border-primary/15 border-b-4 border-b-primary/40 bg-primary/5 p-4"

// Success feedback
"rounded-xl border-2 border-success/15 border-b-4 border-b-success/40 bg-success/10 p-4"

// Destructive feedback
"rounded-xl border-2 border-destructive/15 border-b-4 border-b-destructive/40 bg-destructive/10 p-4"
```

### 6. MCQ option

```tsx
"block w-full rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
 bg-card p-3 text-left text-sm transition-all
 hover:bg-muted/50
 active:translate-y-[3px] active:border-b active:pb-[3px]"
```

### 7. Input

```tsx
"w-full rounded-lg border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
 bg-background px-3 py-2 text-sm
 focus:border-primary focus:border-b-primary/50 focus:outline-none focus:ring-1 focus:ring-primary"
```

### 8. Progress bar (3D)

```tsx
// Track (lõm)
"h-3 w-full overflow-hidden rounded-full bg-muted
 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/30"

// Fill (nổi 3D với highlight)
"h-full rounded-full bg-primary
 shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]"
```

Variants: `bg-primary` (active), `bg-success` (done), `bg-warning` (caution),
`bg-skill-*` (skill-specific).

### 9. Chip / Pill — 3 loại

#### Skill chip (trần, chỉ text + icon, không bg/border)

```tsx
"inline-flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold text-skill-{name}"
```

Icon multi-color tự có màu (từ Icons8).

#### Status badge (có bg)

```tsx
// Variants: muted, primary, success, warning, destructive
"inline-flex items-center rounded-full bg-X/10 text-X px-2.5 py-0.5 text-xs font-semibold"
```

#### Tag hashtag

```tsx
"inline-flex items-center rounded-md bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium"
```

### 10. Coin badge

Amber gradient exception:

```tsx
"inline-flex h-7 items-center gap-1.5 rounded-md
 bg-gradient-to-r from-amber-400 to-amber-500
 text-white shadow-sm px-2.5"
```

Hoặc không có bg (text-only, dùng ở ExamCard footer):

```tsx
"inline-flex h-7 items-center gap-1.5 px-1 text-sm"
<CoinIcon size={16} />
<span className="text-xs font-bold text-amber-600">50 xu</span>
```

### 11. Dialog

```tsx
// Outer
"mx-auto max-w-md overflow-hidden rounded-2xl
 border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
 bg-card shadow-lg"

// Header: border-b p-6
// Body: p-6
// Footer: border-t bg-muted/30 p-4
```

## Interaction patterns

### Hover vs Active

| Element | Hover | Active |
|---|---|---|
| Button | `brightness-105` | `translate-y-[3px] border-b pb-[3px]` |
| Card (div) | `shadow-md` | **Không có active** |
| MCQ option (button) | `bg-muted/50` | `translate-y-[3px] border-b pb-[3px]` |
| Dialog package (button) | (none) | `translate-y-px shadow-sm` |

**Nguyên tắc:**
- **Card `<div>`** không có `active:` (không phải button)
- **Button/MCQ `<button>`** có `active:translate-y-[3px]` + `border-b` + `pb-[3px]` (bù height)
- Height **luôn cố định** bằng padding-bottom bù khi border giảm

### Correct / Wrong feedback

Safe failure: sai → hiện đáp án đúng + encouraging copy.

```tsx
Đúng: border-success/15 border-b-success/40 bg-success/10
Sai:  border-destructive/15 border-b-destructive/40 bg-destructive/10
```

Dùng `GameIcon name="check"` và `GameIcon name="cross"` (không wrap trong bg circle).

### Encouraging copy (không emoji Unicode)

| Score | Copy |
|---|---|
| 90-100% | "Xuất sắc! Tiếp tục phát huy nhé" |
| 70-89% | "Khá ổn rồi, luyện thêm một chút nữa." |
| 50-69% | "Cần cải thiện. Xem lại lỗi để học sâu hơn." |
| <50% | "Bài này khó, đừng nản. Hãy ôn lại kiến thức nền." |

**Không** dùng emoji Unicode (`🎉💪🔥🚀`) — render không nhất quán trên Windows/Linux.
Dùng Icons8 PNG thay thế nếu cần (`trophy.png`, `fire.png`).

## Icon system

### 3 layer

| Layer | Nguồn | Dùng cho |
|---|---|---|
| **Gamification** | Icons8 3D Fluency PNG 96-256px | fire, heart, star, trophy, headphones, book, pencil, mic... |
| **UI** | Lucide React | ArrowRight, ChevronRight, Check, Plus, X |
| **Brand** | Custom (PNG/GIF/Lottie) | CoinIcon, AnimatedCoinIcon, streak-fire GIF, notification GIF |

### GameIcon component

```tsx
function GameIcon({ name, className }: { name: string; className?: string }) {
  return (
    <img
      src={`/icons/${name}.png`}
      alt=""
      aria-hidden="true"
      className={cn("shrink-0 object-contain", className)}
    />
  )
}
```

### Rule 0.1 — Icon KHÔNG bọc background có màu

```tsx
// ✅ Đúng — render trần
<GameIcon name="headphones" className="size-8" />

// ❌ Sai — bọc bg
<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
  <GameIcon name="headphones" className="size-6" />
</div>
```

**Ngoại lệ:** Icon-only button (`bg-muted`), checkbox visual, count badge (số trong `bg-destructive` circle).

### Icons8 selection criteria

Xem `docs/icon-criteria.md`. Key:
- Style ưu tiên: "3D Fluency" → "Fluency" → "Color"
- Size: 96-256px PNG
- URL pattern: `https://img.icons8.com/?size=256&id={ID}&format=png`
- Attribution: `<a href="https://icons8.com">Icons by Icons8</a>` ở footer

### Icon library hiện tại

24 icons ở `public/icons/*.png`:

```
book, calendar, check, chest, clock, coin, cross, crown, fire,
gem, gift, graduation, headphones, heart, lightning, lock,
microphone, notification, pencil, rocket, star, target, trophy, users
```

## Anti-patterns — forbidden

```tsx
// ❌ Gradient offset shadow (neo-brutalism)
"absolute inset-0 translate-x-[4px] translate-y-[4px]
 bg-gradient-to-br from-amber-300 to-orange-400"

// ❌ Icon bọc bg
<div className="flex size-12 rounded-xl bg-primary/10">
  <Icon />
</div>

// ❌ Border depth ngược (trên đậm, dưới nhạt)
"border-primary/40 border-b-primary/15"

// ❌ Viền cùng màu bg (không thấy depth)
"border-primary bg-primary"  // cần oklch arbitrary

// ❌ Multi-hue border
"border-success border-b-destructive"

// ❌ Hardcoded palette
"bg-slate-50 border-slate-200"

// ❌ Hex codes
"bg-[#1a6ef5]"

// ❌ rounded-3xl
"rounded-3xl"

// ❌ text-[Npx]
"text-[11px]"

// ❌ dark: variant (tokens handle dark)
"bg-slate-50 dark:bg-slate-900"

// ❌ Emoji Unicode
"Xuất sắc! 🎉"

// ❌ Hover dịch chuyển gây layout shift
"hover:translate-y-px hover:border-b-2"  // shift height
```

## Class joining

Always use `cn()` from `#/lib/utils`:

```tsx
import { cn } from "#/lib/utils"

<div className={cn(
  "rounded-xl border p-4",
  isActive && "border-primary bg-primary/5",
)} />
```

**Forbidden:** `.join(" ")`, template literal `` `${a} ${b}` ``.

## Current state audit — per-feature redesign needed

File đã drift khỏi spec, cần refactor theo RFC 0001:

### Scope A — Thi-thu (P0)

| File | Vi phạm | Action |
|---|---|---|
| `ExamCard.tsx` | Neo-brutalism gradient shadow | Redesign → flat card + depth border |
| `ExamSidebarFilters.tsx` | `border-slate-200`, `bg-white` | Token swap |
| `BottomActionBar.tsx` | `rose-*` error state | Token swap → destructive |
| `ExamDetailHeader.tsx` | `text-[11px]` | → `text-xs` |

### Scope B — Khóa học (P0)

6 files: hex codes, emerald hardcoded, cần redesign toàn bộ.

### Scope C — Overview (P1)

8 files: hardcoded colors, gradient emerald, `rounded-3xl`, dialog style cũ.

### Scope D — Phong thi (P1)

11 files: `border-b-4` trên card (sai — chỉ button), hardcoded emerald/rose.

### Scope E — Onboarding (P2)

4 files: hardcoded colors, gradient.

### Scope F — Common + Luyện tập (P2)

10 files: minor token swap.

## Migration plan (per RFC 0001)

Áp dụng Scout rule — không big-bang:

1. Khi touch feature X vì lý do khác → kết hợp move sang `features/X/` + apply depth
2. Component mới code → thẳng theo RFC 0002 v3 spec
3. CI guard (Phase D) — grep violations, fail build nếu còn

## Guard script (Phase D)

`scripts/check-design-tokens.sh`:

```bash
#!/usr/bin/env bash
set -e

# Check hardcoded colors
VIOLATIONS=$(rg "(bg|text|border|from|to|via|ring)-(slate|gray|zinc|emerald|red|rose|blue|green|orange|yellow|indigo|violet|purple|pink|sky|teal|cyan)-[0-9]" \
  --type-add "comp:*.{ts,tsx}" -t comp src/ \
  --glob '!src/components/ui/**' \
  --glob '!src/routes/-components/landing/**' \
  --glob '!src/routes/design-test.tsx' \
  || true)

# Check bg-white, rounded-3xl, text-[Npx]
VIOLATIONS+=$(rg "bg-white|rounded-3xl|text-\[\d+px\]" \
  --type-add "comp:*.{ts,tsx}" -t comp src/ \
  --glob '!src/components/ui/**' \
  --glob '!src/routes/-components/landing/**' \
  --glob '!src/routes/design-test.tsx' \
  || true)

if [ -n "$VIOLATIONS" ]; then
  echo "Design token violations:"
  echo "$VIOLATIONS"
  exit 1
fi
```

Wire vào CI: `bun run check:tokens`.

## Implementation status

- [x] Phase A — User design approval (via `/design-test`)
- [x] Color tokens updated (Duolingo-bright palette in `src/styles.css`)
- [x] Icon library chuẩn hóa (Icons8 + Lucide + Custom)
- [x] Depth formula chốt (border-2 border-b-4 với opacity asymmetric)
- [x] Component spec chốt (button, card, chip, progress, dialog, feedback)
- [x] Design test page verified (`/design-test`)
- [ ] Phase B — Apply spec per-feature (Scout rule)
- [ ] Phase D — CI guard script

## Non-goals

- Không mascot trong UI (chỉ landing)
- Không emoji Unicode
- Không neo-brutalism
- Không ship gradient shadow
- Không đổi structure `src/` (thuộc RFC 0001)

## Test page

`src/routes/design-test.tsx` — preview tất cả spec. **Sẽ xóa sau khi refactor xong**.

## References

- Duolingo blog — art style philosophy
- Icons8 — 3D Fluency icon library
- oklch — perceptually uniform color space
- shadcn/ui — token naming convention
- Bulletproof React — package-by-feature structure
