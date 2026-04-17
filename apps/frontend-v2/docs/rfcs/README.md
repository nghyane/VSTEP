# RFCs

| # | Title | Status | Priority |
|---|---|---|---|
| 0001 | [Design Token Consistency](./0001-design-token-consistency.md) | Draft | P0 — nền tảng, sửa trước |
| 0002 | [Layout & Spacing Consistency](./0002-layout-spacing-consistency.md) | Draft | P0 — nền tảng, sửa trước |
| 0003 | [Overview Actionability](./0003-overview-actionability.md) | Draft | P1 — flow chính |
| 0004 | [Session Completion Flow](./0004-session-completion-flow.md) | Draft | P1 — flow chính |
| 0005 | [Coin & Streak Loop](./0005-coin-streak-loop.md) | Draft | P2 — polish |

## Thứ tự implement đề xuất

1. **0001 + 0002** (song song): Sửa nền tảng visual — token + layout. Không ảnh hưởng logic.
2. **0003**: Kết nối Overview với phần còn lại — render components đã có sẵn.
3. **0004**: Hoàn thiện flow sau khi hoàn thành bài — thêm "bài tiếp theo" + streak tracking.
4. **0005**: Polish coin/streak loop — thêm popover + daily reward.
