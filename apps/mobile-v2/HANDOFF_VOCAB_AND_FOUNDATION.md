# Mobile v2 Handoff — Foundation + Vocab flow

## Phạm vi đợt này

Đợt này tập trung sửa và nối đúng luồng cho phần `Luyện tập nền tảng`, đặc biệt là:

- `Nền tảng`
- `Từ vựng`
- `Ngữ pháp` (list screen)
- flow `vocab` theo đúng source of truth từ `frontend-v3`

Không đụng business logic backend. Chỉ đọc backend-v2 để bám đúng endpoint và shape dữ liệu.

---

## Source of truth đã dùng

### Frontend-v3

Đã đọc kỹ các file này để bám đúng flow:

- `apps/frontend-v3/src/routes/_app/luyen-tap/tu-vung/index.tsx`
- `apps/frontend-v3/src/routes/_app/luyen-tap/tu-vung/$topicId.tsx`
- `apps/frontend-v3/src/routes/_focused/vocab/$topicId/flashcard.tsx`
- `apps/frontend-v3/src/routes/_focused/vocab/$topicId/exercise.tsx`
- `apps/frontend-v3/src/routes/_focused/vocab/srs-review.tsx`
- `apps/frontend-v3/src/features/vocab/components/SrsHero.tsx`
- `apps/frontend-v3/src/features/vocab/components/TopicGrid.tsx`
- `apps/frontend-v3/src/features/vocab/components/TopicHero.tsx`
- `apps/frontend-v3/src/features/vocab/components/ExerciseModes.tsx`
- `apps/frontend-v3/src/features/vocab/components/WordList.tsx`
- `apps/frontend-v3/src/features/vocab/components/FlashcardCard.tsx`
- `apps/frontend-v3/src/features/vocab/components/SrsRatingButtons.tsx`
- `apps/frontend-v3/src/features/vocab/use-flashcard-session.ts`
- `apps/frontend-v3/src/features/vocab/use-exercise-session.ts`

### Backend-v2

Đã bám các endpoint thật trong `apps/backend-v2/routes/api.php`:

- `GET /api/v1/vocab/topics`
- `GET /api/v1/vocab/topics/:id`
- `GET /api/v1/vocab/srs/queue`
- `POST /api/v1/vocab/srs/review`
- `POST /api/v1/vocab/exercises/:id/attempt`
- `GET /api/v1/grammar/points`

---

## Flow vocab chuẩn theo frontend-v3

Đây là flow hiện tại mobile-v2 đã được kéo gần về đúng FE v3:

### 1. Vocab index

Route mobile:

- `app/(app)/vocabulary/index.tsx`

Flow:

- hiện `SRS Hero`
- hiện `Topic Grid`
- nếu bấm CTA ở hero -> vào `srs-review`
- nếu bấm topic -> vào topic detail

### 2. Topic detail

Route mobile:

- `app/(app)/vocabulary/[id].tsx`

Flow:

- chỉ là **overview page**
- có `TopicHero`
- có `ExerciseModes`
- có `WordList` collapsible
- không học trực tiếp tại đây

### 3. Flashcard focus mode

Route mobile:

- `app/(app)/vocabulary/[id]/flashcard.tsx`

Flow:

- front card: word / phonetic / part of speech
- bấm `Xem nghĩa` -> reveal definition / example / vstep tip
- reveal xong mới hiện 4 nút đánh giá:
  - `Quên`
  - `Khó`
  - `Nhớ`
  - `Dễ`
- bấm rating -> `POST /api/v1/vocab/srs/review`
- `Quên` sẽ requeue card về cuối session

### 4. SRS review focus mode

Route mobile:

- `app/(app)/vocabulary/srs-review.tsx`

Flow:

- dùng queue từ `GET /api/v1/vocab/srs/queue`
- UI + interaction gần giống flashcard screen
- done state: ôn xong lượt hôm nay

### 5. Exercise focus mode

Route mobile:

- `app/(app)/vocabulary/[id]/exercise.tsx`

Flow:

- nhận query `kind`
  - `mcq`
  - `fill_blank`
  - `word_form`
- lọc exercise theo kind
- `Kiểm tra` -> `POST /api/v1/vocab/exercises/:id/attempt`
- hiện feedback + explanation
- `Tiếp tục` -> sang câu kế tiếp

---

## Files đã thêm / sửa trong đợt này

### Hooks

- `src/hooks/use-vocab.ts`
  - thêm types mirror FE v3
  - `useVocabTopics()`
  - `useVocabSrsQueue()`
  - `useVocabTopicDetail()`
  - `TopicDetailResponse` có cả `words` và `exercises`

- `src/hooks/use-grammar.ts`
  - `useGrammarPoints()`

### Screens

- `app/(app)/practice/foundation/index.tsx`
  - sửa tiếng Việt có dấu
  - nối data thật cho vocab + grammar summary

- `app/(app)/practice/grammar/index.tsx`
  - màn danh sách điểm ngữ pháp từ backend

- `app/(app)/vocabulary/index.tsx`
  - vocab index đúng flow hơn
  - SRS Hero + Topic Grid

- `app/(app)/vocabulary/[id].tsx`
  - topic detail overview page

- `app/(app)/vocabulary/[id]/flashcard.tsx`
  - flashcard focus mode

- `app/(app)/vocabulary/[id]/exercise.tsx`
  - exercise focus mode

- `app/(app)/vocabulary/srs-review.tsx`
  - SRS review focus mode

- `app/(app)/_layout.tsx`
  - add các route vocab mới

---

## Những gì đã đúng hơn trước

### Nền tảng

- không còn text không dấu kiểu `Nen tang`, `Tu vung`, `Ngu phap`
- không còn placeholder “đang phát triển” cho vocab
- grammar không còn hiện “Sắp ra mắt” vô lý khi backend đã có endpoint list

### Vocab

- không còn gộp sai flow thành tab flashcard / luyện tập trong topic detail
- index, topic detail, flashcard, exercise, srs-review đã tách route rõ hơn
- đã nối API thật thay vì mock data cứng
- nút SRS hero đã đi đúng route thay vì no-op

---

## Những gì vẫn CHƯA hoàn chỉnh

Đây là phần quan trọng nhất để người tiếp theo không hiểu nhầm mức độ hoàn thiện.

### 1. UI vẫn chưa match hoàn toàn frontend-v3

Tuy flow đã gần đúng hơn, phần visual vẫn chưa đạt mức “bám sát FE v3” ở các điểm:

- `TopicHero` còn hơi mobile-first thô, chưa đủ editorial/premium như web
- `FocusBar` còn đơn giản
- `Exercise focus screen` còn functional nhưng chưa đẹp
- `SrsRatingButtons` đã thành button thật nhưng visual vẫn chưa tinh như FE v3

### 2. Chưa có reuse session hooks như FE v3

Frontend-v3 có:

- `useFlashcardSession`
- `useExerciseSession`

Mobile hiện đang implement logic inline trong screen.

Điều này không sai về mặt chức năng, nhưng nếu tiếp tục polish phần vocab thì nên cân nhắc:

- tách logic session khỏi screen
- để UI screen mỏng hơn

### 3. `srs-review` chưa invalidate queue sau batch như FE v3

FE v3 có logic:

- done -> invalidate query `vocab/srs/queue`
- refetch queue mới
- nếu queue vẫn rỗng mới show complete thật

Mobile hiện chưa làm bước invalidate/refetch này.

Hiện tại mobile dùng session local queue là chính.

### 4. Chưa có dedicated empty / complete components kiểu FE v3

FE v3 dùng:

- `FocusEmpty`
- `FocusComplete`

Mobile hiện còn render inline done/empty states.

### 5. `exercise` submit answer shape cần verify thêm nếu backend thay đổi resource

Hiện mobile gọi:

- mcq -> `{ answer: { selectedIndex / selected_index } }` qua transform
- text -> `{ answer: { text } }`

Đang bám shape chung của FE v3 và mobile api transform, nhưng nếu backend controller/resource đổi thì cần test lại thực chiến.

---

## Vấn đề UX hiện user đã report

User đã report các vấn đề này trong quá trình làm:

- topic detail xấu, bài tập bổ trợ không rõ là card
- flashcard card không rõ front/reveal
- rating buttons `Quên / Khó / Nhớ / Dễ` trông như text rời, không phải nút
- flow vocab không đúng FE v3

Đã xử lý một phần nhưng **chưa thể coi là done hoàn toàn về UI polish**.

---

## Nếu tiếp tục làm, thứ tự ưu tiên đúng nhất

### Priority 1 — polish vocab để match FE v3 thật sát

Ưu tiên sửa tiếp các file:

- `app/(app)/vocabulary/[id].tsx`
- `app/(app)/vocabulary/[id]/flashcard.tsx`
- `app/(app)/vocabulary/[id]/exercise.tsx`
- `app/(app)/vocabulary/srs-review.tsx`

Checklist:

- `TopicHero` giống FE v3 hơn
- `ExerciseModes` giống card-interactive web hơn
- `FlashcardCard` tách front / answer rõ hơn
- rating buttons thành 4 ô đều, đẹp, semantic
- `FocusBar` có hierarchy rõ hơn
- done/empty states thống nhất

### Priority 2 — grammar detail flow

Hiện mới có list screen:

- `practice/grammar/index.tsx`

Chưa có:

- grammar point detail
- grammar exercise focus mode

Backend và FE v3 đều đã có nền tảng cho phần này, nên đây là step tiếp theo hợp lý của foundation.

### Priority 3 — SRS queue invalidate/refetch

Thêm behavior giống FE v3:

- complete batch in `srs-review`
- invalidate query `vocab/srs/queue`
- nếu queue mới vẫn empty -> done thật

---

## Lưu ý implementation

### 1. Mobile API client đã auto camelCase/snake_case

Trong `src/lib/api.ts`:

- request body camelCase -> snake_case
- response snake_case -> camelCase

Nên trong TS types mobile:

- dùng `partOfSpeech`, `displayOrder`, `wordCount`, `vstepTip`

không dùng snake_case ở app layer.

### 2. `DepthButton` chỉ auto wrap khi children là string duy nhất

Đã từng có bug:

- string literal + expression thành 2 children nodes
- `DepthButton` không wrap vào `<Text>`
- gây crash `Text strings must be rendered within a <Text> component`

Khi truyền label động, dùng:

```tsx
{`Học Flashcard · ${words.length} từ`}
```

không viết:

```tsx
Học Flashcard · {words.length} từ
```

### 3. Không dùng icon trần + text rời nếu đó là primary action

User phản hồi rất rõ rằng kiểu icon/text rời làm UI “xấu” và không rõ là action.

Với các mode card / rating buttons / focus CTA:

- phải có card/button container rõ
- phải có hit area đủ lớn
- semantic color rõ ràng

---

## Trạng thái hiện tại để bàn giao

### Đã có thể dùng

- foundation index
- grammar list
- vocab index
- vocab topic detail
- vocab flashcard focus
- vocab exercise focus
- vocab srs review focus

### Nhưng chưa được coi là final polished

Nếu bàn giao cho người tiếp theo, message ngắn gọn nên là:

> Flow vocab đã được kéo về đúng cấu trúc FE v3 và đã nối API thật. Tuy nhiên visual/UI polish của topic detail, flashcard, srs-review, exercise vẫn còn cần một pass cuối để match frontend-v3 tốt hơn.

