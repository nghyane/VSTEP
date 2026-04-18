# RFC 0004 — Session Completion Flow

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2026-04-17 |

## Summary

Mọi session kết thúc bằng dead-end. Cần: "Bài tiếp theo", link về Overview, và Lesson Complete screen theo Duolingo pattern (RFC 0000).

**Cập nhật 2026-04-17:** Nghe/Đọc đã có `McqResultSummary` (score circle) từ commit `392039d` (4/16), nhưng chưa refactor sang Duolingo 3-stat-card. `recordPracticeCompletion` từng được wire vào luyện tập (commit `77939ac` 4/17) nhưng **đã revert** sang "chỉ đếm phong-thi" trong commit `69225bf` (4/18) — xem RFC 0005. Nghĩa là luyện tập không còn drive streak → item 4 RFC này cần re-thinking.

## Changes

### 1. Lesson Complete screen (Duolingo pattern)

**Chưa làm.** Hiện `McqResultSummary` vẫn là score circle + label (Xuất sắc / Khá ổn / Cần ôn lại).

Thay bằng Duolingo-style 3 stat cards:

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

**Cân nhắc mới:** Writing đã redesign Zen Focus (commit `44f2fec`) với sticker annotations — phải check xem result screen Writing có xung đột style không.

### 2. "Bài tiếp theo" button

**Chưa làm.** Tất cả session footers vẫn dừng ở "Về danh sách đề".

Tất cả session footers thêm nút "Bài tiếp theo →" (primary CTA, Duolingo-style `border-b-4`).

Logic: exercise tiếp theo trong cùng category. Bài cuối → "Hoàn thành tất cả".

### 3. Link "Xem tiến độ" về Overview

**Chưa làm.** Mọi trang kết quả thêm link secondary: `Xem tiến độ tổng quan`.

### 4. ~~`recordPracticeCompletion()` mở rộng~~ → Re-design

**Hướng đã đổi.** Quyết định mới: streak chỉ đếm từ đề thi thử (3 đề/ngày = daily goal). Luyện tập KHÔNG tính streak (xem comment trong `streak-rewards.ts:105`).

Lý do: tránh user spam mini-session để giữ streak, ưu tiên chất lượng bài thi hoàn chỉnh.

**Hệ quả cho RFC này:** cần tách biệt "ghi nhận hoàn thành" (cho session summary / analytics) khỏi "drive streak". Có thể cần `recordSessionComplete(skill, exerciseId)` riêng cho tracking, không touch streak.

## Files

| File | Change | Status |
|---|---|---|
| `McqResultSummary.tsx` | Refactor → Duolingo 3-stat-card pattern | ⏳ |
| `nghe/SessionView.tsx` | + "Bài tiếp theo" + "Xem tiến độ" | ⏳ |
| `doc/SessionView.tsx` | + "Bài tiếp theo" + "Xem tiến độ" | ⏳ |
| `viet/ket-qua.tsx` | + "Bài tiếp theo" + "Xem tiến độ" | ⏳ |
| `noi/ket-qua.tsx` | + "Bài tiếp theo" + "Xem tiến độ" | ⏳ |
| `phong-thi/ket-qua.tsx` | + "Làm đề khác" + "Xem tiến độ" | ⏳ |
| ~~`ngu-phap/PracticeSession.tsx`~~ | ~~+ `recordPracticeCompletion`~~ | ❌ bỏ (không drive streak) |
| ~~`tu-vung/$topicId.tsx`~~ | ~~+ `recordPracticeCompletion`~~ | ❌ bỏ (không drive streak) |

## Checklist

- [ ] Duolingo-style Lesson Complete component (3 stat cards)
- [ ] "Bài tiếp theo" in all session footers
- [ ] "Xem tiến độ" link in all result pages
- [ ] Tách riêng API `recordSessionComplete` cho analytics (không touch streak)
