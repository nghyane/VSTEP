# RFC: Text Selection Popup cho bài đọc (Reading)

## Problem

Khi luyện đọc, user gặp từ/cụm từ không hiểu nhưng không có cách nhanh để tra nghĩa ngay tại chỗ. Phải tự mở tab mới tra từ điển hoặc bấm "Hỏi AI" rồi gõ lại đoạn text — gián đoạn flow đọc.

## Goals

1. Khi user tô đen (select) text trong PassagePanel, hiện popup ngay tại vị trí selection
2. Popup hiện: bản dịch tiếng Việt (mock) + nút "Hỏi AI" + nút "Lưu từ vựng"
3. Popup tự đóng khi click ra ngoài hoặc bỏ selection
4. Hoạt động trên cả desktop (mouse) và mobile (long press select)

## Non-goals

- Không tích hợp API dịch thật (dùng mock, thay sau)
- Không build hệ thống từ vựng cá nhân đầy đủ (nút "Lưu" chỉ toast placeholder)
- Không hỗ trợ select text ở phần câu hỏi (chỉ PassagePanel)
- Không thay đổi data model hay routing

## Proposed solution

### Component: `TextSelectionPopup`

Shared component đặt trong `components/practice/`, dùng `window.getSelection()` API.

```
┌──────────────────────────────┐
│  "make a difference"         │  ← text đã chọn (truncate nếu dài)
│                              │
│  📖 Tạo ra sự khác biệt     │  ← bản dịch mock
│                              │
│  [💬 Hỏi AI]  [📌 Lưu từ]   │  ← action buttons
└──────────────────────────────┘
        ▼ (arrow pointing to selection)
```

### Positioning

- Dùng `selection.getRangeAt(0).getBoundingClientRect()` để lấy vị trí selection
- Popup hiện phía trên selection (hoặc dưới nếu không đủ chỗ)
- Absolute positioned relative to viewport, dùng portal (createPortal to body)

### Translation mock

```ts
function mockTranslate(text: string): string {
  // Hardcode một số từ/cụm phổ biến
  // Fallback: "Bấm 'Hỏi AI' để xem nghĩa chi tiết"
}
```

Sau này thay bằng API call (Google Translate / OpenAI).

### Integration

- Wrap nội dung PassagePanel trong `<TextSelectionPopup>`
- Listen `mouseup` / `touchend` event trên container
- Check `window.getSelection().toString().trim()` có text không
- Nếu có → hiện popup tại vị trí selection
- Click ngoài / selection thay đổi → đóng popup

### Hỏi AI integration

- Dùng `askExplainQuestion` từ `lib/ai-chat/store` (đã có)
- Prefill message: "Giải thích nghĩa của: '{selected text}' trong ngữ cảnh bài đọc"

## Alternatives considered

1. **Tooltip đơn giản chỉ dịch** — quá hạn chế, không có action
2. **Context menu (right click)** — không tự nhiên, mobile không hỗ trợ
3. **Sidebar từ điển** — chiếm không gian, phải scroll qua lại
4. **Highlight + annotation** — phức tạp hơn nhiều, cần persistence

## Risks / trade-offs

- `window.getSelection()` behavior khác nhau giữa browsers — cần test Chrome/Firefox/Safari
- Mobile selection UX khác desktop — native selection handles có thể conflict với popup
- Popup positioning edge cases: selection gần mép trên/dưới viewport
- Mock translation không chính xác — cần disclaimer rõ ràng

## Rollout plan

1. Phase 1: `TextSelectionPopup` component + mock translate + "Hỏi AI" button
2. Phase 2: "Lưu từ vựng" khi có vocabulary module
3. Phase 3: Thay mock translate bằng API thật

## Implementation plan

### Files affected

- `components/practice/TextSelectionPopup.tsx` — NEW, shared component
- `lib/practice/mock-translate.ts` — NEW, mock translation
- `routes/.../PassagePanel.tsx` — wrap content với popup
- `lib/ai-chat/store.ts` — có thể thêm helper mới cho context-aware question

### Tasks

1. Tạo `mock-translate.ts` — map từ phổ biến + fallback
2. Tạo `TextSelectionPopup.tsx` — selection listener + popup UI + positioning
3. Tích hợp vào `PassagePanel` — wrap passage content
4. Wire "Hỏi AI" button với AI chat store
5. "Lưu từ" button — toast placeholder

### Definition of Done

- [x] tsc pass
- [x] Popup hiện khi select text trong bài đọc
- [x] Popup đóng khi click ngoài / bỏ selection
- [x] "Hỏi AI" mở chat dock với context
- [x] Mobile: popup hiện sau long-press select
- [x] Dark mode render đúng
- [x] Keyboard: Escape đóng popup
