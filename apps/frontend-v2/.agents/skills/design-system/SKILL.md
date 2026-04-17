---
name: design-system
description: "Design tokens, Tailwind classes, card patterns, spacing, colors, radius, typography, gamification patterns (Duolingo). Load when working on UI, components, styling."
---

# Design System — frontend-v2

## Source of truth

- `src/styles.css` — CSS variables (tokens)
- `docs/rfcs/0000-design-direction.md` — aesthetic north star (Duolingo gamification)
- `docs/rfcs/0001-design-token-consistency.md` — token mapping rules
- `docs/rfcs/0002-layout-spacing-consistency.md` — layout rules

## Colors — use tokens, never hardcode

```
bg-background    bg-card          bg-muted         bg-muted/50
text-foreground  text-muted-foreground              text-primary
border-border    border-input
```

Semantic:
```
text-success / bg-success      — correct, positive
text-warning / bg-warning      — caution, approaching deadline
text-destructive / bg-destructive — error, danger
```

Skill:
```
text-skill-listening  text-skill-reading  text-skill-writing  text-skill-speaking
```

**Forbidden:** `slate-*`, `gray-*`, `emerald-*` (use `success`), `red-*` (use `destructive`), `blue-*`, hex codes `#xxx`, `bg-white` (use `bg-card`).

**Exception:** `amber-*` for coin branding only. Landing page has its own visual language.

## Radius

| Element | Class |
|---|---|
| Large cards (mode cards, feature cards) | `rounded-2xl` |
| Medium cards (exercise, stat) | `rounded-xl` |
| Pills, badges | `rounded-full` |
| Buttons, inputs | `rounded-lg` |

**Forbidden:** `rounded-3xl` on cards.

## Container max-width

| Page type | Class |
|---|---|
| Hub / list pages | `max-w-5xl` |
| Split-panel (passage + questions) | `max-w-6xl` |
| Single-column sessions | `max-w-3xl` |

## Heading hierarchy

| Page type | H1 style |
|---|---|
| Hub pages | `text-3xl font-bold tracking-tight md:text-4xl` |
| Sub-pages | `text-2xl font-bold` |

## Card patterns

| Type | Classes |
|---|---|
| Interactive (clickable) | `rounded-2xl border bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-md` |
| Info (read-only) | `rounded-2xl bg-muted/50 shadow-sm` (no border) |

## Spacing

- Sections within page: `space-y-6`
- Pages with fixed footer: `pb-10`
- Back link: `ArrowLeft` icon + `gap-1.5` + `text-sm text-muted-foreground`

## Class joining

Always use `cn()` from `lib/utils`. Never `.join(" ")` or template literals for conditional classes.

## Font sizes

Use Tailwind scale (`text-xs`, `text-sm`, `text-base`). Avoid arbitrary values like `text-[11px]`, `text-[10px]`.

## Gamification patterns (Duolingo)

App theo chuẩn Duolingo gamification. Mỗi component max 2 hue ngoài neutral.

### Correct/Wrong — 1 token + opacity

```
Đúng:    bg-success/10 text-success
Sai:     bg-destructive/10 text-destructive
Neutral: bg-muted/50 text-muted-foreground
```

**Forbidden:** multi-shade (`emerald-500/600/700`), gradient severity (`from-emerald-400 to-emerald-500`), multi-hue borders on single item.

### `border-b-4` — CHỈ cho buttons

```tsx
// ✅ Primary CTA
"rounded-2xl border-b-4 border-primary/80 bg-primary text-primary-foreground"

// ✅ Secondary
"rounded-2xl border-2 border-b-4 border-border bg-card text-muted-foreground"
```

**Forbidden on:** cards, tables, badges, pills. Cards dùng `border-2 border-border bg-card shadow-sm` flat.

### Lesson Complete — 3 stat cards pattern

```
"Hoàn thành!"
┌──────┐  ┌──────┐  ┌──────┐
│ Điểm │  │Thời  │  │Chính │
│ 8/10 │  │ 5:20 │  │ 80%  │
└──────┘  └──────┘  └──────┘
primary    muted     success

[Xem lại bài]    [Tiếp tục →]
```

Stat card: `border-2 border-{color}` header + `bg-card text-{color}` body.

### Progress bars — solid, không gradient

```
✅ bg-primary     (active)
✅ bg-warning     (caution)
✅ bg-muted       (track)
❌ bg-gradient-to-r from-emerald-400 to-emerald-500
```

### Safe failure

- Wrong answer: hiện đáp án đúng, không chỉ "Sai"
- Encouraging messages: "Xuất sắc!" / "Khá ổn, luyện thêm nhé." / "Cần ôn lại."

### Forbidden gamification patterns

- Gradient pseudo-element shadows (ExamCard style)
- 3D badges/pills với border-bottom semantic colors
- Multi-hue progress bars (6+ shade cho 1 ý nghĩa)
