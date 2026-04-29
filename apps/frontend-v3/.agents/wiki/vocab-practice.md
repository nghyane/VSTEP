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
prompt → checking → reveal → (advance) → prompt
              ↓
         (wrong) → reveal trực tiếp
```

- **prompt**: hiện câu hỏi mode-specific
- **checking**: đúng → "Tiếp tục" để xem đáp án
- **reveal**: hiện full đáp án (word + def + example + tip) + 4 nút rating

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

## Wrong → auto-reveal

`reducer` action `check`:
```ts
case "check":
  return { ...state, phase: action.correct ? "checking" : "reveal", correct: action.correct }
```
Sai → phase nhảy thẳng `reveal`, user thấy đáp án ngay. Đúng → `checking`, user click "Tiếp tục" để xem chi tiết.

## Keyboard

- **Space**: lật flashcard (chỉ flashcard mode, không khi đang gõ input)
- **1-4**: rate sau reveal (không khi đang gõ input)

`isInput` check: `e.target instanceof HTMLInputElement || HTMLTextAreaElement`.

## SRS review (daily queue)

Route `/vocab/srs-review` riêng — vẫn dùng `useFlashcardSession` (đơn giản hơn, chỉ flip + rate, không có check mode). Route practice `/vocab/$topicId/practice?mode=…` dùng `usePracticeSession` mới.

---
See also: [[fsrs-migration]] · [[srs-lessons]] · [[api-conventions]]
