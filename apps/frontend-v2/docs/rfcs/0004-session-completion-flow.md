# RFC 0004 — Session Completion Flow

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |
| Superseded by | — |

## Summary

Mọi session luyện tập hiện kết thúc bằng dead-end: hiện score rồi chỉ có nút "Về danh sách". Không có gợi ý bài tiếp, không có celebration, không có link về Overview. RFC này chốt flow sau khi hoàn thành bài.

## Motivation

- User hoàn thành bài → chỉ thấy "Về danh sách đề" → phải tự chọn bài tiếp
- Không có celebration moment (confetti, badge, streak update visible)
- Không có "Bài tiếp theo" / "Bài tương tự"
- Không có link "Xem tiến độ" về Overview
- Kết quả bài làm không tích lũy vào đâu (chấp nhận vì mock, nhưng UI nên thể hiện flow)

## Changes

### 1. Thêm "Bài tiếp theo" vào footer sau submit

Áp dụng cho tất cả session types:

**Nghe/Đọc** (inline result): Footer sau submit thêm nút "Bài tiếp theo →" bên cạnh "Về danh sách".

**Viết/Nói** (trang kết quả riêng): Footer thêm nút "Bài tiếp theo →" bên cạnh "Về danh sách đề viết/nói".

**Thi thử** (trang kết quả): Nút "Làm đề khác" bên cạnh "Hoàn thành".

Logic "bài tiếp theo": Lấy exercise list từ cùng category, tìm exercise tiếp theo theo thứ tự. Nếu là bài cuối → hiện "Hoàn thành tất cả" thay vì "Bài tiếp theo".

### 2. Thêm link "Xem tiến độ" về Overview

Ở mọi trang kết quả, thêm link secondary:

```tsx
<Link to="/overview" search={{ tab: "overview" }} className="text-sm text-muted-foreground ...">
  Xem tiến độ tổng quan
</Link>
```

### 3. Streak toast sau submit

Hiện tại `recordPracticeCompletion()` đã push notification khi đạt daily goal, nhưng:
- Chỉ gọi ở Viết, Nói, Thi thử — **thiếu Nghe, Đọc, Ngữ pháp, Từ vựng**
- Toast hiện qua notification system, không phải inline celebration

Thêm `recordPracticeCompletion()` vào:
- `_app.luyen-tap.ky-nang.nghe.$exerciseId/-components/SessionView.tsx` → trong submit handler
- `_app.luyen-tap.ky-nang.doc.$exerciseId/-components/SessionView.tsx` → trong submit handler
- `_app.luyen-tap.nen-tang.ngu-phap.$pointId/-components/PracticeSession.tsx` → khi result != null
- `_app.luyen-tap.nen-tang.tu-vung.$topicId.tsx` → khi hoàn thành flashcard queue

### 4. Back navigation từ kết quả

Hiện tại trang kết quả Viết/Nói back về "Danh sách đề" (skip session page). Đây là OK vì user đã submit xong, không cần quay lại session. Giữ nguyên.

## Files affected

| File | Change |
|---|---|
| `ky-nang/nghe/$exerciseId/-components/SessionView.tsx` | Add "Bài tiếp theo" + `recordPracticeCompletion` |
| `ky-nang/doc/$exerciseId/-components/SessionView.tsx` | Add "Bài tiếp theo" + `recordPracticeCompletion` |
| `ky-nang/viet/$exerciseId/ket-qua.tsx` | Add "Bài tiếp theo" + "Xem tiến độ" |
| `ky-nang/noi/$exerciseId/ket-qua.tsx` | Add "Bài tiếp theo" + "Xem tiến độ" |
| `_focused.phong-thi.$examId.ket-qua.tsx` | Add "Làm đề khác" + "Xem tiến độ" |
| `nen-tang/ngu-phap/$pointId/-components/PracticeSession.tsx` | Add `recordPracticeCompletion` |
| `nen-tang/tu-vung/$topicId.tsx` | Add `recordPracticeCompletion` |
| `McqSubmitBar.tsx` | Extend props to accept optional `nextHref` |

## Implementation status

- [ ] Add `recordPracticeCompletion()` to Nghe, Đọc, Ngữ pháp, Từ vựng sessions
- [ ] Add "Bài tiếp theo" to MCQ session footer (Nghe/Đọc)
- [ ] Add "Bài tiếp theo" to Viết/Nói result pages
- [ ] Add "Làm đề khác" to Thi thử result page
- [ ] Add "Xem tiến độ" link to all result pages
