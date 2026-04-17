# RFC 0005 — Coin & Streak Loop

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |

## Summary

Coin/Streak hiện diện trên header nhưng user không hiểu cách hoạt động. Cần popover giải thích + daily reward + simplify StreakDialog theo Duolingo (RFC 0000).

## Changes

### 1. CoinButton popover

Bấm → popover:
- Số xu hiện tại
- "Xu dùng để mở đề thi thử (8–25 xu/đề)"
- "Cách kiếm xu: Giữ streak liên tục"
- Link "Xem streak →"

### 2. StreakButton popover → thêm milestone preview

Thêm: "Mốc tiếp theo: X ngày → +Y xu" + nút "Xem phần thưởng"

### 3. StreakDialog — simplify theo Duolingo

Theo RFC 0000: chỉ 2 hue (streak orange + neutral).

- Streak number: `text-skill-speaking` — giữ
- Progress bar: `bg-primary` solid, không gradient
- Milestones: `bg-muted/50` cards, claimed = `opacity-60` + check
- **Bỏ**: emerald/amber/slate gradients, multi-hue borders

### 4. Daily coin reward

Khi `recordPracticeCompletion()` → `reachedGoal: true`:
- `refundCoins(10)`
- Toast: "+10 xu — Hoàn thành mục tiêu hôm nay!"

## Files

| File | Change |
|---|---|
| `CoinButton.tsx` | Add popover |
| `StreakButton.tsx` | Add milestone preview |
| `StreakDialog.tsx` | Simplify colors theo Duolingo |
| `streak-rewards.ts` | Add `refundCoins(10)` on daily goal |

## Checklist

- [ ] CoinButton popover
- [ ] StreakButton milestone preview
- [ ] StreakDialog color simplification
- [ ] Daily coin reward
