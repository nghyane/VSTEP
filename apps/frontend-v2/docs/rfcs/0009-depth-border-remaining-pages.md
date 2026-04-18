# RFC 0009 — Apply Depth Border Toàn Bộ Remaining Pages

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |
| Depends on | [0002 — Design System v3](./0002-design-system.md), [0008 — Redesign 4 Skills](./0008-redesign-4-skills-flow.md) |

## Summary

RFC 0008 đã apply depth border + skill design cho luồng 4 kỹ năng. RFC này mở rộng pattern tương tự cho **tất cả trang còn lại**: Overview, Thi thử, Phòng thi, Khóa học, Nền tảng (ngữ pháp + từ vựng), Landing page, App layout.

## Scope — Files cần update

### A — Overview (`/overview`) — 12 files

| File | Violations |
|---|---|
| `ProfileBanner.tsx` | Gradient bg, hardcoded |
| `StatGrid.tsx` | `rounded-xl` cards flat |
| `DoughnutChartCard.tsx` | `bg-muted/50 shadow-sm` → depth border |
| `SpiderChartCard.tsx` | same |
| `GoalCard.tsx` | `bg-muted/50 shadow-sm` → depth border |
| `NextActionCard.tsx` | `border bg-card` flat |
| `LearningPathView.tsx` | `bg-muted/50 shadow-sm` → depth border |
| `PracticeTrackView.tsx` | `bg-muted/50 shadow-sm` → depth border |
| `PracticeTrackParts.tsx` | same |
| `ActivityHeatmap.tsx` | `bg-muted/50 shadow-sm` → depth border |
| `ExamCountdown.tsx` | `border-border bg-muted/50` → depth border |
| `StreakDialog.tsx` | Dialog cards flat |

### B — Thi thử (`/thi-thu`) — 5 files

| File | Violations |
|---|---|
| `ExamCard.tsx` | ĐÃ DONE (RFC 0008) |
| `ExamSidebarFilters.tsx` | Sidebar flat |
| `BottomActionBar.tsx` | Footer flat |
| `ExamDetailHeader.tsx` | Header card flat |
| `SectionSelector.tsx` | Selection cards flat |
| `_app.thi-thu.$examId/index.tsx` | Page cards flat |

### C — Phòng thi (`/phong-thi`) — 10 files

| File | Violations |
|---|---|
| `DeviceCheckScreen.tsx` | Cards flat |
| `ListeningExamPanel.tsx` | Cards flat |
| `ReadingExamPanel.tsx` | Cards flat |
| `WritingExamPanel.tsx` | Cards flat |
| `SpeakingExamPanel.tsx` | Cards flat |
| `KetQuaCard.tsx` | Result cards flat |
| `ChiTietCard.tsx` | Detail cards flat |
| `PerformanceTable.tsx` | Table card flat |
| `phong-thi.ket-qua.tsx` | Page layout flat |
| `phong-thi.chi-tiet.tsx` | Page layout flat |

### D — Khóa học (`/khoa-hoc`) — 7 files

| File | Violations |
|---|---|
| `CourseCard.tsx` | `border bg-card shadow-sm` → depth border |
| `MyCourseCard.tsx` | same |
| `CommitmentCard.tsx` | `border shadow-sm` → depth border |
| `CoursePurchaseDialog.tsx` | `bg-muted/50` cards flat |
| `CourseSchedule.tsx` | `bg-muted/50 shadow-sm` → depth border |
| `CourseDetailPanels.tsx` | `bg-muted/50` → depth border |
| `khoa-hoc.index.tsx` | Tab bar flat |

### E — Nền tảng (`/luyen-tap/nen-tang`) — 6 files

| File | Violations |
|---|---|
| `ngu-phap/index.tsx` | Tab bar muted, cards flat |
| `ngu-phap/TheoryView.tsx` | `border bg-card shadow-sm` → depth |
| `ngu-phap/GrammarExerciseCards.tsx` | ĐÃ DONE (RFC 0008) |
| `ngu-phap/PracticeSession.tsx` | ĐÃ DONE |
| `tu-vung/FlashcardSession.tsx` | ĐÃ DONE |
| `tu-vung/VocabPracticeSession.tsx` | ĐÃ DONE |
| `tu-vung.index.tsx` | Cards flat |
| `_app.luyen-tap.index.tsx` | Hub cards flat |
| `_app.luyen-tap.nen-tang.index.tsx` | Hub cards flat |

### F — App layout + Landing — 4 files

| File | Violations |
|---|---|
| `_app.tsx` | Sidebar flat |
| `LandingPage.tsx` | Cards flat (landing exception cho palette — chỉ fix depth border) |
| `BentoFeaturesSection.tsx` | `border bg-card` → depth |
| `OnboardingBanner.tsx` | ĐÃ DONE |

## Pattern áp dụng

### Card → Depth border

```
BEFORE: rounded-2xl border bg-card p-5 shadow-sm
AFTER:  rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5
```

### Muted card → Depth border

```
BEFORE: rounded-2xl bg-muted/50 p-5 shadow-sm
AFTER:  rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5
```

### Small info card

```
BEFORE: rounded-xl bg-muted/50 p-3
AFTER:  rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-3
```

### Footer

```
BEFORE: border-t bg-background
AFTER:  border-t border-t-border bg-background
```

### Tab bar (pill toggle)

```
BEFORE: rounded-xl bg-muted p-1 + active bg-card shadow-sm
AFTER:  rounded-lg border-2 border-b-4 depth + active bg-primary text-white
```

## Implementation plan

### Phase A — Overview (1 PR)
Update tất cả 12 components trong `_app.overview/-components/`.

### Phase B — Thi thử (1 PR)
Update sidebar, detail page, bottom action bar.

### Phase C — Phòng thi (1 PR)
Update tất cả exam panels + result pages.

### Phase D — Khóa học (1 PR)
Update course cards, schedule, purchase dialog, detail panels.

### Phase E — Nền tảng (1 PR)
Update grammar + vocabulary hub pages, theory view.

### Phase F — App layout + Landing (1 PR)
Update app sidebar, landing cards. Landing page giữ own palette nhưng thêm depth border.

### Phase G — Sweep + Polish (1 PR)
Grep toàn bộ codebase cho pattern cũ (`rounded-2xl border bg-card`, `bg-muted/50 p-5 shadow-sm`). Fix remaining. Final verification.

## Acceptance criteria (mỗi PR)

- [ ] `tsc --noEmit` pass
- [ ] `biome check` không tăng errors
- [ ] `bun run build` pass
- [ ] Zero `rounded-2xl border bg-card` (flat) còn lại trong scope
- [ ] Zero `bg-muted/50 shadow-sm` card pattern còn lại
- [ ] Tất cả interactive cards có depth border (`border-2 border-b-4`)
- [ ] Tất cả buttons dùng `<Button>` component (không tự viết class)

## Implementation status

- [ ] Phase A — Overview
- [ ] Phase B — Thi thử
- [ ] Phase C — Phòng thi
- [ ] Phase D — Khóa học
- [ ] Phase E — Nền tảng
- [ ] Phase F — App layout + Landing
- [ ] Phase G — Sweep + Polish
