# RFC 0002 — Layout & Gamification Pattern Consistency

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |

## Summary

Chuẩn hóa layout (max-width, radius, heading, spacing) + sửa gamification patterns theo chuẩn Duolingo (RFC 0000).

## Layout rules

### Container max-width

| Page type | max-width |
|---|---|
| Hub / list pages | `max-w-5xl` |
| Split-panel (passage + questions) | `max-w-6xl` |
| Single-column sessions | `max-w-3xl` |

Violations: `luyen-tap.index` (6xl→5xl), `viet.$exerciseId` (5xl→3xl), `noi.ket-qua` (5xl→3xl)

### Border radius

| Element | Class |
|---|---|
| Large cards | `rounded-2xl` |
| Medium cards | `rounded-xl` |
| Pills, badges | `rounded-lg` or `rounded-full` |

Violations: ModeCard, SubModuleCard, NextActionCard (`rounded-3xl` → `rounded-2xl`)

### Heading hierarchy

| Page type | Style |
|---|---|
| Hub pages | `text-3xl font-bold tracking-tight md:text-4xl` |
| Sub-pages | `text-2xl font-bold` |

Violations: `thi-thu.index`, `ky-nang.index` (text-2xl → text-3xl)

### Spacing

Sections: `space-y-6`. Bottom padding (fixed footer): `pb-10`. Back link: `ArrowLeft` + `gap-1.5`.

## Gamification patterns (theo Duolingo — RFC 0000)

### `border-b-4` — chỉ cho buttons

```tsx
/* ✅ CTA button */
"rounded-2xl border-b-4 border-primary/80 bg-primary text-primary-foreground"

/* ✅ Secondary button */
"rounded-2xl border-2 border-b-4 border-border bg-card text-muted-foreground"
```

**Bỏ `border-b-4` khỏi**: KetQuaCard, ChiTietCard, PerformanceTable → dùng `border-2 border-border bg-card shadow-sm`

**Bỏ 3D badges**: AccuracyBadge, ScorePill → plain text + semantic color

### ExamCard — bỏ gradient pseudo-element shadow

Trước: `translate-x-[4px] translate-y-[4px] bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400`

Sau: `border-2 border-border bg-card shadow-sm hover:shadow-md` — flat card giống Duolingo lesson card.

### Progress bars — solid, không gradient

Trước: `bg-gradient-to-r from-emerald-400 to-emerald-500` / `from-amber-400 to-amber-500`

Sau: `bg-primary` (active) hoặc `bg-warning` (caution). Solid color.

### Correct/Wrong items — 1 hue per state

Trước (ChiTietCard): `border-emerald-100 bg-success/5` + `border-emerald-200 bg-success/10` badge + icon

Sau: `bg-success/5 text-success` + neutral `border-border`. Badge: plain `text-success font-bold`, no border.

## Checklist

- [ ] Fix max-width (3 files)
- [ ] Fix radius: rounded-3xl → rounded-2xl (3 files)
- [ ] Fix headings (2 files)
- [ ] Fix spacing + back link (3 files)
- [ ] Remove border-b-4 from cards/tables (KetQuaCard, ChiTietCard, PerformanceTable)
- [ ] Simplify AccuracyBadge, ScorePill to plain text
- [ ] ExamCard: remove gradient shadow, use flat card
- [ ] Progress bars: gradient → solid
- [ ] ChiTietCard items: simplify to 1 hue per state
