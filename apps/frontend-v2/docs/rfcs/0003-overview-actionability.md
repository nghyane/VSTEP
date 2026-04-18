# RFC 0003 — Overview Actionability

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2026-04-17 |

## Summary

Overview là dead-end — hiện số liệu nhưng không dẫn user đi đâu. 3 component đã code sẵn nhưng không render.

**Cập nhật 2026-04-17:** `ExamCountdown` đã replace `GoalCard` (commit `6f01a30` trước đó). `StatGrid` đã redesign sang VSTEP-phù hợp với band gap + trend + weakest skill (commit `94ac2b9`, `457a50f`), nhưng vẫn chưa clickable. `OnboardingBanner` và `NextActionCard` vẫn chưa được render. Charts đã redesign (commit `5e5263f` → `c090126` → `6b67bd6`): doughnut chart hiển thị chỉ số ở center, bar chart stacked 4 kỹ năng với radius bo tròn.

## Changes

### 1. Render `OnboardingBanner` khi chưa có onboarding data

**Chưa làm.** File `OnboardingBanner.tsx` tồn tại nhưng không được import trong `_app.overview.tsx`.

`_app.overview.tsx` → trước `ProfileBanner`:
```tsx
{!levelTrack && <OnboardingBanner onStart={onStartOnboarding} />}
```

### 2. Render `NextActionCard` trong tab Tổng quan

**Chưa làm.** File tồn tại, không render.

`_app.overview.tsx` → `DetailsView`, sau `StatGrid`:
```tsx
<NextActionCard action={data.nextAction} />
```

### 3. ~~Render `GoalCard` trong tab Tổng quan~~ → đã thay bằng `ExamCountdown` ✅

Commit `6f01a30` đã replace `GoalCard` bằng `ExamCountdown` (countdown đến ngày thi, drive streak dialog). RFC này trước đó đã note đúng hướng.

### 4. `LearningPathView` skill cards → thêm CTA link

**Chưa verify.** Cần check `LearningPathView` / `PracticeTrackView` xem skill cards đã có CTA "Luyện {label} →" chưa.

### 5. `StatGrid` items clickable

**Chưa làm.** `StatGrid.tsx` render plain div, chưa wrap `Link`. Cần:
- "Kỹ năng yếu: Writing" → `/luyen-tap/ky-nang?skill=viet`
- "Tổng bài test" → `/thi-thu`
- "Band còn thiếu" → `/thi-thu` (hoặc route mô phỏng)
- "Xu hướng" → detail chart modal?

### 6. Post-onboarding → navigate đến `/luyen-tap`

**Chưa verify.** Check OnboardingDialog finish handler.

### 7. [Mới] Chart redesign ✅

- `DoughnutChart` center text chỉ hiển thị số, aspect-square responsive (commit `6b67bd6`)
- Stacked bar chart 4 kỹ năng với radius bo tròn đúng chuẩn — segment trên cùng/dưới cùng có góc rounded, segment giữa vuông (commit `c090126`)

## Files

| File | Change | Status |
|---|---|---|
| `_app.overview.tsx` | Render OnboardingBanner + NextActionCard | ⏳ |
| `StatGrid.tsx` | VSTEP redesign (band gap, trend, weakest skill) | ✅ |
| `StatGrid.tsx` | Wrap items với Link | ⏳ |
| `DoughnutChartCard.tsx` | Center text, aspect-square | ✅ |
| `SpiderChartCard.tsx` / bar chart | Stacked 4 kỹ năng bo tròn | ✅ |
| `ExamCountdown.tsx` | Replace GoalCard (countdown + streak) | ✅ |
| `LearningPathView` / `PracticeTrackView` | Skill card CTA links | ⏳ verify |

## Checklist

- [ ] Render OnboardingBanner khi chưa có onboarding data
- [ ] Render NextActionCard trong DetailsView
- [x] ExamCountdown replace GoalCard
- [ ] LearningPathView skill cards CTA links (verify)
- [x] StatGrid VSTEP redesign (band gap, trend, weakest)
- [ ] StatGrid clickable (wrap Link)
- [x] Chart redesign (doughnut center text, stacked bar bo tròn)
- [ ] Post-onboarding navigate `/luyen-tap` (verify)
