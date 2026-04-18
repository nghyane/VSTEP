# RFC 0005 — Coin & Streak Loop

| Field | Value |
|---|---|
| Status | Accepted |
| Created | 2025-07-14 |
| Updated | 2026-04-17 |

## Summary

Coin/Streak hiện diện trên header nhưng user không hiểu cách hoạt động. Cần popover giải thích + daily reward + simplify StreakDialog theo Duolingo (RFC 0000).

**Cập nhật 2026-04-17:** Đã build xong phần lõi (coin store, cost enforcement, top-up dialog, streak dialog, notifications, daily goal). Popover giải thích trên `CoinButton` bị bỏ — thay bằng mở thẳng `TopUpDialog` (action-first thay vì giải thích). `StreakButton` popover vẫn chưa có milestone preview.

## Changes

### 1. ~~CoinButton popover~~ → TopUpDialog

**Thay đổi hướng:** thay vì popover giải thích, `CoinButton` click → mở `TopUpDialog` (4 gói: Khởi đầu 100xu/30k, Cơ bản 320xu/90k, Phổ biến 800xu/210k, Tiết kiệm 1800xu/450k).

`BottomActionBar` (thi-thu detail) và `DeviceCheckScreen` (phòng thi) cũng mở `TopUpDialog` khi insufficient xu, kèm silver empty state (coin=0).

Giải thích cách dùng xu đã chuyển sang:
- `ExamCard` hiển thị badge `{FULL_TEST_COST} xu` ngay trên card.
- `BottomActionBar` tính `computeSessionCost(selectedSkills)` = 8 xu/kỹ năng, cap 25 xu.

### 2. StreakButton popover → thêm milestone preview

**Chưa làm.** Hiện tại `StreakButton` popover hiển thị: số streak + week view (T2→CN) kiểu Duolingo. Milestone preview nằm trong `StreakDialog` thay vì popover.

Cân nhắc: có cần thêm vào popover nữa không, hay keep popover gọn và push vào dialog?

### 3. StreakDialog — simplify theo Duolingo ✅

Đã build từ đầu theo Duolingo pattern trong commit `4dca107` và mở rộng trong `77939ac`:
- Fire icon + số streak (orange `skill-speaking`)
- Progress bar hôm nay: `rawToday / DAILY_GOAL` (3 đề thi thử/ngày)
- Milestone cards (7/14/30 ngày → 100/250/500 xu), claimed = check + disabled

Source: `src/routes/_app.overview/-components/StreakDialog.tsx`

### 4. Daily coin reward

**Hướng đã đổi.** Không `refundCoins(10)` mỗi ngày vì conflict với cost-based economy.

Thay vào đó, reward gắn vào milestone streak (7/14/30 ngày = 100/250/500 xu) qua `claimMilestone()` trong `streak-rewards.ts`. Khi đạt `DAILY_GOAL`:
- Push notification "Đã giữ streak hôm nay (3/3 đề thi thử)"
- Bỏ toast redundant (notification đã cover)

### 5. [Mới] Coin store + cost enforcement

Commit `f6bc0fe`. `src/lib/coins/coin-store.ts`:
- `useCoins()` — useSyncExternalStore + localStorage persist (`vstep:coins:v1`)
- `spendCoins(n)` / `refundCoins(n)`
- `computeSessionCost(skills)` — 8 xu/kỹ năng, cap 25 xu = full test
- Initial balance: 100 xu

Enforcement tại: `phong-thi/index.tsx:217` (spend trước khi start session), `BottomActionBar` (disable CTA nếu xu < cost).

### 6. [Mới] Notifications system

Commit `77939ac`. `src/lib/notifications/store.ts`:
- `pushNotification({ id, title, body, iconKey })` — dedup theo id (idempotent)
- Icon keys: `fire` | `coin` | `trophy`
- `NotificationButton` component → popover với list notifications, relative time, mark-read on open

Notifications emitted khi:
- Daily goal reached (3/3 đề thi thử)
- Milestone unlocked (streak chạm 7/14/30 ngày)
- Milestone claimed (nhận xu)
- Top-up thành công

## Files

| File | Change | Status |
|---|---|---|
| `CoinButton.tsx` | Click → TopUpDialog (không popover giải thích) | ✅ |
| `CoinIcon.tsx`, `AnimatedCoinIcon.tsx` | Icon xu asset + Lottie hover | ✅ |
| `TopUpDialog.tsx` | Dialog nạp xu 4 pack tiers + empty state | ✅ |
| `coin-store.ts` | Module-level store + spend/refund/cost policy | ✅ |
| `StreakButton.tsx` | Popover week view Duolingo-style | ✅ (milestone preview chưa có) |
| `StreakDialog.tsx` | Simplify colors + daily progress + milestones | ✅ |
| `streak-rewards.ts` | Milestones, claim, today progress, notifications | ✅ |
| `notifications/store.ts` | Dedup store + persist | ✅ |
| `NotificationButton.tsx` | Popover list | ✅ |
| `ExamCard.tsx`, `BottomActionBar.tsx` | Hiển thị cost + enforce balance | ✅ |
| `DeviceCheckScreen.tsx` | Top-up khi insufficient xu | ✅ |

## Checklist

- [x] Coin store + cost policy (`computeSessionCost`, `FULL_TEST_COST = 25`)
- [x] TopUpDialog (4 packs, silver empty state khi coins=0)
- [x] Enforce coin cost trước khi start phong-thi
- [x] Replace pro/free tag bằng xu badge trên thi-thu
- [x] StreakDialog Duolingo-style (progress bar + milestones)
- [x] Milestone claim → refund xu + notification
- [x] Daily goal notification (3 đề thi thử)
- [x] NotificationButton popover
- [ ] StreakButton popover: thêm "Mốc tiếp theo: X ngày → +Y xu" preview
- [ ] Quyết định: giữ CoinButton click → TopUp, hay thêm popover giải thích xu là gì
