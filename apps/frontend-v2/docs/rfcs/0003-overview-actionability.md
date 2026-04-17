# RFC 0003 — Overview Actionability

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |

## Summary

Overview là dead-end — hiện số liệu nhưng không dẫn user đi đâu. 3 component đã code sẵn nhưng không render.

## Changes

### 1. Render `OnboardingBanner` khi chưa có onboarding data

`_app.overview.tsx` → trước `ProfileBanner`:
```tsx
{!levelTrack && <OnboardingBanner onStart={onStartOnboarding} />}
```

### 2. Render `NextActionCard` trong tab Tổng quan

`_app.overview.tsx` → `DetailsView`, sau `StatGrid`:
```tsx
<NextActionCard action={data.nextAction} />
```

### 3. Render `GoalCard` trong tab Tổng quan

`_app.overview.tsx` → `DetailsView`, sau `ExamCountdown`:
```tsx
<GoalCard goal={data.goal} />
```

### 4. `LearningPathView` skill cards → thêm CTA link

Mỗi skill card thêm: `Luyện {label} →` link đến `/luyen-tap/ky-nang?skill=...`

### 5. `StatGrid` items clickable

- "Kỹ năng yếu: Writing" → `/luyen-tap/ky-nang?skill=viet`
- "Tổng bài test" → `/thi-thu`

### 6. Post-onboarding → navigate đến `/luyen-tap`

## Checklist

- [ ] Render OnboardingBanner
- [ ] Render NextActionCard
- [ ] Render GoalCard
- [ ] LearningPathView CTA links
- [ ] StatGrid clickable items
- [ ] Post-onboarding navigate
