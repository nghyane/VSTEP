# RFC 0001 — Design Token Consistency

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |
| Superseded by | — |

## Summary

Codebase hiện dùng lẫn lộn hardcoded Tailwind colors (`slate-*`, `gray-*`, `emerald-*`, `amber-*`, `red-*`, `blue-*`, hex codes) cùng với design tokens đã định nghĩa trong `styles.css`. RFC này chốt quy tắc mapping và liệt kê toàn bộ violations cần sửa.

## Motivation

- **Dark mode vỡ**: `bg-white`, `border-slate-200`, `bg-slate-50` không tự chuyển đổi khi bật dark mode.
- **Không grep được**: Muốn đổi "màu success" phải tìm cả `emerald-*` lẫn `success`, không biết chỗ nào dùng gì.
- **Inconsistent visual**: Cùng ý nghĩa "thành công" nhưng có chỗ dùng `text-success`, có chỗ dùng `text-emerald-600`, `text-emerald-700`, `text-emerald-500` — 3 shade khác nhau.

## Token inventory (hiện có trong `styles.css`)

### Base surfaces
| Token | Light | Dùng cho |
|---|---|---|
| `background` | near-white | Page background |
| `foreground` | near-black | Default text |
| `card` / `card-foreground` | white | Card surfaces |
| `muted` / `muted-foreground` | light gray | Subtle backgrounds, secondary text |
| `accent` / `accent-foreground` | light gray | Hover states |
| `border` | light gray | All borders |
| `input` | light gray | Form input borders |

### Semantic
| Token | Dùng cho |
|---|---|
| `primary` / `primary-foreground` | CTA, links, active states |
| `secondary` / `secondary-foreground` | Secondary buttons |
| `destructive` / `destructive-foreground` | Errors, danger |
| `success` / `success-foreground` | Positive states, correct answers |
| `warning` / `warning-foreground` | Caution, approaching deadline |

### Domain-specific
| Token | Dùng cho |
|---|---|
| `skill-listening` | Listening skill accent |
| `skill-reading` | Reading skill accent |
| `skill-writing` | Writing skill accent |
| `skill-speaking` | Speaking skill accent |

## Mapping rules

### Rule 1: Surface colors → tokens

| Hardcoded | Replace with |
|---|---|
| `bg-white` | `bg-card` hoặc `bg-background` |
| `bg-slate-50`, `from-slate-50` | `bg-muted/50` |
| `bg-slate-100`, `to-slate-100` | `bg-muted` |
| `bg-slate-200/60`, `bg-slate-200/70` | `bg-muted` |
| `border-slate-200`, `border-slate-300` | `border-border` |
| `border-gray-300` | `border-border` |
| `text-slate-500` | `text-muted-foreground` |

### Rule 2: Semantic emerald → `success` token

| Hardcoded | Replace with |
|---|---|
| `text-emerald-600`, `text-emerald-700` | `text-success` |
| `text-emerald-500` | `text-success` |
| `bg-emerald-500` | `bg-success` |
| `bg-emerald-50`, `bg-emerald-100` | `bg-success/10` |
| `border-emerald-200`, `border-emerald-300` | `border-success/30` |
| `border-emerald-100` | `border-success/20` |

### Rule 3: Semantic red → `destructive` token

| Hardcoded | Replace with |
|---|---|
| `from-red-400 to-red-500` | `bg-destructive` |

### Rule 4: Amber — split by intent

Amber is used for 2 distinct purposes. Handle separately:

**4a. Amber as "warning/caution"** → `warning` token
| Hardcoded | Replace with |
|---|---|
| `text-amber-600` (warning context) | `text-warning` |
| `text-amber-500` (warning icon) | `text-warning` |
| `bg-amber-50`, `bg-amber-100` (warning bg) | `bg-warning/10` |
| `border-amber-200`, `border-amber-300` | `border-warning/30` |

**4b. Amber as "coin/gold" branding** → keep as-is OR add `--coin` token
| Usage | Decision |
|---|---|
| `from-amber-400 to-amber-500` (coin badge) | **Keep** — this is brand color for coins, not semantic |
| `text-amber-600` in CoinButton | **Keep** — coin branding |
| `from-amber-300 via-amber-400 to-orange-400` (ExamCard shadow) | **Keep** — decorative |
| `text-amber-400` (star rating) | **Keep** — decorative |

### Rule 5: One-off colors

| Hardcoded | Replace with |
|---|---|
| `text-blue-200` (ProfileBanner highlight) | `text-primary-foreground/70` |
| `from-[#FBBF24] to-[#F59E0B]` | `bg-warning` |
| `from-[#001656] to-[#0172FA]` (LandingPage) | **Keep** — landing page has its own visual language |
| `from-slate-300 to-slate-400` (StreakDialog disabled) | `bg-muted-foreground/40` |
| `from-slate-200 via-slate-100 to-slate-200` (Confirmation card shadow) | `bg-border` |

### Rule 6: Dark mode overrides — remove

Khi dùng token, không cần `dark:` prefix nữa. Xóa toàn bộ:
- `dark:border-slate-700`, `dark:from-slate-800`, `dark:to-slate-900`
- `dark:border-slate-600`, `dark:bg-slate-900/40`, `dark:hover:bg-slate-900/70`
- `dark:bg-emerald-900/50`, `dark:text-emerald-300`, etc.

### Rule 7: Native form elements → shadcn/ui components

| Current | Replace with |
|---|---|
| `<input type="text" className="border-slate-200 bg-white ...">` | `<Input />` from `ui/input` |
| `<input type="checkbox" className="border-gray-300 ...">` | `<Checkbox />` from `ui/checkbox` |

## Exceptions (allowed hardcoded colors)

1. **Landing page** (`routes/-components/landing/*`): Has its own dark-on-blue visual language with `bg-white/5`, `text-white/80`, etc. These are intentional for the marketing page and don't need tokens.
2. **Coin branding** (`amber-400/500` gradients): Decorative gold color for coin badges. If it appears in >5 more places, consider adding `--coin` token later.
3. **White-on-primary overlays** (`bg-white/15`, `text-white/85` inside gradient banners like ProfileBanner): These are relative to the gradient background, not the theme. Keep as-is.
4. **Sonner toast overrides** (`components/ui/sonner.tsx`): Uses `!important` overrides for toast variants. Keep emerald/amber here since sonner has its own styling system — revisit if sonner supports CSS variable theming.

## Violation inventory (files to fix)

### Priority 1 — slate/gray (dark mode broken)

| File | Violations |
|---|---|
| `ExamCountdown.tsx` | `border-slate-200`, `from-slate-50`, `to-slate-100`, `border-slate-300`, `bg-white/60`, `bg-slate-200/60`, `from-red-400 to-red-500`, `from-[#FBBF24] to-[#F59E0B]` + 5 `dark:` overrides |
| `ExamSidebarFilters.tsx` | `border-slate-200`, `bg-white`, `border-gray-300` |
| `ExamDetailHeader.tsx` | `border-slate-200`, `bg-slate-100`, `text-slate-500` |
| `StreakDialog.tsx` | `bg-slate-200/70`, `from-slate-300 to-slate-400` + `dark:bg-slate-700/60` |
| `OnboardingStep.Confirmation.tsx` | `from-slate-200 via-slate-100 to-slate-200` |

### Priority 2 — emerald → success

| File | Violations |
|---|---|
| `DeviceCheckScreen.tsx` | `text-emerald-600` ×2 |
| `StreakDialog.tsx` | `text-emerald-600`, `bg-emerald-100`, `text-emerald-700` + dark overrides |
| `WritingExamPanel.tsx` | `bg-emerald-500`, `text-emerald-600` |
| `SpeakingExamPanel.tsx` | `border-emerald-300`, `bg-emerald-50`, `bg-emerald-500`, `text-emerald-700`, `text-emerald-600`, `text-emerald-500` |
| `ChiTietCard.tsx` | `border-emerald-100`, `border-emerald-200` |
| `PerformanceTable.tsx` | `border-emerald-200`, `border-b-emerald-400` |
| `KetQuaCard.tsx` | `border-emerald-200`, `border-b-emerald-400` |
| `OnboardingStep.Level.tsx` | `text-emerald-600`, `bg-emerald-100`, `text-emerald-700` |

### Priority 3 — amber in warning context

| File | Violations |
|---|---|
| `StreakDialog.tsx` | `text-amber-600`, `bg-amber-50/60`, `border-amber-300`, `bg-amber-100`, `text-amber-600` + dark overrides |
| `OnboardingBanner.tsx` | `border-amber-200`, `bg-amber-50`, `text-amber-500`, `text-amber-900`, `text-amber-700` + dark overrides |
| `OnboardingStep.Level.tsx` | `text-amber-600`, `bg-amber-100`, `text-amber-700` |
| `OnboardingStep.GoalBand.tsx` | `text-amber-500` |
| `PerformanceTable.tsx` | `border-amber-200`, `border-b-amber-400` |
| `phong-thi index.tsx` | `text-amber-600`, `bg-amber-500/10`, `text-amber-500` |
| `DeviceCheckScreen.tsx` | `bg-amber-50`, `text-amber-700`, `ring-amber-200` + dark overrides |

### Priority 4 — one-offs

| File | Violation | Fix |
|---|---|---|
| `ProfileBanner.tsx` | `text-blue-200` | → `text-primary-foreground/70` |

## Implementation status

- [ ] P1: Fix slate/gray violations (5 files)
- [ ] P2: Fix emerald → success (8 files)
- [ ] P3: Fix amber warning context (7 files)
- [ ] P4: Fix one-offs (1 file)
- [ ] P5: Replace native `<input>` with `<Input>` / `<Checkbox>` in ExamSidebarFilters
- [ ] Verify dark mode renders correctly after all changes
