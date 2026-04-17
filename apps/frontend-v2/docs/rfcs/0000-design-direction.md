# RFC 0000 — Design Direction & Aesthetic Foundation

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |
| Superseded by | — |

## Summary

Chốt aesthetic direction cho app VSTEP theo chuẩn gamification đã được chứng minh (Duolingo, Quizlet). Gamification hiện tại trong codebase đang tự chế — lạm dụng màu, thiếu restraint, không theo pattern chuẩn. RFC này chốt cách sửa theo reference thực tế.

## Reference: Duolingo design system

Duolingo là chuẩn vàng của gamification trong education. Các pattern chính:

### Color system — mỗi màu có 1 ý nghĩa duy nhất

```
green  (#58cc02)  → Success, correct, primary CTA
red    (#ff4b4b)  → Hearts, mistakes, urgency
orange (#ff9600)  → Streaks, fire
yellow (#ffc800)  → XP, rewards, celebration
blue   (#1cb0f6)  → Information, progress, neutral
purple (#ce82ff)  → League, premium
gray   (#e5e5e5)  → Surface, inactive
```

**Quy tắc quan trọng**: Mỗi screen chỉ dominant 1-2 hue. Không bao giờ 4-5 hue cùng lúc.

### Lesson Complete screen — 3 stat cards + 2 buttons

```
┌─────────────────────────────────────┐
│                                     │
│        "Lesson Complete!"           │  ← yellow-400 text, centered
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Total │  │Commit│  │Amazi │      │
│  │ XP   │  │ ted  │  │ ng   │      │
│  │  12  │  │ 3:33 │  │ 100% │      │
│  └──────┘  └──────┘  └──────┘      │
│  yellow     blue      green         │  ← mỗi card 1 hue, border-2 + bg
│                                     │
│─────────────────────────────────────│
│  [Review lesson]    [Continue →]    │  ← gray outline / green solid
└─────────────────────────────────────┘
```

Mỗi stat card: `border-2 border-{color} bg-{color}` header + `bg-white text-{color}` body. Đơn giản, rõ ràng.

### Button 3D — chữ ký visual

```css
/* Primary CTA */
rounded-2xl border-b-4 border-green-600 bg-green-500 text-white

/* Secondary */
rounded-2xl border-2 border-b-4 border-gray-200 bg-white text-gray-400
```

Chỉ dùng `border-b-4` cho **buttons**, không phải cho cards hay badges.

### Correct/Wrong feedback — banner slide-up

```
CORRECT: green banner, "Great!" + [CONTINUE]
WRONG:   red banner, "Correct solution: ..." + [GOT IT]
```

Không dùng nhiều shade (emerald-100/200/300/400/500/600/700). Chỉ 1 màu solid.

### Review scorecard — tiles đơn giản

```
Đúng: bg-yellow-100 text-yellow-600 + check icon
Sai:  bg-red-100 text-red-500 + X icon
```

2 states, 2 colors. Không có 3D badge, không có gradient, không có border semantic.

## Vấn đề hiện tại: Tự chế, không theo chuẩn

### 1. Quá nhiều hue cùng lúc

**Duolingo**: Lesson Complete screen dùng 3 hue (yellow, blue, green) — mỗi stat card 1 hue.

**VSTEP hiện tại**: KetQuaCard dùng 5+ hue trong 1 card:
- Mascot image
- `border-b-slate-400` (3D card)
- `border-emerald-200 border-b-emerald-400 bg-success/5` (ScorePill đúng)
- `border-rose-200 border-b-rose-400 bg-destructive/5` (ScorePill sai)
- Primary blue button

→ Mỗi element tự có border color + bg color + text color riêng = visual chaos.

### 2. 3D effect sai chỗ

**Duolingo**: `border-b-4` chỉ dùng cho **buttons** (CTA). Cards dùng `border-2` flat.

**VSTEP hiện tại**: `border-b-4` dùng cho:
- KetQuaCard (card) — sai, nên flat
- ChiTietCard (card) — sai
- PerformanceTable (table wrapper) — sai
- AccuracyBadge (inline badge) — sai, quá nặng cho 1 số %
- ScorePill (inline pill) — sai

→ Mọi thứ đều "nổi 3D" = không gì nổi bật.

### 3. Severity dùng quá nhiều shade

**Duolingo**: Đúng = `bg-yellow-100 text-yellow-600`. Sai = `bg-red-100 text-red-500`. 2 states, 2 colors, 1 shade mỗi loại.

**VSTEP hiện tại**: Đúng dùng 6+ shade emerald:
- `text-emerald-500`, `text-emerald-600`, `text-emerald-700`
- `bg-emerald-50`, `bg-emerald-100`, `bg-emerald-500`
- `border-emerald-100`, `border-emerald-200`, `border-emerald-300`
- `border-b-emerald-400`

→ Cùng ý nghĩa "đúng" mà 10+ class khác nhau.

### 4. ExamCard gradient shadow — không có trong bất kỳ reference nào

Pseudo-element `translate-x-[4px] translate-y-[4px] bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400` — đây là pattern tự chế, không có trong Duolingo, Quizlet, hay bất kỳ app education nào. Tạo visual noise khi có 6 cards trong grid.

## Design Direction: Theo chuẩn Duolingo

### Color mapping — VSTEP tokens → Duolingo roles

| Duolingo role | Duolingo color | VSTEP token | Dùng cho |
|---|---|---|---|
| Success/CTA | green #58cc02 | `success` | Correct, đạt, primary CTA |
| Mistakes | red #ff4b4b | `destructive` | Wrong, lỗi |
| Streaks | orange #ff9600 | `skill-speaking` | Streak fire, streak count |
| XP/Rewards | yellow #ffc800 | `warning` (hoặc coin gold) | XP earned, coin rewards |
| Information | blue #1cb0f6 | `primary` | Progress, neutral info |
| Surface | gray #e5e5e5 | `muted` | Inactive, background |

**Rule**: Mỗi component max 2 hue ngoài neutral. Giống Duolingo.

### Correct/Wrong — 2 states, 2 colors, 1 shade

```
Đúng: bg-success/10 text-success     (1 token, 2 usages)
Sai:  bg-destructive/10 text-destructive  (1 token, 2 usages)
Neutral: bg-muted/50 text-muted-foreground
```

**Không dùng**: `border-emerald-200`, `border-b-emerald-400`, `bg-emerald-50`, gradient severity. Chỉ token + opacity.

### 3D `border-b-4` — chỉ cho buttons (theo Duolingo)

```tsx
/* ✅ Primary CTA button */
className="rounded-2xl border-b-4 border-primary/80 bg-primary text-primary-foreground"

/* ✅ Secondary button */
className="rounded-2xl border-2 border-b-4 border-border bg-card text-muted-foreground"

/* ❌ KHÔNG dùng border-b-4 cho: */
// - Cards (KetQuaCard, ChiTietCard)
// - Tables (PerformanceTable)
// - Badges (AccuracyBadge)
// - Pills (ScorePill)
```

Cards dùng `border-2 border-border bg-card shadow-sm` — flat, clean.

### Lesson Complete — theo Duolingo pattern

Hiện tại VSTEP có `McqResultSummary` (score circle + message). Chuẩn hóa theo Duolingo:

```
┌─────────────────────────────────────┐
│                                     │
│        "Hoàn thành!"               │  ← text-primary, centered
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ Điểm │  │Thời  │  │Chính │      │
│  │      │  │gian  │  │ xác  │      │
│  │ 8/10 │  │ 5:20 │  │ 80%  │      │
│  └──────┘  └──────┘  └──────┘      │
│  primary    muted     success       │
│                                     │
│─────────────────────────────────────│
│  [Xem lại bài]    [Tiếp tục →]     │
└─────────────────────────────────────┘
```

Mỗi stat card: `border-2 border-{color}` header + `bg-card text-{color}` body. Giống Duolingo 1:1.

### ExamCard — bỏ gradient shadow, dùng flat card

```
Trước: [Amber gradient pseudo-element shadow] + card
Sau:   [Card with border-2 border-border shadow-sm hover:shadow-md]
```

Giống Duolingo lesson card — flat, clean, hover lift.

### StreakDialog — theo Duolingo streak screen

Duolingo streak screen: fire icon + số ngày (orange) + tuần học (dots) + "Complete a lesson to extend your streak!". Chỉ 1 hue (orange) + neutral.

VSTEP StreakDialog nên:
- Streak number: `text-skill-speaking` (orange) — giữ
- Progress bar: `bg-primary` (solid, không gradient)
- Milestones: `bg-muted/50` cards, claimed = `opacity-60` + check icon
- **Bỏ**: emerald/amber/slate gradients, multi-hue borders

### Typography

Din Round — giữ, phù hợp gamification (rounded như Duolingo).

| Role | Class |
|---|---|
| Display | `text-3xl font-bold tracking-tight md:text-4xl` |
| Title | `text-2xl font-bold` |
| Subtitle | `text-lg font-semibold` |
| Body | `text-sm` |
| Caption | `text-xs text-muted-foreground` |

**Cấm**: `text-[10px]`, `text-[11px]` → dùng `text-xs`.

## Tóm tắt: Trước vs Sau

| Aspect | Trước (tự chế) | Sau (theo Duolingo) |
|---|---|---|
| Correct/Wrong | 6+ emerald shades + 3D border | `bg-success/10 text-success` — 1 token |
| 3D `border-b-4` | Cards, tables, badges, pills | **Chỉ buttons** |
| ExamCard | Gradient pseudo-element shadow | Flat `border-2 shadow-sm` |
| Lesson Complete | Score circle SVG | 3 stat cards (Duolingo pattern) |
| StreakDialog | 5 hue (orange/emerald/amber/slate/primary) | 1 hue (orange) + neutral |
| Progress bars | Gradient (`from-emerald-400 to-emerald-500`) | Solid `bg-primary` |
| Colors per component | 4-6 hue | Max 2 hue ngoài neutral |

## Relationship to other RFCs

| RFC | Ảnh hưởng |
|---|---|
| 0001 | Token mapping theo color system ở đây. Bỏ tất cả hardcoded emerald/amber/rose/slate. |
| 0002 | 3D `border-b-4` chỉ cho buttons. Cards dùng flat `border-2`. |
| 0003 | New components follow Duolingo patterns. |
| 0004 | Lesson Complete screen theo Duolingo 3-stat-card pattern. |
| 0005 | StreakDialog simplify theo Duolingo streak screen. |

## Implementation status

- [ ] Review và confirm direction
- [ ] Dùng làm reference khi implement RFC 0001–0005
