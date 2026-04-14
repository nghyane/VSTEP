# Skill Design — VSTEP Frontend v2

Tài liệu này được derive **trực tiếp từ source code** `apps/frontend/src` (frontend v1 đang chạy thật).
Mỗi spec đều có truy xuất về file gốc. Dùng tài liệu này để implement frontend-v2.

---

## 0. Global Rules

**Rule 0.1 — Không bọc background cho icon.** Icon (lucide, SVG, GIF) phải render trần, không đặt trong khung vuông/tròn có `bg-*` riêng. Chỉ dùng `text-*` cho màu icon. Lý do: reduce noise, icon tự nó đã đủ visual weight; background wrap làm rối layout và che mất trọng tâm text.

Trước (không được):
```tsx
<div className="flex size-10 rounded-xl bg-primary/10 text-primary">
  <Icon className="size-5" />
</div>
```

Sau (đúng):
```tsx
<Icon className="size-6 text-primary" />
```

**Ngoại lệ được phép:**
- Avatar (có nền vì chứa chữ cái initials)
- Button icon-only (nền nút chính là nền icon)
- Chip/pill badge text+icon dạng inline-flex (nền là của cả chip)
- **Step number bubble** — vòng tròn chứa số thứ tự bước (`<span class="size-7 rounded-full bg-primary">1</span>`), phổ biến trong gamification flow (DeviceCheckScreen, wizard)
- **MCQ option badge** — ô chữ cái A/B/C/D trong câu hỏi trắc nghiệm (`<span class="size-6 rounded-lg bg-muted/bg-primary">A</span>`), badge này mang nghĩa "answer key", không phải icon wrapper
- **Icon trong dialog header** — icon minh hoạ ở giữa dialog để tạo visual anchor (`<div class="size-16 rounded-full bg-primary/10"><Icon /></div>`), chấp nhận vì đây là intentional empty state / confirmation pattern, không phải inline icon

---

## 1. Design Tokens

### Color System (từ `styles.css`)

Token dùng Tailwind CSS v4 với `@theme inline`. Tên token trong code là Tailwind class.

```
Màu nền trang:     bg-background      oklch(1 0.003 260)       ~ #fafafa
Màu surface card:  bg-card            oklch(1 0.003 260)       ~ #ffffff
Màu primary:       text-primary       oklch(0.55 0.2 258)      ~ #1a6ef5 (xanh dương)
Màu muted bg:      bg-muted           oklch(0.965 0.003 260)   ~ #f3f4f6
Màu muted text:    text-muted-foreground  oklch(0.45 0.006 260) ~ #6b7280
Màu border:        border-border      oklch(0.925 0.006 260)   ~ #e5e7eb
Màu success:       text-success       oklch(0.65 0.2 150)      ~ #22c55e
Màu warning:       text-warning       oklch(0.75 0.16 55)      ~ #f59e0b
Màu destructive:   text-destructive   oklch(0.577 0.245 27)    ~ #ef4444
```

Màu kỹ năng (từ `progress-constants.ts` + `styles.css`):
```
Listening:  var(--skill-listening)  oklch(0.65 0.18 258)  ~ #3b82f6 (blue)
Reading:    var(--skill-reading)    oklch(0.65 0.18 155)  ~ #10b981 (green)
Writing:    var(--skill-writing)    oklch(0.65 0.18 290)  ~ #8b5cf6 (purple)
Speaking:   var(--skill-speaking)   oklch(0.65 0.18 60)   ~ #f59e0b (amber)
```

### Radius

```
--radius: 1rem (16px)   → rounded-2xl  ← dùng cho card chính
rounded-xl = 12px       ← dùng cho icon wrap, badge, mini card
rounded-lg = 8px        ← dùng cho row item, button
rounded-full            ← dùng cho dot, avatar
```

### Shadow

```
shadow-sm   ← mặc định cho card (bg-muted/50 không dùng border, dùng shadow-sm)
shadow-md   ← hover state / elevated card
shadow-lg   ← gamification: toast, 3D button, dialog elevated, focused-mode card nổi
```

**Gamification "3D button" effect** — Pattern signature của UI gamification (kiểu Duolingo). Dùng `border-2 border-b-4` kết hợp bottom border đậm hơn top/sides để tạo cảm giác nổi khối:

```tsx
// Button / card gamification — viền trên nhạt, viền dưới đậm = hiệu ứng 3D
className="rounded-2xl border-2 border-b-4 border-emerald-300 border-b-emerald-500 shadow-lg"
```

Rule: `border-b-*` color PHẢI đậm hơn 2 bậc so với `border-*` (ví dụ `border-emerald-300` + `border-b-emerald-500`).

**Quan trọng:** Frontend cũ phân chia 2 loại card rõ ràng:
- `rounded-2xl bg-muted/50 p-5 shadow-sm` — card nội dung chính (NO border, nền muted)
- `rounded-lg border bg-background p-4` — card dạng item trong list (CÓ border, nền trắng)

**Rule 0.2 — Hub card ở top-level page dùng `border bg-card`.** Các card điều hướng lớn ở trang hub (ví dụ `/luyen-tap` ModeCard, `/luyen-tap/ky-nang` SkillCard) phải dùng `rounded-2xl border bg-card p-6 shadow-sm` để đồng bộ, KHÔNG dùng `bg-muted/50` (gây cảm giác đục, lệch với card cha).

**Rule 0.3 — Hover không đổi màu border (trừ interactive list item).** Hover của card chính chỉ được nâng nhẹ (`hover:-translate-y-0.5`) và tăng shadow (`hover:shadow-md`). KHÔNG dùng `hover:border-primary/30` trên hub card lớn vì tạo viền xanh lệch với style card cha.

**Ngoại lệ cho interactive list item** (`rounded-xl border bg-background p-4` pattern): Các row item nhỏ dạng link/button trong list (như Weekly Score Card, exam row) có thể dùng `hover:border-primary/30` vì đây là affordance click rõ ràng, không phải card hub. Quy tắc: card hub → **giữ border trung tính**; list item clickable → **có thể dùng hover border primary nhẹ**.

**Rule 0.4 — `icon + text` trong badge/chip/tab/button phải canh cùng đáy trước, không tin tuyệt đối vào `items-center`.** Với các UI compact như badge `PRO`, segmented control, filter pill, stat chip..., icon và text rất dễ nhìn lệch dù technically đang ở giữa container. Mặc định ưu tiên canh theo cùng đáy/baseline để mắt nhìn thấy icon và chữ “ngồi” trên một hàng ổn định.

**Guideline thực thi:**
- Wrapper: ưu tiên `inline-flex items-end gap-1` hoặc `inline-flex items-baseline gap-1`
- Text: dùng `leading-none` cho label ngắn (`Pro`, `Free`, `AI`, `New`...)
- Icon: thêm `shrink-0`; nếu icon hơi tụt xuống dưới hoặc nổi lên trên thì chỉnh rất nhẹ bằng `mb-px` / `mt-px`
- Tránh lạm dụng `translate-y-*` trên text như fix mặc định; chỉ dùng khi đã thử align bằng layout mà vẫn lệch
- Luôn check bằng mắt ở size thật của component, vì icon font metrics và chữ uppercase thường lệch thị giác

Ví dụ nên dùng:
```tsx
<span className="inline-flex items-end gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-0.5 text-white shadow-sm">
  <Crown className="mb-px size-3 shrink-0" />
  <span className="text-[10px] font-bold leading-none uppercase tracking-wider">
    Pro
  </span>
</span>
```

Không nên mặc định dùng:
```tsx
<span className="inline-flex items-center gap-1 ...">
  <Crown className="size-3" />
  <span className="translate-y-px">Pro</span>
</span>
```

**Rule 0.5 — Toast dùng gamification style: solid color + 3D border + shadow-lg.** UI hiện tại theo hướng gamification nên toast phải đủ nổi bật — **không dùng màu opacity mờ, không dùng backdrop-blur**. Toast là feedback trực tiếp, cần nổi khối rõ ràng để người dùng nhìn thấy ngay.

**Guideline thực thi:**
- Toast base: `rounded-2xl border-2 border-b-4 shadow-lg font-medium` — áp dụng 3D button pattern
- Màu bottom border PHẢI đậm hơn border thường 2 bậc (tạo hiệu ứng nổi khối)
- **Không dùng** `backdrop-blur`, `/95` opacity, `/35` dark opacity — những thứ này làm toast "chìm"
- `shadow-lg` là đúng cho toast gamification (khác với card thông thường dùng `shadow-sm`/`shadow-md`)
- Icon toast: `size-5` (lớn hơn `size-4` của icon thường để dễ nhìn)
- Nếu alert nằm gần sticky header/top bar, điều chỉnh `offset` thay vì giảm shadow

**Màu nền toast (solid, không opacity):**
- Success: `bg-emerald-50 border-emerald-300 border-b-emerald-500` / dark: `bg-emerald-950/80 border-emerald-700 border-b-emerald-500`
- Info: `bg-sky-50 border-sky-300 border-b-sky-500` / dark: `bg-sky-950/80 border-sky-700 border-b-sky-500`
- Warning: `bg-amber-50 border-amber-300 border-b-amber-500` / dark: `bg-amber-950/80 border-amber-700 border-b-amber-500`
- Error: `bg-rose-50 border-rose-300 border-b-rose-500` / dark: `bg-rose-950/80 border-rose-700 border-b-rose-500`

Tinh thần là **nổi như một thẻ gamification**: đủ bold để người dùng nhìn thấy ngay, nhưng không lan rộng như modal hay banner full-width.

---

## 2. Layout Shell

```
┌─────────────────────────────────────────────┐
│  TOPBAR fixed h=52px (bg-background border) │
├────────────┬────────────────────────────────┤
│            │                                │
│  SIDEBAR   │  MAIN CONTENT                  │
│  fixed     │  padding: space-y-6            │
│  bg-sidebar│                                │
│  border-r  │                                │
└────────────┴────────────────────────────────┘
```

### Topbar (`LearnerLayout.tsx`)
- `sticky top-0 z-40 border-b bg-background`
- Height: `h-14` (56px)
- Container: `mx-auto flex h-14 max-w-6xl items-center px-6`
- Logo: `<Logo />` + nav links + streak pill + notif + avatar
- Streak: pill `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold tabular-nums text-warning hover:bg-warning/10`
- Notif badge: `absolute top-1 right-1 flex size-4 ... rounded-full bg-destructive text-[10px]`

### Main (`LearnerLayout.tsx`)
- `mx-auto max-w-6xl px-6 py-8`
- **Update cho frontend-v2 hiện tại:** app đang dùng sidebar trái + topbar, không còn theo top-nav-only như frontend cũ. Các token/spacing vẫn tham chiếu từ source cũ, nhưng shell layout phải bám implementation hiện tại.

### Main content width rule (v2)
- Các trang feature/list page **không được full width sát mép**. Luôn phải có khoảng thở hai bên.
- Default container cho page nội dung: `mx-auto w-full max-w-5xl`
- Với page hẹp hơn (form, writing, session nhỏ): có thể dùng `max-w-4xl` hoặc `max-w-3xl`
- Chỉ dùng full width khi thật sự cần split layout/phân tích dữ liệu rộng (ví dụ bảng lớn, chart lớn).

**Ví dụ đúng:**
```tsx
<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
```

**Ví dụ sai:**
```tsx
<div className="w-full space-y-6">
```

Lý do: full width làm accordion/card bị dàn sát hai bên, mất visual balance và khác hẳn spacing pattern của các trang còn lại.

> **Lưu ý:** phần token, card style, typography, spacing vẫn derive từ frontend cũ; riêng shell layout thì frontend-v2 đang dùng sidebar trái + topbar nên phải theo implementation hiện tại.

---

## 3. Trang Tiến Độ — Cấu Trúc

File: `routes/_learner/progress/index.tsx`

```
ProgressOverviewPage
├── Page header ("Tiến độ học tập" + subtitle)
├── Profile Card (gradient banner)
└── Tabs (Tổng Quát | Test Practice | Lộ trình)
    ├── [overview] OverviewTab
    │   ├── OnboardingBanner (conditional, amber)
    │   ├── StatCard × 4 (grid 2→4 cols)
    │   ├── ActivityHeatmap
    │   ├── GoalCard (empty | filled)
    │   └── SpiderChartCard + DoughnutChartCard (grid 2 cols)
    ├── [test-practice] TestPracticeTab
    │   ├── Weekly score cards × 4
    │   ├── Score tracking line chart (Recharts)
    │   └── Test history timeline
    └── [learning-path] LearningPathTab
        ├── Summary banner
        └── Skill plan cards × 4
```

---

## 4. Components — Spec Từ Source

### 4.1 Profile Card (progress/index.tsx)

```tsx
// Markup:
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-8">
  <div className="relative z-10 flex items-center gap-5">
    <Avatar className="size-16 border-2 border-white/30 shadow-lg" />
    <div>
      <h2 className="text-2xl font-bold text-white">Hi, {name}</h2>
      <p className="mt-1 text-sm text-white/80">Hãy tiếp tục học mỗi ngày...</p>
    </div>
  </div>
  <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/5" />
  <div className="absolute -bottom-4 -right-4 size-20 rounded-full bg-white/5" />
</div>
```

**Token:** `rounded-2xl`, gradient `from-primary to-primary/80`, decorative circles `bg-white/5`

---

### 4.2 StatCard (StatCard.tsx)

```tsx
// Container:
<div className="rounded-2xl bg-muted/50 p-4">

// Icon:
<Icon className="size-6 {valueColor}" />

// Text:
<p className="text-sm text-muted-foreground">{label}</p>
<p className="text-lg font-bold {valueColor}">{value}</p>
```

**Spec:**
- Container: `rounded-2xl bg-muted/50 p-4` — **KHÔNG có border, KHÔNG có shadow**
- Icon render trần, **không bọc background** (theo Rule 0.1)
- Label: `text-sm text-muted-foreground`
- Value: `text-lg font-bold` + màu tuỳ stat

**Các stat và màu:**
| Stat | Icon | valueColor |
|------|------|------------|
| Tổng thời lượng | Clock01Icon | `text-primary` |
| Tổng bài tập | Target02Icon | `text-warning` |
| Tổng số bài test | PencilEdit02Icon | `text-destructive` |
| Streak | Fire02Icon | `text-success` |

**Grid layout:** `grid grid-cols-2 gap-4 lg:grid-cols-4`

---

### 4.3 ActivityHeatmap (ActivityHeatmap.tsx)

```tsx
// Wrapper:
<Card className="border-0 bg-muted/30">
  <CardHeader className="flex-row items-center justify-between">
    <CardTitle className="text-base">Tần suất học tập</CardTitle>
    // legend: "Không hoạt động" + "Có hoạt động"
  </CardHeader>
  <CardContent>
    <div className="grid w-full gap-[3px]"
      style={{ gridTemplateColumns: `28px repeat(${numWeeks}, 1fr)`,
               gridTemplateRows: `auto repeat(7, 1fr) auto` }}>
      // Row 0: month labels (gridColumn span)
      // Rows 1-7: T2–CN day labels + cells
      // Row 8: weekly sum counts
    </div>
  </CardContent>
</Card>
```

**Spec:**
- Wrapper: `Card border-0 bg-muted/30` — **KHÔNG border, nền muted/30**
- Cell active: `bg-primary` (xanh dương primary)
- Cell inactive: `bg-muted`
- Cell future: `bg-transparent`
- Cell size: `h-[18px]` (chiều cao cố định, chiều rộng co giãn theo grid)
- Gap: `gap-[3px]`
- Day labels cột đầu: 28px, text `text-[11px] text-muted-foreground`
- Month labels: `text-xs text-muted-foreground`, span nhiều cột
- Sum row: `text-[10px] tabular-nums text-muted-foreground`
- **Logic:** 12 tuần ngược về quá khứ, align từ thứ Hai

---

### 4.4 GoalCard (GoalCard.tsx)

**Empty state:**
```tsx
<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/50 p-8 shadow-sm">
  <Icon className="size-6 text-primary" />
  <p className="text-sm text-muted-foreground">Bạn chưa đặt mục tiêu học tập</p>
  <Button size="sm">Đặt mục tiêu</Button>
</div>
```

**Filled state:**
```tsx
<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
  // Header: icon + "Mục tiêu: {band}" + sub text
  // 3 mini stats: Thời gian học/ngày | Còn lại | Tiến độ
  //   mỗi mini: rounded-xl bg-muted/50 p-3 text-center
  //   label: text-xs text-muted-foreground
  //   value: mt-1 text-lg font-bold
  // Expired banner (conditional): rounded-xl border border-dashed p-3
</div>
```

**Tiến độ states:**
- Đạt: `CheckmarkCircle02Icon text-success` + "Đạt"
- Đúng tiến độ: `CheckmarkCircle02Icon text-primary` + "Đúng tiến độ"
- Cần cố gắng: `Clock01Icon text-warning` + "Cần cố gắng"
- Đã kết thúc: `Clock01Icon text-muted-foreground` + "Đã kết thúc"

**GoalForm** (toggle button group):
```tsx
// Toggle button class:
"rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
// Active: "border-primary bg-primary/10 text-primary"
// Inactive: "border-border hover:border-primary/50"
// Disabled: "cursor-not-allowed opacity-40"
```

---

### 4.5 SpiderChart (SpiderChart.tsx)

**SVG spec:**
- `viewBox="0 0 280 280"`, `SIZE=280`, `CENTER=140`, `RADIUS=88`, `LEVELS=5`
- Grid: 5 level paths, `stroke="currentColor" className="text-border"`, outer `strokeWidth=1.5`, inner `0.8`
- Axes: lines từ center đến mỗi axis point, `strokeWidth=0.8`
- Data path: `className="fill-primary/12 stroke-primary"`, `strokeWidth=2.5`
- Dots: `r=4.5`, `className="fill-primary stroke-background"`, `strokeWidth=2.5`
- Labels: `fontSize=14 fontWeight=600`, màu per skill (`className={s.color}`)
- Score text: `fontSize=13 className="text-muted-foreground"`, format `{value}/10`
- Label positioning: dynamic (top/bottom vs left/right dựa vào vị trí trên circle)

**SpiderChartCard wrapper:** `rounded-2xl bg-muted/50 p-5 shadow-sm`

**Legend grid:**
```tsx
<div className="mt-4 grid grid-cols-2 gap-2">
  <Link className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted/50 transition-colors">
    <Icon className="size-4 {skillColorText[key]}" />
    <span>{label}</span>
    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{score}</span>
  </Link>
</div>
```

---

### 4.6 DoughnutChart (DoughnutChart.tsx)

Dùng **Recharts** `PieChart` + `Pie` (không phải SVG thuần):

```tsx
<ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
  <PieChart>
    <ChartTooltip />
    <Pie dataKey="count" innerRadius={60} strokeWidth={5}>
      <Label content={...} />  // center value + label
    </Pie>
  </PieChart>
</ChartContainer>
```

**Center label:**
- Value: `text-3xl font-bold fill-foreground`
- Label: `text-xs fill-muted-foreground`
- Position: cy-8 (value) + cy+18 (label)

**DoughnutLegend:**
```tsx
<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
  <span className="flex items-center gap-1.5 text-sm">
    <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor }} />
    {label}
    <span className="font-medium tabular-nums">{value}</span>
  </span>
</div>
```

**DoughnutChartCard wrapper:** `rounded-2xl bg-muted/50 p-5 shadow-sm`

---

### 4.7 OnboardingBanner (OverviewTab.tsx)

```tsx
<div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4
                dark:border-amber-900 dark:bg-amber-950/50">
  <div>
    <p className="font-semibold text-amber-900 dark:text-amber-100">
      Bạn chưa hoàn thành đánh giá trình độ
    </p>
    <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
      Hãy đánh giá trình độ và đặt mục tiêu để có lộ trình học phù hợp
    </p>
  </div>
  <Button asChild size="sm" className="shrink-0">
    <Link to="/onboarding">Bắt đầu <ArrowRight /></Link>
  </Button>
</div>
```

**Điều kiện hiện:** `!progressData?.goal && progressData.skills.every(s => s.attemptCount === 0)`

---

### 4.8 TestPracticeTab — Weekly Score Cards

```tsx
<Link className="rounded-xl border bg-background p-4 transition-colors hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md">
  <div className="mb-3 flex items-center justify-between">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <Icon className="size-5 {skillColorText[key]}" />
  </div>
  <p className="text-3xl font-bold tabular-nums">{score ?? "—.—"}</p>
  <p className="mt-1 text-xs text-muted-foreground">{attempts} bài test đã hoàn thành</p>
</Link>
```

**Container:** `rounded-xl border bg-background p-4` — **CÓ border**, nền trắng (ngược với stat card)

> **Cập nhật so với spec v1:** Icon không còn bọc trong colored box (`size-8 bg-{skillColor}`) — vi phạm Rule 0.1. Icon render trần với `text-{skillColor}`. Hover dùng `hover:-translate-y-0.5 hover:shadow-md` thay vì chỉ `hover:border-primary/30`.

---

### 4.9 LearningPathTab — Skill Plan Card

```tsx
<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
  // Header: skill icon wrap + name + priority badge + level track
  // 4 mini stat boxes: rounded-xl bg-muted/50 p-2.5 text-center
  // Weak topics: progress bars per topic
</div>
```

**Mini stat box:**
```tsx
<div className="rounded-xl bg-muted/50 p-2.5 text-center">
  <p className="text-[10px] text-muted-foreground">{label}</p>
  <p className="text-sm font-bold">{value}</p>
</div>
```

**Weak topic progress bar:**
```tsx
<div className="h-1.5 flex-1 rounded-full bg-muted">
  <div className="{skillBgColor} h-full rounded-full"
       style={{ width: `${masteryScore}%` }} />
</div>
```

---

### 4.10 Test History Timeline (TestPracticeTab.tsx)

```tsx
// Container với vertical dashed line:
<div className="relative pl-6">
  <div className="absolute left-[5px] top-1 bottom-1 border-l-2 border-dashed border-border" />

  // Per date group:
  <div className="relative mt-6">
    <div className="absolute -left-6 top-0.5 z-10 size-3 rounded-full bg-primary ring-4 ring-card" />
    <p className="mb-3 text-sm font-semibold">{date}</p>

    // Per session:
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex size-10 items-center justify-center rounded-lg {skillColor} text-sm font-bold">
        {score}
      </div>
      <div>
        <span className="text-xs font-medium {skillColorText}">{skill}</span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  </div>
</div>
```

---

## 5. Tokens Nhanh — Cheat Sheet

### Card styles

| Pattern | Class | Dùng khi |
|---------|-------|---------|
| Card nội dung chính | `rounded-2xl bg-muted/50 p-5 shadow-sm` | StatCard, SpiderCard, GoalCard, LearningPath card |
| Card item trong list | `rounded-xl border bg-background p-4` | Weekly score cards, exam items |
| Card mini stat bên trong | `rounded-xl bg-muted/50 p-3 text-center` | GoalCard mini stats, plan detail boxes |
| Card amber warning | `rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4` | Onboarding banner |
| Heatmap wrapper | `border-0 bg-muted/30` (Card component) | ActivityHeatmap |

### Heading hierarchy

| Level | Class |
|-------|-------|
| Page title | `text-2xl font-bold` |
| Card title (h3) | `text-lg font-semibold` |
| Stat value | `text-lg font-bold` |
| Weekly score | `text-3xl font-bold tabular-nums` |
| Mini stat value | `text-sm font-bold` |
| Meta / label | `text-sm text-muted-foreground` |
| Tiny label | `text-xs text-muted-foreground` |
| Micro label | `text-[10px] text-muted-foreground` |

### Spacing pattern

```
Page: space-y-6 giữa các section
Card nội dung: p-5
Stat card: p-4
Mini box: p-3 hoặc p-2.5
Gap 4 stat cards: gap-4
Gap charts: gap-6
```

### Icon sizes

| Context | Size |
|---------|------|
| Stat card icon | `size-5` hoặc `size-6` render trần |
| Card header icon | `size-6` render trần |
| Skill row icon | `size-4` (16px) |
| Timeline dot | `size-3` (12px) |
| Button icon | `size-4` (16px) |

---

## 6. Icon Library

Frontend cũ dùng `@hugeicons/react` + `@hugeicons/core-free-icons`.
Frontend v2 dùng `lucide-react` (đã có trong package.json).

Mapping:

| Hugeicons (v1) | Lucide (v2) |
|----------------|-------------|
| HeadphonesIcon | `headphones` |
| Book02Icon | `book-open` |
| PencilEdit02Icon | `pencil-line` |
| Mic01Icon | `mic` |
| Clock01Icon | `clock` |
| Target02Icon | `target` |
| Fire02Icon | `flame` |
| PlusSignIcon | `plus` |
| CheckmarkCircle02Icon | `circle-check` |
| ArrowRight01Icon | `arrow-right` |
| AnalyticsUpIcon | `chart-line` |
| UserGroup02Icon | `users` |
| DocumentValidationIcon | `file-text` |
| UserCircleIcon | `user-round` |
| Logout01Icon | `log-out` |

---

## 7. Data Shape → Component Mapping

```ts
// API response (từ hooks/use-progress.ts)
ActivityData {
  activeDays: string[]        // "YYYY-MM-DD" → ActivityHeatmap
  totalStudyTimeMinutes: number → StatCard "Tổng thời lượng"
  totalExercises: number       → StatCard "Tổng bài tập"
  streak: number               → StatCard "Streak"
}

ProgressData {
  skills: Array<{
    skill: "listening"|"reading"|"writing"|"speaking"
    currentLevel: string
    attemptCount: number      → DoughnutChart segments
  }>
  goal: EnrichedGoal | null   → GoalCard
}

SpiderData {
  skills: Record<Skill, {
    current: number           → SpiderChart value (thang 0-10)
    trend: string
  }>
}

EnrichedGoal {
  targetBand: "B1"|"B2"|"C1"
  deadline: string            // ISO date
  daysRemaining: number | null
  dailyStudyTimeMinutes: number
  currentEstimatedBand: string
  achieved: boolean
  onTrack: boolean | null
}
```

---

## 8. Responsive Breakpoints

Từ Tailwind classes trong source:

| Class | Breakpoint | Thay đổi |
|-------|-----------|---------|
| `grid-cols-2 ... lg:grid-cols-4` | lg (1024px) | Stat cards: 2 → 4 cols |
| `md:grid-cols-2` | md (768px) | Charts: 1 → 2 cols |
| `sm:grid-cols-4` | sm (640px) | Plan detail: 2 → 4 cols |

---

## 9. State Management Pattern

```ts
// Server state: TanStack Query
const spider   = useSpiderChart()    // GET /progress/spider
const progress = useProgress()       // GET /progress
const activity = useActivity(90)     // GET /progress/activity?days=90

// Loading: Skeleton placeholders cho từng section
// Error: rounded-2xl bg-muted/50 p-12 text-center
// Empty: icon + text + button (xem GoalCard empty)

// Mutation: useCreateGoal() → invalidate progress query
```

---

## 10. File Structure Đề Xuất cho v2

```
src/
  routes/
    _app/
      overview/
        index.tsx              ← page (< 80 dòng, compose)
        -components/
          ProgressBanner.tsx   ← profile card gradient
          StatGrid.tsx         ← 4 stat cards
          GoalCard.tsx         ← empty + filled state
      _app.tsx                 ← layout với topbar nav
  components/
    common/
      ActivityHeatmap.tsx      ← port từ v1 (đổi hugeicons → lucide)
      SpiderChart.tsx          ← port từ v1 (giữ nguyên SVG logic)
      DoughnutChart.tsx        ← port từ v1 (đổi recharts sang inline SVG hoặc giữ recharts)
  lib/
    queries/
      progress.ts              ← queryOptions factory
    mock/
      progress.ts              ← mock data
```

---

## 11. Gamification UI Patterns

> Section này document các pattern đặc trưng của UI gamification (Duolingo-inspired) được áp dụng từ phong-thi trở đi. Tất cả component mới theo hướng gamification phải follow section này.

### 11.1 3D Button / Card Effect

Pattern tạo cảm giác "nổi khối" — signature của gamification UI. Nguyên tắc: `border-b` đậm hơn `border` thường tạo hiệu ứng chiều sâu.

```tsx
// Cấu trúc cơ bản:
className="rounded-2xl border-2 border-b-4 shadow-lg"

// Với màu typed (ví dụ success):
className="rounded-2xl border-2 border-b-4 shadow-lg border-emerald-300 border-b-emerald-500 bg-emerald-50"
```

**Rule:** `border-b-{color}` PHẢI dùng shade đậm hơn `border-{color}` 2 bậc:
| Top/sides | Bottom |
|-----------|--------|
| `emerald-300` | `emerald-500` |
| `sky-300` | `sky-500` |
| `amber-300` | `amber-500` |
| `rose-300` | `rose-500` |
| `border-border` (neutral) | `border-slate-400` |

---

### 11.2 Step Number Bubble

Dùng trong wizard/flow nhiều bước (DeviceCheckScreen, onboarding...). Là exception của Rule 0.1 (xem exceptions list).

```tsx
// Step active (current / completed):
<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
  1
</span>

// Step inactive:
<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
  2
</span>
```

---

### 11.3 MCQ Answer Option

Dùng trong câu hỏi trắc nghiệm (Listening, Reading panel). Badge chữ cái A/B/C/D là exception của Rule 0.1.

```tsx
// Unselected:
<button className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm hover:border-primary/40">
  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
    A
  </span>
  <span>{optionText}</span>
</button>

// Selected:
<button className="flex items-center gap-2.5 rounded-xl border border-primary bg-primary/5 ring-1 ring-primary/20 px-3 py-2 text-sm">
  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
    A
  </span>
  <span>{optionText}</span>
</button>
```

---

### 11.4 Dialog Icon Header

Dùng để visual anchor cho confirmation / warning dialog. Exception của Rule 0.1 vì icon ở đây đóng vai trò "illustration", không phải inline icon.

```tsx
// Warning dialog:
<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10">
  <AlertTriangle className="size-7 text-amber-500" />
</div>

// Info dialog:
<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
  <Headphones className="size-8 text-primary" />
</div>
```

**Rule:** Chỉ dùng pattern này trong `<DialogHeader>`, không dùng inline trong card body hay list item.

---

### 11.5 Focused Mode Shell (phong-thi)

Layout cho trang làm bài tập / thi có focused mode (không có sidebar, topbar tối giản):

```
┌─────────────────────────────────────────┐
│  HEADER  h-12  border-b  (timer + exit) │
├─────────────────────────────────────────┤
│                                         │
│  SKILL PANEL  flex-1 overflow-y-auto    │
│                                         │
├─────────────────────────────────────────┤
│  FOOTER  h-12  border-t  (prev/next)    │
└─────────────────────────────────────────┘
```

```tsx
<div className="flex h-screen flex-col">
  <header className="z-40 flex h-12 shrink-0 items-center justify-between border-b px-4" />
  {/* skill panel — flex-1 overflow */}
  <footer className="z-40 flex h-12 shrink-0 items-center justify-between border-t px-4" />
</div>
```

**Timer chip** trong header:
```tsx
// Normal state:
<div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
  <Clock className="size-3.5" />
  <span className="text-sm font-semibold tabular-nums">45:00</span>
</div>

// Warning state (≤ 5 phút):
<div className="flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1">
  <Clock className="size-3.5" />
  <span className="text-sm font-semibold tabular-nums">04:59</span>
</div>
```
