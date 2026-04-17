# RFC 0004 — Session Completion Flow

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |

## Summary

Mọi session kết thúc bằng dead-end. Cần: "Bài tiếp theo", link về Overview, và Lesson Complete screen theo Duolingo pattern (RFC 0000).

## Changes

### 1. Lesson Complete screen (Duolingo pattern)

Thay `McqResultSummary` (score circle) bằng Duolingo-style 3 stat cards:

```
┌─────────────────────────────────────┐
│          "Hoàn thành!"              │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ Điểm │  │Thời  │  │Chính │      │
│  │ 8/10 │  │ 5:20 │  │ 80%  │      │
│  └──────┘  └──────┘  └──────┘      │
│  primary    muted     success       │
│                                     │
│  [Xem lại bài]      [Tiếp tục →]   │
└─────────────────────────────────────┘
```

Mỗi stat card: `border-2 border-{color}` header + `bg-card text-{color}` body.

Áp dụng cho: Nghe/Đọc (inline sau submit), Viết/Nói (trang kết quả).

### 2. "Bài tiếp theo" button

Tất cả session footers thêm nút "Bài tiếp theo →" (primary CTA, Duolingo-style `border-b-4`).

Logic: exercise tiếp theo trong cùng category. Bài cuối → "Hoàn thành tất cả".

### 3. Link "Xem tiến độ" về Overview

Mọi trang kết quả thêm link secondary: `Xem tiến độ tổng quan`

### 4. `recordPracticeCompletion()` — mở rộng

Thêm vào: Nghe, Đọc, Ngữ pháp, Từ vựng sessions (hiện chỉ có Viết, Nói, Thi thử).

## Files

| File | Change |
|---|---|
| `McqResultSummary.tsx` | Refactor → Duolingo 3-stat-card pattern |
| `nghe/SessionView.tsx` | + "Bài tiếp theo" + `recordPracticeCompletion` |
| `doc/SessionView.tsx` | + "Bài tiếp theo" + `recordPracticeCompletion` |
| `viet/ket-qua.tsx` | + "Bài tiếp theo" + "Xem tiến độ" |
| `noi/ket-qua.tsx` | + "Bài tiếp theo" + "Xem tiến độ" |
| `phong-thi/ket-qua.tsx` | + "Làm đề khác" + "Xem tiến độ" |
| `ngu-phap/PracticeSession.tsx` | + `recordPracticeCompletion` |
| `tu-vung/$topicId.tsx` | + `recordPracticeCompletion` |

## Checklist

- [ ] Duolingo-style Lesson Complete component
- [ ] "Bài tiếp theo" in all session footers
- [ ] "Xem tiến độ" link in all result pages
- [ ] `recordPracticeCompletion()` in Nghe, Đọc, Ngữ pháp, Từ vựng
