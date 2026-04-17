# Skill Design — VSTEP Frontend v2

Derive từ source code `apps/frontend/src` (v1). Dùng khi implement/review UI frontend-v2.

---

## 0. Global Rules

**Rule 0.1 — Icon render trần.** Không bọc trong `div` có `bg-*`. Chỉ `text-*` cho màu.
```tsx
// ❌ <div className="size-10 rounded-xl bg-primary/10"><Icon className="size-5" /></div>
// ✅ <Icon className="size-6 text-primary" />
```

**Rule 0.1b — Không bọc icon+text vào pill trang trí** nếu không phải chip/badge/button/semantic state.
```tsx
// ❌ <div className="inline-flex rounded-full bg-primary/10 px-3 py-1"><Icon /><span>Listening</span></div>
// ✅ <div className="flex items-center gap-2"><Icon className="size-4 text-primary" /><span className="text-sm font-medium">Listening</span></div>
```
Ngoại lệ: Avatar, Button icon-only, Chip/pill badge, Semantic badge (success/warning/destructive).

**Rule 0.2 — Hub card dùng `border bg-card`.** Card điều hướng top-level: `rounded-2xl border bg-card p-6 shadow-sm`. KHÔNG `bg-muted/50`.

**Rule 0.3 — Hover không đổi border.** Chỉ `hover:-translate-y-0.5` + `hover:shadow-md`. KHÔNG `hover:border-primary/30`.

---

## 1. Design Tokens

### Colors (Tailwind v4 `@theme inline`)
```
bg-background ~ #fafafa    bg-card ~ #ffffff       text-primary ~ #1a6ef5
bg-muted ~ #f3f4f6         text-muted-foreground ~ #6b7280    border-border ~ #e5e7eb
text-success ~ #22c55e     text-warning ~ #f59e0b  text-destructive ~ #ef4444
```
Skill colors:
```
text-skill-listening ~ #3b82f6   text-skill-reading ~ #10b981
text-skill-writing ~ #8b5cf6     text-skill-speaking ~ #f59e0b
```

### Radius
`rounded-2xl` (16px) card chính · `rounded-xl` (12px) badge/mini · `rounded-lg` (8px) row/button · `rounded-full` dot/avatar

### Shadow
`shadow-sm` card default · `shadow-md` hover/elevated

### 2 loại card cốt lõi
- `rounded-2xl bg-muted/50 p-5 shadow-sm` — card nội dung chính (NO border)
- `rounded-lg border bg-background p-4` — card item trong list (CÓ border)

---

## 2. Layout Shell
```
TOPBAR sticky h-14 border-b bg-background
SIDEBAR fixed bg-sidebar border-r
MAIN flex-1 overflow-y-auto p-6
```
Width rules: `mx-auto w-full max-w-5xl` (default) · `max-w-3xl` (form/writing) · Full width chỉ khi split layout.

---

## 3. Component Specs

### StatCard
`rounded-2xl bg-muted/50 p-4` · Icon `size-6` trần · Label `text-sm text-muted-foreground` · Value `text-lg font-bold`
Grid: `grid-cols-2 gap-4 lg:grid-cols-4`

### GoalCard
Empty: `rounded-2xl bg-muted/50 p-8 shadow-sm` + icon + text + button
Filled: `rounded-2xl bg-muted/50 p-5 shadow-sm` + mini stats `rounded-xl bg-muted/50 p-3 text-center`

### Profile Card
`rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-8` + Avatar `size-16` + decorative circles `bg-white/5`

### ActivityHeatmap
`Card border-0 bg-muted/30` · Cell `h-[18px]` · Active `bg-primary` · Inactive `bg-muted` · Gap `gap-[3px]`

### SpiderChart
SVG `viewBox="0 0 280 280"` · Data path `fill-primary/12 stroke-primary strokeWidth=2.5` · Dots `r=4.5`
Wrapper: `rounded-2xl bg-muted/50 p-5 shadow-sm`

### DoughnutChart (Recharts)
`PieChart > Pie innerRadius={60}` · Center label `text-3xl font-bold` · Wrapper: `rounded-2xl bg-muted/50 p-5 shadow-sm`

### OnboardingBanner
`rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/50`

### Weekly Score Cards
`rounded-xl border bg-background p-4` · Score `text-3xl font-bold tabular-nums`

### Test History Timeline
Vertical dashed line `border-l-2 border-dashed` · Dot `size-3 rounded-full bg-primary ring-4 ring-card`
Session row: `rounded-lg border p-3` + score badge `size-10 rounded-lg`

---

## 4. Cheat Sheet

### Card styles
| Pattern | Class |
|---------|-------|
| Card nội dung | `rounded-2xl bg-muted/50 p-5 shadow-sm` |
| Card item | `rounded-xl border bg-background p-4` |
| Card mini stat | `rounded-xl bg-muted/50 p-3 text-center` |
| Card amber | `rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4` |
| Hub card | `rounded-2xl border bg-card p-6 shadow-sm` |

### Typography
| Level | Class |
|-------|-------|
| Page title | `text-2xl font-bold` |
| Card title | `text-lg font-semibold` |
| Stat value | `text-lg font-bold` |
| Big score | `text-3xl font-bold tabular-nums` |
| Mini stat | `text-sm font-bold` |
| Label | `text-sm text-muted-foreground` |
| Tiny | `text-xs text-muted-foreground` |
| Micro | `text-[10px] text-muted-foreground` |

### Spacing
`space-y-6` page · `p-5` card · `p-4` stat · `p-3` mini · `gap-4` stats grid · `gap-6` charts

### Icon sizes
`size-6` card header · `size-5` stat · `size-4` skill row/button · `size-3` timeline dot

### Icon mapping (Hugeicons v1 → Lucide v2)
HeadphonesIcon→`headphones` · Book02→`book-open` · PencilEdit02→`pencil-line` · Mic01→`mic` · Clock01→`clock` · Target02→`target` · Fire02→`flame` · CheckmarkCircle02→`circle-check` · ArrowRight01→`arrow-right` · AnalyticsUp→`chart-line` · UserCircle→`user-round` · Logout01→`log-out`

---

## 5. Data Shape → Component

```ts
ActivityData { activeDays, totalStudyTimeMinutes, totalExercises, streak }
ProgressData { skills[{ skill, currentLevel, attemptCount }], goal: EnrichedGoal | null }
SpiderData { skills: Record<Skill, { current: number, trend: string }> }
EnrichedGoal { targetBand, deadline, daysRemaining, dailyStudyTimeMinutes, currentEstimatedBand, achieved, onTrack }
```

### Responsive
`lg:grid-cols-4` stats · `md:grid-cols-2` charts · `sm:grid-cols-4` plan detail

### State
TanStack Query for server state · Skeleton loading · `rounded-2xl bg-muted/50 p-12 text-center` error

---

## 6. Exam UI

### 3D Card Effect
```tsx
// ExamCard shadow offset
"absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-xl bg-gradient-to-br ..."
"group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-hover:shadow-md"
// KetQuaCard border
"rounded-2xl border-2 border-b-4 border-border border-b-slate-400"
```

### Sảnh Thi
DashboardGoalCard: `rounded-[24px]` gradient + countdown blocks `h-[52px] w-[56px] rounded-xl bg-primary`
DashboardStreakCard: heatmap cells `size-[12px] rounded-full` · hover `scale-125 ring-2 ring-primary/50`
ExamCard: 3D offset + Pro badge gradient `from-amber-400 to-amber-500` · Skill chips `rounded-full px-2.5 py-1 text-[11px] font-semibold`

### Phòng Thi Shell
`flex h-screen flex-col` · Header `h-12 border-b-2` · Footer `h-12 border-t-2`
Timer pill: normal `rounded-full bg-muted px-3 py-1` · warning `bg-destructive/10 text-destructive`

### Exam Panels
Listening: audio bar `border-t-2` · play btn `rounded-full bg-primary` · progress `h-1.5 rounded-full`
Speaking: recorder `h-14 rounded-lg border` · recording `border-destructive` · done `border-emerald-300`
Reading: desktop `w-1/2` split · mobile tabbed `border-b-2` active

### Animations
Button tap: `whileTap={{ scale: 0.97 }}` spring · Card hover: translate + shadow · Recording: `animate-pulse`

### Skill Color Tokens
```tsx
SKILL_META: Record<Skill, { accent, selectedBg, checkBg, checkBorder, textColor }>
// accent: "bg-skill-{skill}"  selectedBg: "bg-skill-{skill}/8"  textColor: "text-skill-{skill}"
```

### Quick Reference
| Pattern | Class |
|---------|-------|
| 3D shadow | `translate-x-[4px] translate-y-[4px] rounded-xl` |
| 3D border | `border-2 border-b-4 border-border border-b-slate-400` |
| Skill accent bar | `h-5 w-1 rounded-full` |
| Audio play | `rounded-full bg-primary text-primary-foreground` |
| Countdown | `h-[52px] w-[56px] rounded-xl bg-primary text-2xl font-bold shadow-sm` |
