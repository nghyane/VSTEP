# RFC 0002 — Design System

| Field | Value |
|---|---|
| Status | Accepted |
| Created | 2025-07-14 |
| Updated | 2026-04-18 |
| Absorbs | RFC 0001 (tokens), RFC 0002 (layout/gamification) |

## Summary

Design system cho app VSTEP theo chuẩn Duolingo gamification. Gồm: color tokens, layout rules, gamification patterns. Đây là source of truth duy nhất cho visual decisions.

## Color system

### Tokens — dùng tokens, không hardcode

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

### Mapping hardcoded → token (ex-RFC 0001)

| Hardcoded | → Token |
|---|---|
| `bg-white` | `bg-card` hoặc `bg-background` |
| `bg-slate-*`, `from-slate-*` | `bg-muted` / `bg-muted/50` |
| `border-slate-*`, `border-gray-*` | `border-border` |
| `text-slate-500` | `text-muted-foreground` |
| `text-emerald-*`, `bg-emerald-*` | `text-success` / `bg-success/10` |
| `border-emerald-*` | `border-success/20` |
| `from-red-*`, `border-rose-*` | `bg-destructive` / `border-destructive/20` |
| `text-amber-*` (warning context) | `text-warning` / `bg-warning/10` |
| `text-amber-*` (coin branding) | Keep as-is — coin exception |
| `dark:*-slate-*`, `dark:*-emerald-*` | Remove — tokens handle dark mode |

**Forbidden:** `slate-*`, `gray-*`, `emerald-*`, `red-*`, `blue-*`, hex codes. Exception: `amber-*` for coin branding, landing page own visual language.

**Rule:** Mỗi component max 2 hue ngoài neutral.

## Layout rules (ex-RFC 0002)

### Container max-width

| Page type | Class |
|---|---|
| Hub / list pages | `max-w-5xl` |
| Split-panel (passage + questions) | `max-w-6xl` |
| Single-column sessions | `max-w-3xl` |

### Border radius

| Element | Class |
|---|---|
| Large cards (mode cards, feature cards) | `rounded-2xl` |
| Medium cards (exercise, stat) | `rounded-xl` |
| Pills, badges | `rounded-full` |
| Buttons, inputs | `rounded-lg` |

**Forbidden:** `rounded-3xl` on cards.

### Heading hierarchy

| Page type | H1 style |
|---|---|
| Hub pages | `text-3xl font-bold tracking-tight md:text-4xl` |
| Sub-pages | `text-2xl font-bold` |

### Typography

| Role | Class |
|---|---|
| Display | `text-3xl font-bold tracking-tight md:text-4xl` |
| Title | `text-2xl font-bold` |
| Subtitle | `text-lg font-semibold` |
| Body | `text-sm` |
| Caption | `text-xs text-muted-foreground` |

**Forbidden:** `text-[10px]`, `text-[11px]` → dùng `text-xs`.

### Spacing

- Sections within page: `space-y-6`
- Pages with fixed footer: `pb-10`
- Back link: `ArrowLeft` icon + `gap-1.5` + `text-sm text-muted-foreground`

### Card patterns

| Type | Classes |
|---|---|
| Interactive (clickable) | `rounded-2xl border bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-md` |
| Info (read-only) | `rounded-2xl bg-muted/50 shadow-sm` (no border) |

## Gamification patterns (Duolingo)

### Correct/Wrong — 1 token + opacity

```
Đúng:    bg-success/10 text-success
Sai:     bg-destructive/10 text-destructive
Neutral: bg-muted/50 text-muted-foreground
```

**Forbidden:** multi-shade (`emerald-500/600/700`), gradient severity, multi-hue borders.

### `border-b-4` — CHỈ cho buttons

```tsx
// ✅ Primary CTA
"rounded-2xl border-b-4 border-primary/80 bg-primary text-primary-foreground"

// ✅ Secondary
"rounded-2xl border-2 border-b-4 border-border bg-card text-muted-foreground"
```

**Forbidden on:** cards, tables, badges, pills.

### Progress bars — solid, không gradient

```
✅ bg-primary     (active)
✅ bg-warning     (caution)
✅ bg-muted       (track)
❌ bg-gradient-to-r from-emerald-400 to-emerald-500
```

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

### ExamCard — flat, no gradient shadow

`border-2 border-border bg-card shadow-sm hover:shadow-md`

## Class joining

Always use `cn()` from `shared/lib/utils`. Never `.join(" ")` or template literals.

## Font sizes

Use Tailwind scale (`text-xs`, `text-sm`, `text-base`). Avoid arbitrary values.
