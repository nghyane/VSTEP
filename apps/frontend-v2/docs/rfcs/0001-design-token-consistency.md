# RFC 0001 — Design Token Consistency

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |

## Summary

Thay toàn bộ hardcoded Tailwind colors bằng design tokens. Theo RFC 0000: correct/wrong chỉ dùng 1 token + opacity, không 6 shade.

## Mapping rules

### Surfaces

| Hardcoded | → Token |
|---|---|
| `bg-white` | `bg-card` hoặc `bg-background` |
| `bg-slate-50`, `from-slate-50` | `bg-muted/50` |
| `bg-slate-100`, `to-slate-100` | `bg-muted` |
| `bg-slate-200/*` | `bg-muted` |
| `border-slate-*`, `border-gray-*` | `border-border` |
| `text-slate-500` | `text-muted-foreground` |

### Semantic: emerald → `success`

| Hardcoded | → Token |
|---|---|
| `text-emerald-*` | `text-success` |
| `bg-emerald-500` | `bg-success` |
| `bg-emerald-50`, `bg-emerald-100` | `bg-success/10` |
| `border-emerald-*` | `border-success/20` |

### Semantic: red → `destructive`

| Hardcoded | → Token |
|---|---|
| `from-red-400 to-red-500` | `bg-destructive` |
| `border-rose-*` | `border-destructive/20` |
| `bg-rose-*` | `bg-destructive/10` |

### Amber — split by intent

**Warning context** → `warning` token:
`text-amber-600` (warning), `bg-amber-50/100`, `border-amber-200/300` → `text-warning`, `bg-warning/10`, `border-warning/30`

**Coin branding** → keep as-is:
`from-amber-400 to-amber-500` (coin badge), `text-amber-600` (CoinButton), `text-amber-400` (stars)

### One-offs

| Hardcoded | → Fix |
|---|---|
| `text-blue-200` (ProfileBanner) | `text-primary-foreground/70` |
| `from-[#FBBF24] to-[#F59E0B]` | `bg-warning` |
| `from-slate-300 to-slate-400` | `bg-muted-foreground/40` |
| Landing page hex codes | Keep — separate visual language |

### Dark mode overrides — remove

Khi dùng token, xóa tất cả `dark:border-slate-*`, `dark:bg-slate-*`, `dark:bg-emerald-*`, `dark:text-emerald-*`, etc.

### Native form elements → shadcn/ui

`ExamSidebarFilters.tsx`: `<input>` → `<Input />`, `<input type="checkbox">` → `<Checkbox />`

## Files (21 files, 4 priorities)

**P1 — slate/gray** (dark mode broken): ExamCountdown, ExamSidebarFilters, ExamDetailHeader, StreakDialog, OnboardingStep.Confirmation

**P2 — emerald → success**: DeviceCheckScreen, StreakDialog, WritingExamPanel, SpeakingExamPanel, ChiTietCard, PerformanceTable, KetQuaCard, OnboardingStep.Level

**P3 — amber warning**: StreakDialog, OnboardingBanner, OnboardingStep.Level/GoalBand, PerformanceTable, phong-thi index, DeviceCheckScreen

**P4 — one-offs**: ProfileBanner

## Checklist

- [ ] P1: slate/gray (5 files)
- [ ] P2: emerald → success (8 files)
- [ ] P3: amber warning (7 files)
- [ ] P4: one-offs (1 file)
- [ ] P5: native inputs → shadcn/ui (1 file)
