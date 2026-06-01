# RFC: Word Hover Tooltip cho bài đọc (Reading)

## Problem

User đọc bài tiếng Anh, gặp từ không biết nhưng phải tô đen mới tra được. Cần cách nhanh hơn — chỉ cần di chuột vào (hover) hoặc click vào từ là thấy ngay nghĩa, phát âm, loại từ.

## Goals

1. Mỗi từ trong bài đọc là một element có thể hover/click
2. Hover (desktop) hoặc tap (mobile): hiện tooltip nhỏ ngay tại từ đó
3. Tooltip hiện: từ gốc, phiên âm IPA, loại từ (noun/verb/adj...), nghĩa tiếng Việt
4. Nút phát âm (Web Speech API) trong tooltip
5. Không ảnh hưởng text selection popup đã có (2 tính năng cùng tồn tại)

## Non-goals

- Không build từ điển đầy đủ (dùng mock dictionary, thay API sau)
- Không lưu lịch sử tra từ
- Không highlight cụm từ tự động (chỉ từ đơn khi hover)

## Proposed solution

### Data: Mock word dictionary

```ts
interface WordEntry {
  word: string
  ipa: string           // "/ˈbek.ər.i/"
  pos: string           // "noun", "verb", "adjective"...
  meaning: string       // nghĩa tiếng Việt
}
```

Mock ~100 từ phổ biến trong các bài đọc. Fallback: không hiện tooltip nếu từ không có trong dictionary (từ phổ thông như "the", "is", "a" không cần tooltip).

### Component: `WordTooltip`

Wrap mỗi paragraph — split text thành từng từ, mỗi từ là `<span>` có hover handler.

```
         ┌─────────────────────┐
         │  bakery  /ˈbeɪ.kər.i/ │
         │  noun · tiệm bánh    │
         │  🔊                   │
         └─────────────────────┘
              ▼
  ...next to a bakery. Thank you...
              ^^^^^^^
```

### Interaction

- Desktop: hover vào từ → tooltip hiện sau 300ms delay (tránh flicker). Rời chuột → ẩn.
- Mobile: tap vào từ → tooltip hiện. Tap ngoài → ẩn.
- Tooltip không chặn text selection — nếu user bắt đầu drag để select, tooltip ẩn.

### Integration với TextSelectionPopup

- `TextSelectionPopup` vẫn wrap bên ngoài
- Bên trong, passage text được render qua `InteractivePassage` component
- Khi user đang select text (mousedown + drag), word tooltip bị disable
- Khi user click 1 từ (không drag), word tooltip hiện

## Alternatives considered

1. **Click-only, không hover** — đơn giản hơn nhưng kém tiện trên desktop
2. **Tooltip cho cụm từ** — phức tạp (phải detect phrase boundaries), để sau
3. **Sidebar dictionary** — chiếm không gian, gián đoạn flow đọc

## Risks / trade-offs

- Render mỗi từ thành `<span>` riêng → nhiều DOM nodes hơn. Với bài đọc ~200 từ thì OK.
- Hover delay 300ms cần tune — quá ngắn gây flicker, quá dài thì chậm.
- Mock dictionary hạn chế — nhiều từ sẽ không có tooltip. Cần fallback UX rõ ràng.

## Implementation plan

### Files

- `lib/practice/mock-dictionary.ts` — NEW, mock word entries với IPA + pos + meaning
- `components/practice/InteractivePassage.tsx` — NEW, render từng từ có hover
- `components/practice/WordTooltip.tsx` — NEW, tooltip UI
- `routes/.../PassagePanel.tsx` — dùng InteractivePassage thay plain text

### Tasks

1. Tạo `mock-dictionary.ts` — ~100 entries
2. Tạo `WordTooltip.tsx` — tooltip UI (phiên âm, loại từ, nghĩa, nút phát âm)
3. Tạo `InteractivePassage.tsx` — split text thành spans, hover logic, delay
4. Tích hợp vào PassagePanel
5. Test: hover desktop, tap mobile, cùng tồn tại với text selection popup
