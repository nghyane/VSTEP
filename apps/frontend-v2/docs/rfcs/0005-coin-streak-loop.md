# RFC 0005 — Coin & Streak Loop

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |
| Superseded by | — |

## Summary

Hệ thống Coin và Streak hiện diện trên header (CoinButton, StreakButton) nhưng user không hiểu chúng hoạt động thế nào. Coin chỉ tốn (thi thử) mà gần như không kiếm được. Streak chỉ đếm ở 3/7 loại bài. RFC này chốt cách làm cho coin/streak loop rõ ràng trên UI.

## Motivation

- `CoinButton` hiện số xu, bấm vào không có gì — user không biết xu dùng để làm gì, kiếm ở đâu
- `StreakButton` popover hiện streak + tuần học — nhưng không link đến StreakDialog (nơi claim xu milestone)
- Streak milestones (7/14/30 ngày) là one-time rewards, claim xong hết — không có vòng lặp
- Luyện tập 4 kỹ năng + nền tảng hoàn toàn không ảnh hưởng coin/streak trên UI

## Changes

### 1. CoinButton popover — giải thích coin economy

Bấm `CoinButton` → hiện popover (giống StreakButton):
- Số xu hiện tại
- "Xu dùng để mở đề thi thử (8–25 xu/đề)"
- "Cách kiếm xu: Giữ streak liên tục"
- Link "Xem streak →" mở StreakDialog hoặc navigate đến Overview

### 2. StreakButton popover → thêm link đến milestones

Popover hiện tại đã hiện streak + tuần học. Thêm:
- Dòng "Mốc tiếp theo: X ngày → +Y xu" (nếu còn milestone chưa claim)
- Nút "Xem phần thưởng" → mở StreakDialog (hiện chỉ mở được từ ExamCountdown)

### 3. Daily coin reward (mock)

**Cập nhật 2026-04-18:** Streak chỉ tính từ luồng thi thử (phong-thi). Luyện tập không tính.

Thêm cơ chế mock: khi `recordPracticeCompletion()` trả về `reachedGoal: true` (đạt 3 đề thi thử/ngày):
- `refundCoins(10)` — thưởng 10 xu
- Toast: "+10 xu — Hoàn thành mục tiêu hôm nay!"

Đây là vòng lặp bền vững: thi thử hàng ngày → giữ streak → nhận thưởng xu → dùng xu mở đề mới.

### 4. Hiện coin reward trên session completion

Khi user hoàn thành bài và nhận xu (daily goal), hiện inline badge trên footer/result page:
```
🪙 +10 xu
```

Không cần phức tạp — chỉ cần toast từ sonner là đủ cho mock.

## Scope note

Đây là mock UI/UX — không cần backend. Tất cả state lưu localStorage. Mục tiêu là user **nhìn thấy** vòng lặp coin/streak hoạt động khi tương tác với app.

## Files affected

| File | Change |
|---|---|
| `CoinButton.tsx` | Add popover with coin explanation |
| `StreakButton.tsx` | Add milestone preview + link to StreakDialog |
| `streak-rewards.ts` → `recordPracticeCompletion()` | Add `refundCoins(10)` when daily goal reached |

## Implementation status

- [ ] CoinButton popover
- [ ] StreakButton milestone preview
- [ ] Daily coin reward in `recordPracticeCompletion()`
- [ ] Verify toast shows on daily goal completion
