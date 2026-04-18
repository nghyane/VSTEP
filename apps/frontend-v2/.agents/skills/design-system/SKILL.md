---
name: design-system
description: "Design tokens, Tailwind classes, card patterns, spacing, colors, radius, typography, gamification patterns (Duolingo). Load when working on UI, components, styling."
---

# Design System — frontend-v2 (Duolingo Gamification v3)

## Source of truth

- **`docs/rfcs/0002-design-system.md`** — full spec. Đọc khi cần chi tiết.
- `src/routes/design-test.tsx` — preview trực quan tất cả pattern.
- `src/styles.css` — CSS variables (tokens).
- `docs/icon-criteria.md` — Icons8 selection criteria.

File này là quick reference. RFC 0002 v3 là nguồn chính.

## Philosophy — Duolingo gamification

6 nguyên tắc:
1. **Skill-coded colors** — 4 hue (listening/reading/writing/speaking)
2. **3D depth** — `border-2 border-b-4` với border-bottom tối hơn bg
3. **Flat cards** — không gradient offset shadow
4. **Virtual economy** — coin xu (amber exception)
5. **Solid progress 3D** — inset shadow + highlight
6. **No mascot in UI** — chỉ ở landing page

## Colors — dùng tokens

```
Neutral:  bg-background  bg-card  bg-muted  bg-muted/50  text-foreground  text-muted-foreground
Border:   border-border  border-input
Brand:    bg-primary (VSTEP blue Duolingo-bright)
Semantic: bg-success  bg-warning  bg-destructive (+ /10 opacity)
Skill:    bg-skill-listening  bg-skill-reading  bg-skill-writing  bg-skill-speaking
```

**Forbidden:** `slate-*`, `gray-*`, `zinc-*`, `neutral-*`, `stone-*`, `emerald-*`,
`red-*`, `rose-*`, `blue-*`, `green-*`, `yellow-*`, `orange-*`, `indigo-*`,
`violet-*`, `purple-*`, `fuchsia-*`, `pink-*`, `sky-*`, `teal-*`, `cyan-*`, hex codes,
`bg-white`.

**Exception:** `amber-*` cho coin system. Landing page own palette.

**Pattern:** `bg-X/10 text-X` cho light variant. Max 2 hue ngoài neutral.

## 3D Depth — signature pattern

Formula: `border-2 border-b-4` với viền trên nhạt, viền dưới đậm.

### Neutral (card mặc định)

```tsx
"border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card"
```

### Semantic (opacity pattern)

```tsx
// Light bg
"border-2 border-primary/15 border-b-4 border-b-primary/40 bg-primary/5"
"border-2 border-success/15 border-b-4 border-b-success/40 bg-success/10"
"border-2 border-destructive/15 border-b-4 border-b-destructive/40 bg-destructive/10"
"border-2 border-warning/15 border-b-4 border-b-warning/40 bg-warning/10"
```

### Filled button (bg solid — arbitrary oklch)

```tsx
// Primary: bg-primary (L=0.65)
"border-2 border-[oklch(0.48_0.2_258)] border-b-4 border-b-[oklch(0.35_0.2_258)] bg-primary"

// Success: bg-success (L=0.75)
"border-2 border-[oklch(0.58_0.2_150)] border-b-4 border-b-[oklch(0.45_0.2_150)] bg-success"

// Destructive: bg-destructive (L=0.65)
"border-2 border-[oklch(0.50_0.2_27)] border-b-4 border-b-[oklch(0.38_0.2_27)] bg-destructive"

// Coin (amber exception)
"border-2 border-amber-600 border-b-4 border-b-amber-800 bg-amber-500"
```

**Quy tắc:** viền trên luôn NHẠT hơn viền dưới. Không ngược.

## Radius

| Element | Class |
|---|---|
| Large card (hub, feature, dialog) | `rounded-2xl` |
| Medium card (exercise, stat, MCQ) | `rounded-xl` |
| Button, input | `rounded-lg` |
| Tag | `rounded-md` |
| Pill, badge, icon-only button | `rounded-full` |

**Forbidden:** `rounded-3xl`.

## Typography

Font: DIN Round.

| Role | Class |
|---|---|
| Display (hub H1) | `text-3xl font-bold tracking-tight md:text-4xl` |
| Title (sub-page H1) | `text-2xl font-bold` |
| Subtitle (card title) | `text-lg font-semibold` or `font-bold` |
| Body | `text-sm` |
| Caption | `text-xs text-muted-foreground` |
| Stat big | `text-3xl font-bold tabular-nums` |

**Forbidden:** `text-[Npx]` arbitrary, `font-light`, `font-thin`.

## Component patterns

### Button

```tsx
// Primary CTA
<button className={cn(
  "h-11 px-6 inline-flex items-center gap-2 rounded-lg font-bold text-sm transition-all",
  "border-2 border-[oklch(0.48_0.2_258)] border-b-4 border-b-[oklch(0.35_0.2_258)]",
  "bg-primary text-primary-foreground",
  "hover:brightness-105",
  "active:translate-y-[3px] active:border-b active:pb-[3px]",
  "disabled:pointer-events-none disabled:opacity-50",
)}>
  Bắt đầu
</button>
```

Variants: primary, secondary, success, destructive, coin, locked.

### Card — Interactive (clickable)

```tsx
<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
                bg-card p-6 cursor-pointer transition-all hover:shadow-md">
```

**Card `<div>` KHÔNG có `active:`** (không phải button). Chỉ `hover:shadow-md`.

### Card — Info (read-only)

```tsx
<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
                bg-muted/50 p-5">
```

### Card — Selected (skill-coded)

```tsx
<div className="rounded-xl border-2 border-skill-writing/20 border-b-4 border-b-skill-writing/50
                bg-skill-writing/10 p-4">
```

### Card — Semantic feedback

```tsx
// Correct (success)
"rounded-xl border-2 border-success/15 border-b-4 border-b-success/40 bg-success/10 p-4"

// Wrong (destructive)
"rounded-xl border-2 border-destructive/15 border-b-4 border-b-destructive/40 bg-destructive/10 p-4"
```

### MCQ option (button)

```tsx
<button className="block w-full rounded-xl
                   border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
                   bg-card p-3 text-left text-sm transition-all
                   hover:bg-muted/50
                   active:translate-y-[3px] active:border-b active:pb-[3px]">
```

### Input

```tsx
<input className="w-full rounded-lg
                  border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
                  bg-background px-3 py-2 text-sm
                  focus:border-primary focus:border-b-primary/50 focus:outline-none focus:ring-1 focus:ring-primary" />
```

### Progress bar (3D)

```tsx
// Track (lõm)
<div className="h-3 w-full overflow-hidden rounded-full bg-muted
                shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/30">
  {/* Fill (nổi 3D với highlight) */}
  <div className="h-full rounded-full bg-primary
                  shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]"
       style={{ width: `${percent}%` }} />
</div>
```

Variants fill: `bg-primary`, `bg-success`, `bg-warning`, `bg-skill-*`.

### Chip / Pill

#### Skill chip (trần — không bg, không border)

```tsx
"inline-flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold text-skill-{name}"
```

#### Status badge (có bg)

```tsx
"inline-flex items-center rounded-full bg-{X}/10 text-{X} px-2.5 py-0.5 text-xs font-semibold"
// X = muted, primary, success, warning, destructive
```

#### Tag hashtag

```tsx
"inline-flex items-center rounded-md bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium"
```

### Coin badge (amber exception)

```tsx
// With bg gradient
"inline-flex h-7 items-center gap-1.5 rounded-md
 bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm px-2.5"

// Text-only
<CoinIcon size={16} />
<span className="text-xs font-bold text-amber-600">50 xu</span>
```

### Dialog

```tsx
<div className="mx-auto max-w-md overflow-hidden rounded-2xl
                border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)]
                bg-card shadow-lg">
  <header className="border-b p-6">...</header>
  <main className="p-6">...</main>
  <footer className="border-t bg-muted/30 p-4">...</footer>
</div>
```

## Interaction — Hover vs Active

| Element | Hover | Active |
|---|---|---|
| Button `<button>` | `brightness-105` | `translate-y-[3px] border-b pb-[3px]` |
| Card `<div>` | `shadow-md` | **Không có active** |
| MCQ `<button>` | `bg-muted/50` | `translate-y-[3px] border-b pb-[3px]` |

**Nguyên tắc:** Height luôn cố định. Khi border giảm → bù padding-bottom.

## Rule 0.1 — Icon KHÔNG bọc bg có màu

```tsx
// ✅ Render trần
<GameIcon name="headphones" className="size-8" />

// ❌ Bọc bg
<div className="flex size-10 rounded-xl bg-primary/10">
  <GameIcon name="headphones" />
</div>
```

**Ngoại lệ:** Icon-only button (`bg-muted`), checkbox visual, count badge trong `bg-destructive` circle.

## Icon system — 3 layer

| Layer | Nguồn | Ví dụ |
|---|---|---|
| **Gamification** | Icons8 3D Fluency PNG | `<GameIcon name="fire" />` |
| **UI** | Lucide React | `<ArrowRight />`, `<Check />`, `<X />` |
| **Brand** | Custom PNG/GIF/Lottie | `<CoinIcon />`, streak GIF |

### GameIcon component

```tsx
function GameIcon({ name, className }: { name: string; className?: string }) {
  return (
    <img src={`/icons/${name}.png`} alt="" aria-hidden="true"
         className={cn("shrink-0 object-contain", className)} />
  )
}
```

### Library hiện tại — 24 icons

`book, calendar, check, chest, clock, coin, cross, crown, fire, gem, gift, graduation,
headphones, heart, lightning, lock, microphone, notification, pencil, rocket, star,
target, trophy, users`

Ở `public/icons/*.png`. Attribution: `<a href="https://icons8.com">Icons by Icons8</a>` ở footer.

## Container max-width

| Page | Class |
|---|---|
| Hub / list | `max-w-5xl` |
| Split passage | `max-w-6xl` |
| Single-column | `max-w-3xl` |
| Form, dialog | `max-w-lg` → `max-w-2xl` |

## Spacing

- Section: `space-y-6`
- Card content: `p-5` (md), `p-6` (lg)
- Stat card: `p-4`
- Page + fixed footer: `pb-24`

## Encouraging copy (Vietnamese, NO emoji)

| Score | Copy |
|---|---|
| 90-100% | "Xuất sắc! Tiếp tục phát huy nhé" |
| 70-89% | "Khá ổn rồi, luyện thêm một chút nữa." |
| 50-69% | "Cần cải thiện. Xem lại lỗi để học sâu hơn." |
| <50% | "Bài này khó, đừng nản. Hãy ôn lại kiến thức nền." |

**KHÔNG** dùng emoji Unicode (`🎉💪🔥🚀`) — render không nhất quán. Dùng Icons8 PNG.

## Class joining

```tsx
import { cn } from "#/lib/utils"

<div className={cn(
  "rounded-xl border p-4",
  isActive && "border-primary bg-primary/5",
)} />
```

**Forbidden:** `.join(" ")`, template literal.

## Anti-patterns — forbidden

```tsx
// ❌ Gradient offset shadow (neo-brutalism)
"translate-x-[4px] translate-y-[4px] bg-gradient-to-br from-amber-300"

// ❌ Icon bọc bg
<div className="rounded-xl bg-primary/10"><Icon /></div>

// ❌ Border depth ngược (trên đậm, dưới nhạt)
"border-primary/40 border-b-primary/15"

// ❌ Border cùng màu bg
"border-primary bg-primary"

// ❌ Multi-hue border
"border-success border-b-destructive"

// ❌ Hardcoded palette
"bg-slate-50 border-slate-200"

// ❌ Hex
"bg-[#1a6ef5]"

// ❌ rounded-3xl
"rounded-3xl"

// ❌ text-[Npx]
"text-[11px]"

// ❌ dark: variant (tokens handle dark)
"bg-slate-50 dark:bg-slate-900"

// ❌ Emoji Unicode
"Xuất sắc! 🎉"

// ❌ Hover translate gây layout shift (không bù padding)
"hover:translate-y-px hover:border-b-2"

// ❌ Active trên card <div>
<div className="... active:translate-y-[3px]">

// ❌ .join() className
className={["a", b].join(" ")}
```

## Checklist trước commit

- [ ] Không hardcoded color (grep check)
- [ ] Không `rounded-3xl`, `text-[Npx]`, `bg-white`
- [ ] `cn()` cho conditional class
- [ ] Light + dark mode render đúng
- [ ] Hover/active state — height cố định (không shift layout)
- [ ] Icon trần (không bọc bg màu)
- [ ] Không emoji Unicode trong UI
- [ ] Viền trên NHẠT hơn viền dưới (depth đúng hướng)
