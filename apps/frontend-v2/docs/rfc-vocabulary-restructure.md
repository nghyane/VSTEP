# RFC: Restructure Vocabulary Module for VSTEP

## Problem

Module từ vựng hiện tại (`/luyen-tap/nen-tang/tu-vung`) có 5 vấn đề tương tự grammar trước khi refactor:

1. **Không phân theo trình độ VSTEP.** Level hiện tại là `level_1 | level_2 | level_3` — không map sang B1/B2/C1. User không biết chủ đề nào phù hợp trình độ mình.

2. **Không gắn với task thi.** Từ vựng không có metadata liên kết với Writing Task 1/2, Speaking Part 1/2/3, Reading. User học xong không biết dùng ở đâu trong bài thi.

3. **Nội dung từ quá mỏng.** Mỗi `VocabWord` chỉ có `word, phonetic, partOfSpeech, definition, example`. Thiếu: synonyms, collocations, word family, common mistakes, VSTEP usage tips.

4. **Chỉ có 1 dạng học: flashcard SRS.** User lật thẻ → tự đánh giá. Không có bài tập vận dụng: MCQ, fill-in-blank, matching, word formation. Flashcard tốt cho ghi nhớ nhưng không đủ cho vận dụng trong thi.

5. **List page chỉ có 1 view.** Grid phẳng theo topic, không filter theo level hay task.

## Goals

- G1: Data model mới cho `VocabWord` có enriched content: `synonyms`, `collocations`, `wordFamily`, `vstepTip`.
- G2: `VocabTopic` thêm metadata: `level` đổi sang `VstepLevel` (B1/B2/C1), thêm `tasks` (VstepTask[]).
- G3: Thêm exercise types cho từ vựng: `VocabExercise` union type gồm `mcq | fill-blank | word-form`.
- G4: Mỗi topic có mảng `exercises` bên cạnh `words` — tách biệt flashcard SRS (học) và exercises (luyện).
- G5: Topic list page có 3 views: theo trình độ, theo bài thi, tất cả chủ đề.
- G6: Topic detail page thêm tab "Luyện tập" (exercises) bên cạnh flashcard SRS hiện tại.

## Non-goals

- Không đổi SRS logic (`lib/srs/*`). Giữ nguyên scheduler, queue, storage.
- Không đổi routing paths. `/luyen-tap/nen-tang/tu-vung/` và `/$topicId` giữ nguyên.
- Không đụng module ngữ pháp hay kỹ năng.
- Không build backend API. Vẫn dùng mock data.
- Không thêm topics mới. Migrate 6 topics hiện có.

## Proposed solution

### 1. Data model — `lib/mock/vocabulary.ts`

```ts
// ─── Reuse từ grammar ──────────────────────────────────────────
// Import VstepLevel, VstepTask từ lib/mock/grammar.ts
// Hoặc extract sang lib/types/vstep.ts nếu muốn tránh cross-import.

type VstepLevel = "B1" | "B2" | "C1"
type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"

// ─── Enriched VocabWord ────────────────────────────────────────

interface VocabWord {
  id: string
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
  example: string
  // NEW
  synonyms: string[]          // ["kin", "family member"]
  collocations: string[]      // ["close relative", "distant relative"]
  wordFamily: string[]        // ["relate (v)", "relation (n)", "relatively (adv)"]
  vstepTip?: string           // "Hay gặp trong Reading passage về gia đình/xã hội"
}

// ─── Vocab exercises ───────────────────────────────────────────

type VocabExercise =
  | VocabMCQ
  | VocabFillBlank
  | VocabWordForm

interface VocabMCQ {
  kind: "mcq"
  id: string
  prompt: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

interface VocabFillBlank {
  kind: "fill-blank"
  id: string
  sentence: string            // "She has a ___ relationship with her mother."
  acceptedAnswers: string[]   // ["close"]
  explanation: string
}

interface VocabWordForm {
  kind: "word-form"
  id: string
  instruction: string         // "Điền dạng đúng của từ trong ngoặc"
  sentence: string            // "The ___ (relate) between them is strong."
  rootWord: string            // "relate"
  acceptedAnswers: string[]   // ["relationship"]
  explanation: string
}

// ─── VocabTopic ────────────────────────────────────────────────

interface VocabTopic {
  id: string
  name: string
  description: string
  level: VstepLevel           // CHANGED: was "level_1" | "level_2" | "level_3"
  tasks: VstepTask[]          // NEW
  iconKey: "family" | "sun" | "briefcase" | "heart" | "leaf" | "graduation"
  words: VocabWord[]
  exercises: VocabExercise[]  // NEW
}
```

### 2. Shared VSTEP types — `lib/types/vstep.ts`

Extract `VstepLevel`, `VstepTask`, `LEVEL_LABELS`, `TASK_LABELS` ra file chung để cả grammar và vocabulary import mà không cross-import mock files:

```ts
// lib/types/vstep.ts
export type VstepLevel = "B1" | "B2" | "C1"
export type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"

export const LEVEL_LABELS: Record<VstepLevel, string> = {
  B1: "Nền tảng B1",
  B2: "Nâng cao B2",
  C1: "Tinh chỉnh C1",
}

export const TASK_LABELS: Record<VstepTask, string> = {
  WT1: "Writing Task 1",
  WT2: "Writing Task 2",
  SP1: "Speaking Part 1",
  SP2: "Speaking Part 2",
  SP3: "Speaking Part 3",
  READ: "Reading",
}
```

`lib/mock/grammar.ts` sẽ re-export từ file này thay vì define riêng.

### 3. Mock data migration

6 topics hiện có được map lại:

| Topic | level | tasks |
|---|---|---|
| Gia đình & Mối quan hệ | B1 | SP1, WT1, READ |
| Sinh hoạt hằng ngày | B1 | SP1, WT1 |
| Công việc & Sự nghiệp | B2 | SP1, SP3, WT2, READ |
| Sức khỏe & Thể chất | B2 | SP1, SP3, WT2, READ |
| Môi trường & Khí hậu | C1 | WT2, SP3, READ |
| Giáo dục & Học thuật | C1 | WT2, SP3, READ |

Mỗi word được bổ sung:
- 1-3 `synonyms`
- 1-2 `collocations`
- 1-3 `wordFamily` entries
- `vstepTip` cho ~50% từ (những từ hay gặp trong thi)

Mỗi topic được bổ sung 4-6 exercises (mix MCQ, fill-blank, word-form).

### 4. Topic list page — `_app.luyen-tap.nen-tang.tu-vung.index.tsx`

Thêm search param `view`:

```ts
type VocabView = "level" | "task" | "all"
```

- `view=level` (default): group by `topic.level` → sections B1 / B2 / C1
- `view=task`: group by `topic.tasks` → sections WT1 / WT2 / SP1 / SP2 / SP3 / READ
- `view=all`: flat grid hiện tại (giữ lại cho user quen)

Tab bar giống grammar list page.

### 5. Topic detail page — `_app.luyen-tap.nen-tang.tu-vung.$topicId.tsx`

Thêm tab system:

```ts
type Tab = "flashcard" | "practice"
```

- Tab "Flashcard" (default): giữ nguyên SRS flow hiện tại
- Tab "Luyện tập": exercise session tương tự grammar PracticeSession — tuần tự qua exercises, có kind badge, answer checking

Flashcard card cũng được enriched: khi lật, hiện thêm synonyms, collocations, word family bên dưới definition + example.

### 6. Enriched flashcard — khi lật thẻ

Hiện tại khi lật:
```
definition
"example"
```

Đổi thành:
```
definition
"example"
─────────────
Đồng nghĩa: kin, family member
Collocations: close relative, distant relative
Word family: relate (v), relation (n), relatively (adv)
[VSTEP tip nếu có]
```

Không thay đổi SRS logic — chỉ hiện thêm thông tin.

## Alternatives considered

### A1: Gộp exercises vào trong words thay vì tách riêng

Mỗi `VocabWord` có mảng `exercises` riêng.

Bỏ vì: exercises thường test nhiều từ cùng lúc (MCQ với 4 options từ cùng topic, fill-blank dùng context sentence). Gắn exercise vào topic hợp lý hơn gắn vào từng word.

### A2: Dùng SRS cho exercises luôn

Bỏ vì: SRS phù hợp cho recall (nhớ nghĩa từ). Exercises test application (dùng từ đúng ngữ cảnh) — nên là session tuần tự, không cần spaced repetition.

### A3: Tạo VstepLevel/VstepTask riêng cho vocabulary thay vì share

Bỏ vì: cùng taxonomy, tách ra tạo duplication. Extract sang `lib/types/vstep.ts` sạch hơn.

## Risks / trade-offs

1. **Breaking change cho mock data.** `VocabWord` thêm fields, `VocabTopic.level` đổi type, thêm `tasks` và `exercises`. Contained trong `lib/mock/vocabulary.ts`.

2. **`level_1/2/3` → `B1/B2/C1`** ảnh hưởng `LEVEL_LABELS` export cũ. Cần update consumers.

3. **SRS storage không bị ảnh hưởng** vì key dựa trên `wordId` — không đổi.

4. **Enriched flashcard card có thể dài** khi lật nếu word có nhiều synonyms/collocations. Chấp nhận — user scroll được, thông tin hữu ích.

## Rollout plan

Ship 1 lần vì breaking change mock data → UI phải update đồng bộ. Scope contained trong nhánh `nen-tang/tu-vung`.

## Implementation plan

### Phase 1: Shared types

1. Tạo `lib/types/vstep.ts` — extract `VstepLevel`, `VstepTask`, `LEVEL_LABELS`, `TASK_LABELS`.
2. Update `lib/mock/grammar.ts` — import + re-export từ `lib/types/vstep.ts` thay vì define riêng.
3. Verify: tsc pass, grammar module không bị ảnh hưởng.

### Phase 2: Vocabulary data model + mock data

4. Rewrite types trong `lib/mock/vocabulary.ts`: enriched `VocabWord`, exercise union, updated `VocabTopic`.
5. Migrate 6 topics: đổi level, thêm tasks, enrich words, thêm exercises.
6. Xóa `LEVEL_LABELS` export cũ từ vocabulary (dùng shared).
7. Verify: tsc pass.

### Phase 3: Topic list page

8. Update `tu-vung.index.tsx`: thêm search param `view`, 3-tab UI, grouping logic.
9. Verify: 3 views render đúng.

### Phase 4: Topic detail page

10. Refactor `tu-vung.$topicId.tsx`: thêm tab system (flashcard / practice).
11. Enrich flashcard card: hiện synonyms, collocations, word family khi lật.
12. Tạo VocabPracticeSession component (tương tự grammar PracticeSession).
13. Verify: cả 2 tabs hoạt động, SRS không bị ảnh hưởng.

### Phase 5: Cleanup

14. `bunx --bun tsc --noEmit` — 0 errors mới.
15. `bunx biome check` — 0 errors mới.
16. `bun run build` — pass.

## Files affected

| File | Action |
|---|---|
| `lib/types/vstep.ts` | NEW — shared VSTEP types |
| `lib/mock/grammar.ts` | Update — import from shared types |
| `lib/mock/vocabulary.ts` | Rewrite — enriched types + data |
| `lib/queries/vocabulary.ts` | No logic change, types auto-update |
| `routes/...tu-vung.index.tsx` | Rewrite — 3-view tab system |
| `routes/...tu-vung.$topicId.tsx` | Rewrite — tab system + enriched card + practice session |
| `lib/srs/*` | No change |

## User flow

### Flow 1: Học flashcard (giữ nguyên + enriched)
```
/luyen-tap/nen-tang/tu-vung?view=level
  → Thấy sections B1 / B2 / C1
  → Click "Gia đình & Mối quan hệ" (B1)
  → /luyen-tap/nen-tang/tu-vung/family-relationships?tab=flashcard
  → Flashcard SRS: xem từ → lật → thấy definition + synonyms + collocations + word family
  → Đánh giá: Quên / Khó / Tốt / Dễ
```

### Flow 2: Luyện tập exercises
```
/luyen-tap/nen-tang/tu-vung/family-relationships?tab=practice
  → Session tuần tự: MCQ → fill-blank → word-form
  → Mỗi câu có kind badge + explanation
  → Kết thúc: summary đúng/sai
```

## Loading / Error / Empty states

- Loading: Suspense fallback skeleton (giữ nguyên).
- Error: Route ErrorBoundary.
- Empty: "Chưa có nội dung cho mục này" khi view/group rỗng.
- Success: Render bình thường.

## Accessibility

- Tab bar dùng `<Link>` (keyboard navigable).
- Exercise cards: `<button>`, `<input>`, `<label>` — không `<div onClick>`.
- Flashcard: Space lật, 1-4 đánh giá (giữ nguyên).
