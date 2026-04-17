# RFC 0003 — Overview Actionability

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |
| Superseded by | — |

## Summary

Trang Overview hiện là trang read-only — hiện số liệu nhưng không có CTA nào dẫn user đến hành động. Có 3 component đã code sẵn nhưng không render. RFC này chốt cách kết nối Overview với phần còn lại của app.

## Motivation

- User vào Overview, ngắm biểu đồ, rồi phải tự tìm đường qua sidebar
- `GoalCard`, `NextActionCard`, `OnboardingBanner` đã code xong nhưng không import ở đâu
- `StatGrid` hiện 4 stat cards không bấm được (ví dụ "Kỹ năng yếu: Writing" không link đến luyện Writing)
- `LearningPathView` (tab Lộ trình) hiện skill plan chi tiết nhưng không có nút "Bắt đầu luyện"
- `SpiderChartCard`, `DoughnutChartCard` không có interaction

## Changes

### 1. Render `OnboardingBanner` khi chưa có onboarding data

File: `_app.overview.tsx` → `OverviewContent`

```tsx
{!levelTrack && <OnboardingBanner onStart={onStartOnboarding} />}
```

Hiện trước `ProfileBanner` khi `loadOnboardingData()` trả về `null`.

### 2. Render `NextActionCard` trong tab Tổng quan

File: `_app.overview.tsx` → `DetailsView`

Thêm `NextActionCard` ngay sau `StatGrid`, trước `ActivityHeatmap`. Data đã có sẵn trong `MOCK_OVERVIEW.nextAction`.

```tsx
<NextActionCard action={data.nextAction} />
```

### 3. Render `GoalCard` trong tab Tổng quan

File: `_app.overview.tsx` → `DetailsView`

Thêm `GoalCard` sau `ExamCountdown` (hoặc thay thế nếu trùng chức năng). Data đã có sẵn trong `data.goal`.

```tsx
<GoalCard goal={data.goal} />
```

### 4. Thêm link "Bắt đầu luyện" vào `LearningPathView` skill cards

File: `_app.overview/-components/LearningPathView.tsx` → `SkillPlanCard`

Thêm CTA button cuối mỗi skill card:

```tsx
<Link to="/luyen-tap/ky-nang" search={{ skill: SKILL_TO_SLUG[plan.skill], category: "", page: 1 }}>
  Luyện {info.label} →
</Link>
```

Mapping: `listening→nghe`, `reading→doc`, `writing→viet`, `speaking→noi`.

### 5. Làm `StatGrid` items clickable

File: `_app.overview/-components/StatGrid.tsx`

Wrap mỗi stat card trong `<Link>`:
- "Kỹ năng yếu: Writing" → `/luyen-tap/ky-nang?skill=viet`
- "Tổng bài test" → `/thi-thu`
- "Band còn thiếu" / "Xu hướng" → không link (informational)

### 6. Sau onboarding complete → scroll đến `NextActionCard`

File: `_app.overview.tsx` → `handleOnboardingComplete`

Sau `setShowOnboarding(false)`, scroll đến NextActionCard hoặc đơn giản hơn: navigate đến `/luyen-tap`.

## Implementation status

- [ ] Render `OnboardingBanner` conditionally
- [ ] Render `NextActionCard` in DetailsView
- [ ] Render `GoalCard` in DetailsView
- [ ] Add CTA links to `LearningPathView` skill cards
- [ ] Make `StatGrid` items clickable where applicable
- [ ] Post-onboarding action (scroll or navigate)
