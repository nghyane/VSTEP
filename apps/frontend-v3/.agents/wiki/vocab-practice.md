# Vocab Practice Flow

## Architecture

1 unified state machine cho mọi mode luyện vocab thay vì 3 hook riêng (`useFlashcardSession`, `useTypingSession`, `useExerciseSession`):

```
features/vocab/
  use-practice-session.ts   ← state machine 5 phase
  components/
    PracticeFlow.tsx        ← compose: pick FlipCard hoặc StaticPracticeView theo mode
    FlipCard.tsx            ← 3D flip animation, CHỈ flashcard mode
    StaticPracticeView.tsx  ← layout tĩnh, các mode còn lại
    PracticeFaces.tsx       ← PracticeFront + PracticeBack render mode-specific content
    SrsRatingButtons.tsx    ← 4 nút Quên/Khó/Nhớ/Dễ + interval display
```

## Phase machine

```
prompt → reveal → (advance) → prompt
```

- **prompt**: hiện câu hỏi mode-specific
- **reveal**: hiện full đáp án + so sánh câu trả lời user vs đáp án đúng (qua `PracticeBack` với prop `review`) + 4 nút rating

## 6 mode UI

| Mode | UI | Front content | Cần gõ |
|---|---|---|---|
| flashcard | FlipCard 3D | word | không |
| reverse | Static | definition | không |
| typing | Static | definition | có |
| listen | Static | nút loa to | có |
| fill_blank | Static | sentence với `_____` | có |
| mixed | Static/Flip mix | random theo word | tuỳ |

`fill_blank` generate FE-only từ `word.example` (regex mask), không cần exercises API. Nếu word không có example → skip word đó (filter trong `buildPracticeItems`).

## Wrong/correct → single-click reveal

`reducer` action `check`:
```ts
case "check":
  return { ...state, phase: "reveal", correct: action.correct }
```
Cả đúng và sai đều nhảy thẳng `reveal` — 1 click "Kiểm tra" duy nhất. Banner so sánh trong `PracticeBack` (prop `review`) hiển thị đúng/sai + câu user ghõ vs đáp án đúng.

## Keyboard

- **Space**: lật flashcard (chỉ flashcard mode, không khi đang gõ input)
- **1-4**: rate sau reveal (không khi đang gõ input)

`isInput` check: `e.target instanceof HTMLInputElement || HTMLTextAreaElement`.

## SRS review (daily queue)

Route `/vocab/srs-review` riêng — vẫn dùng `useFlashcardSession` (đơn giản hơn, chỉ flip + rate, không có check mode). Route practice `/vocab/$topicId/practice?mode=…` dùng `usePracticeSession` mới.

---
See also: [[fsrs-migration]] · [[srs-lessons]] · [[api-conventions]]
