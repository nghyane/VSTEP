# RFC: Restructure Grammar Module for VSTEP

## Problem

Module ngữ pháp hiện tại (`/luyen-tap/nen-tang/ngu-phap`) được tổ chức theo danh mục sách giáo khoa (tenses, conditionals, passives, relatives, reported, modals). Cách này có 5 vấn đề cụ thể:

1. **Không gắn với format thi VSTEP.** User luyện thi cần grammar phục vụ Writing Task 1/2, Speaking Part 1/2/3, Reading parsing — không phải "học mệnh đề quan hệ" trừu tượng. Hiện không có metadata nào liên kết grammar point với task thi.

2. **Không phân theo trình độ.** VSTEP 3-5 trải từ B1 đến C1. Cùng một chủ điểm (ví dụ conditionals) nhưng B1, B2, C1 dùng rất khác. Hiện tất cả grammar points nằm phẳng, không có level tag.

3. **Bài tập chỉ có MCQ.** Thiếu các dạng bài sát thực tế: error correction (sửa lỗi), fill-in-blank (điền từ), sentence rewrite (viết lại câu). Đây là các dạng trực tiếp rèn accuracy và range cho Writing/Speaking.

4. **Thiếu context VSTEP trong lý thuyết.** Mỗi grammar point chỉ có `whenToUse`, `structures`, `examples` chung chung. Không có: lỗi phổ biến của người Việt, mẹo dùng trong từng task thi, ví dụ gắn với đề VSTEP.

5. **UI chỉ có 1 cách vào: grid theo category.** User không thể lọc theo mục tiêu điểm (B1→B2), theo task thi (Writing Task 2), hay theo lỗi cá nhân.

## Goals

- G1: Data model mới cho `GrammarPoint` có metadata: `levels` (B1/B2/C1), `tasks` (WT1/WT2/SP1/SP2/SP3/READ), `functions` (accuracy/range/coherence/register).
- G2: Thêm `commonMistakes` và `vstepTips` vào mỗi grammar point.
- G3: Exercise type mở rộng thành discriminated union: `mcq | error-correction | fill-blank | rewrite`.
- G4: Grammar list page có 3 view: theo trình độ, theo bài thi, theo lỗi hay gặp.
- G5: Grammar detail page thêm tab "Mẹo thi VSTEP" và section "Lỗi thường gặp" trong lý thuyết.
- G6: Migrate 8 grammar points hiện có sang schema mới, bổ sung metadata + exercise types.

## Non-goals

- Không đổi routing path. `/luyen-tap/nen-tang/ngu-phap/` và `/$pointId` giữ nguyên.
- Không đụng module từ vựng (`tu-vung`). Restructure từ vựng là RFC riêng.
- Không đụng module kỹ năng (Nghe/Đọc/Viết/Nói).
- Không build backend API. Vẫn dùng mock data trong `lib/mock/grammar.ts`.
- Không thêm grammar points mới ngoài 8 points hiện có. Thêm content là việc sau khi schema ổn.
- Không đổi mastery tracking logic (`lib/grammar/mastery.ts`). Giữ nguyên interface.

## Proposed solution

### 1. Data model — `lib/mock/grammar.ts`

Thay đổi types:

```ts
// ─── Taxonomy mới ──────────────────────────────────────────────

type GrammarCategory =
  | "foundation"    // Nền chính xác: verb control, noun phrase, sentence basics
  | "sentence"      // Xây câu: complex sentences, comparison, voice, hypothesis
  | "task"          // Grammar theo bài thi VSTEP
  | "error-clinic"  // Phòng khám lỗi

type VstepLevel = "B1" | "B2" | "C1"

type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"

type GrammarFunction = "accuracy" | "range" | "coherence" | "register"

// ─── Enriched content ──────────────────────────────────────────

interface CommonMistake {
  wrong: string
  correct: string
  explanation: string
}

interface VstepTip {
  task: VstepTask
  tip: string
  example: string
}

// ─── Exercise union ────────────────────────────────────────────

type GrammarExercise =
  | GrammarMCQ
  | GrammarErrorCorrection
  | GrammarFillBlank
  | GrammarRewrite

interface GrammarMCQ {
  kind: "mcq"
  id: string
  prompt: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

interface GrammarErrorCorrection {
  kind: "error-correction"
  id: string
  sentence: string
  errorStart: number   // char index
  errorEnd: number
  correction: string
  explanation: string
}

interface GrammarFillBlank {
  kind: "fill-blank"
  id: string
  template: string          // "She ___ to school every day."
  acceptedAnswers: string[] // ["goes"]
  explanation: string
}

interface GrammarRewrite {
  kind: "rewrite"
  id: string
  instruction: string       // "Viết lại câu dùng bị động"
  original: string
  acceptedAnswers: string[] // ["The book was written by her."]
  explanation: string
}

// ─── GrammarPoint ──────────────────────────────────────────────

interface GrammarPoint {
  id: string
  name: string
  vietnameseName: string
  category: GrammarCategory
  levels: VstepLevel[]
  tasks: VstepTask[]
  functions: GrammarFunction[]
  summary: string
  whenToUse: string
  structures: string[]
  examples: GrammarExample[]
  commonMistakes: CommonMistake[]
  vstepTips: VstepTip[]
  exercises: GrammarExercise[]   // was GrammarMCQ[]
}
```

Label maps mở rộng:

```ts
const CATEGORY_LABELS: Record<GrammarCategory, string> = {
  foundation: "Nền chính xác",
  sentence: "Xây câu & mở rộng ý",
  task: "Grammar theo bài thi",
  "error-clinic": "Phòng khám lỗi",
}

const LEVEL_LABELS: Record<VstepLevel, string> = {
  B1: "Nền tảng B1",
  B2: "Nâng cao B2",
  C1: "Tinh chỉnh C1",
}

const TASK_LABELS: Record<VstepTask, string> = {
  WT1: "Writing Task 1",
  WT2: "Writing Task 2",
  SP1: "Speaking Part 1",
  SP2: "Speaking Part 2",
  SP3: "Speaking Part 3",
  READ: "Reading",
}
```

### 2. Mock data migration

8 grammar points hiện có được map lại:

| Point | category | levels | tasks |
|---|---|---|---|
| Present Simple | foundation | B1 | SP1, WT1, READ |
| Present Perfect | foundation | B1, B2 | SP1, SP3, WT2, READ |
| Past Simple | foundation | B1 | SP1, WT1, READ |
| First Conditional | sentence | B1, B2 | SP2, WT2 |
| Second Conditional | sentence | B2 | SP2, SP3, WT2 |
| Third Conditional | sentence | B2, C1 | SP3, WT2 |
| Present Passive | sentence | B1, B2 | WT2, READ |
| Relative Clauses | sentence | B1, B2 | WT2, SP3, READ |

Mỗi point được bổ sung:
- 2-3 `commonMistakes` (lỗi phổ biến người Việt)
- 2-3 `vstepTips` (mẹo dùng trong task cụ thể)
- 2-3 exercise mới (mix `error-correction`, `fill-blank`, `rewrite`) bên cạnh MCQ hiện có

MCQ hiện có thêm field `kind: "mcq"` — breaking change nhưng contained trong mock.

### 3. Grammar list page — `_app.luyen-tap.nen-tang.ngu-phap.index.tsx`

Thêm search param `view`:

```ts
type GrammarView = "level" | "task" | "errors"

interface Search {
  view: GrammarView
}
```

3 tab, mỗi tab group cùng data khác nhau:

- `view=level` (default): group by `point.levels` → sections B1 / B2 / C1. Một point có nhiều levels thì xuất hiện ở level thấp nhất.
- `view=task`: group by `point.tasks` → sections WT1 / WT2 / SP1 / SP2 / SP3 / READ. Một point xuất hiện ở nhiều task sections.
- `view=errors`: filter `point.category === "error-clinic"` hoặc points có `commonMistakes.length > 0`. Flat list, mỗi card highlight số lỗi phổ biến.

Tab bar dùng `<Link>` với search params, không client state — đúng rule 8 (URL là nguồn state) và rule 16.

### 4. Grammar detail page — `_app.luyen-tap.nen-tang.ngu-phap.$pointId/index.tsx`

Thêm tab thứ 3:

```ts
type Tab = "theory" | "practice" | "vstep-tips"
```

- Tab "Lý thuyết": giữ nguyên + thêm section `CommonMistakes` ở cuối.
- Tab "Luyện tập": giữ nguyên flow + thêm render cho exercise types mới.
- Tab "Mẹo thi VSTEP": component mới `VstepTipsView`, render `point.vstepTips[]` grouped by task.

### 5. TheoryView — thêm CommonMistakes

Thêm section cuối cùng trong `TheoryView.tsx`:

```
[Khi nào dùng]
[Cấu trúc]
[Ví dụ]
[Lỗi thường gặp]  ← NEW
```

Mỗi mistake render: câu sai (line-through, destructive) → câu đúng (success) → giải thích.

### 6. PracticeSession — exercise type switch

Hiện tại `PracticeSession` chỉ render `GrammarMCQ`. Đổi thành switch:

```ts
function ExerciseCard({ exercise }: { exercise: GrammarExercise }) {
  switch (exercise.kind) {
    case "mcq":
      return <McqCard ... />
    case "error-correction":
      return <ErrorCorrectionCard ... />
    case "fill-blank":
      return <FillBlankCard ... />
    case "rewrite":
      return <RewriteCard ... />
  }
}
```

3 component mới:

- `ErrorCorrectionCard`: hiện câu, user click vào chỗ sai (hoặc select range), nhập sửa. Check against `correction`.
- `FillBlankCard`: hiện template với blank, user nhập text. Check against `acceptedAnswers` (case-insensitive, trim).
- `RewriteCard`: hiện instruction + original, user nhập textarea. Check against `acceptedAnswers` (normalized comparison).

Cả 3 đều gọi `recordAnswer(pointId, isCorrect)` giống MCQ hiện tại → mastery tracking không đổi.

### 7. New components

| Component | File | Responsibility |
|---|---|---|
| `ErrorCorrectionCard` | `routes/...$pointId/-components/ErrorCorrectionCard.tsx` | Render error-correction exercise |
| `FillBlankCard` | `routes/...$pointId/-components/FillBlankCard.tsx` | Render fill-blank exercise |
| `RewriteCard` | `routes/...$pointId/-components/RewriteCard.tsx` | Render rewrite exercise |
| `VstepTipsView` | `routes/...$pointId/-components/VstepTipsView.tsx` | Render vstep tips grouped by task |

## Alternatives considered

### A1: Giữ category cũ, chỉ thêm metadata

Thêm `levels`, `tasks` vào `GrammarPoint` nhưng giữ `category` là `tenses | conditionals | ...`.

Bỏ vì: category cũ không phản ánh mục tiêu VSTEP. UI vẫn phải group theo level/task, nên category cũ trở thành dead field. Đổi luôn category cho nhất quán.

### A2: Tách exercise types thành file riêng

Mỗi exercise type có file mock data riêng (`lib/mock/grammar-mcq.ts`, `lib/mock/grammar-fill-blank.ts`...).

Bỏ vì: exercises gắn chặt với grammar point, tách ra tạo thêm join logic không cần thiết. Discriminated union trong cùng array đơn giản hơn.

### A3: Dùng sub-route cho mỗi tab thay vì search param

`/$pointId/theory`, `/$pointId/practice`, `/$pointId/vstep-tips` thay vì `?tab=`.

Bỏ vì: 3 tab share cùng data (grammar point), không cần loader riêng. Search param nhẹ hơn, đúng pattern hiện tại của app (grammar detail đã dùng `?tab=theory|practice`).

## Risks / trade-offs

1. **Breaking change cho mock data.** Tất cả `GrammarMCQ` cần thêm `kind: "mcq"`. `GrammarPoint.exercises` đổi type. Contained trong `lib/mock/grammar.ts` — không ảnh hưởng code ngoài module grammar.

2. **Answer matching cho fill-blank và rewrite không hoàn hảo.** Normalized string comparison sẽ miss các câu trả lời đúng nhưng diễn đạt khác. Chấp nhận ở phase mock — khi có backend, chuyển sang AI grading hoặc regex patterns.

3. **Content quality.** `commonMistakes` và `vstepTips` viết bằng tay trong mock. Cần review bởi người có chuyên môn VSTEP. Risk: nội dung sai hoặc misleading. Mitigation: đánh dấu rõ là mock data, review trước khi production.

4. **UI complexity tăng.** 3 exercise types mới + 3 view modes ở list page. Mitigation: mỗi exercise card là component độc lập, không tăng complexity của PracticeSession logic.

## Rollout plan

Tất cả thay đổi ship cùng 1 lần vì:
- Mock data breaking change → UI phải update đồng bộ
- Không có user-facing feature flag cần thiết (chưa có real users)
- Scope contained trong nhánh `nen-tang/ngu-phap`

## Implementation plan

### Phase 1: Data model + mock data

1. Rewrite types trong `lib/mock/grammar.ts`: thêm `GrammarCategory` mới, `VstepLevel`, `VstepTask`, `GrammarFunction`, `CommonMistake`, `VstepTip`, exercise union type.
2. Thêm label maps: `CATEGORY_LABELS`, `LEVEL_LABELS`, `TASK_LABELS`.
3. Migrate 8 grammar points: thêm `kind: "mcq"` cho MCQ hiện có, thêm metadata (`levels`, `tasks`, `functions`, `commonMistakes`, `vstepTips`), thêm 2-3 exercise mới mỗi point.
4. Verify: `bunx --bun tsc --noEmit` pass.

### Phase 2: Theory enrichment

5. `TheoryView.tsx`: thêm section CommonMistakes.
6. Verify: build pass, render đúng cả light/dark.

### Phase 3: Exercise types

7. Tạo `ErrorCorrectionCard.tsx`.
8. Tạo `FillBlankCard.tsx`.
9. Tạo `RewriteCard.tsx`.
10. Refactor `PracticeSession.tsx`: switch render theo `exercise.kind`. Giữ nguyên session flow (index, selected, result, keyboard shortcuts).
11. Verify: tất cả exercise types render đúng, keyboard navigate được, mastery tracking hoạt động.

### Phase 4: VSTEP tips tab

12. Tạo `VstepTipsView.tsx`.
13. Update `$pointId/index.tsx`: thêm tab "Mẹo thi VSTEP", validate search `tab: "theory" | "practice" | "vstep-tips"`.
14. Verify: tab switch hoạt động, URL search param đúng.

### Phase 5: List page views

15. Update `ngu-phap.index.tsx`: thêm search param `view`, 3-tab UI, grouping logic cho level/task/errors.
16. Verify: 3 views render đúng, tab switch giữ URL state, back/forward hoạt động.

### Phase 6: Cleanup + final check

17. `bunx --bun tsc --noEmit` — 0 errors.
18. `bunx biome check .` — 0 errors, 0 new warnings.
19. `bun run build` — pass.
20. Manual check: keyboard navigation end-to-end, dark mode, loading/error/empty/success states.

## User flow

### Flow 1: Học theo trình độ
```
/luyen-tap/nen-tang/ngu-phap?view=level
  → Thấy sections B1 / B2 / C1
  → Click "Present Simple" (B1)
  → /luyen-tap/nen-tang/ngu-phap/present-simple?tab=theory
  → Đọc lý thuyết + lỗi thường gặp
  → Click tab "Luyện tập"
  → Làm MCQ + fill-blank + error-correction
  → Xem kết quả
  → Click tab "Mẹo thi VSTEP"
  → Đọc tips cho SP1, WT1
```

### Flow 2: Học theo bài thi
```
/luyen-tap/nen-tang/ngu-phap?view=task
  → Thấy sections WT1 / WT2 / SP1 / SP2 / SP3 / READ
  → Click "Second Conditional" trong section SP2
  → Học + luyện tập
```

### Flow 3: Sửa lỗi
```
/luyen-tap/nen-tang/ngu-phap?view=errors
  → Thấy danh sách points có commonMistakes
  → Click vào point
  → Focus vào section "Lỗi thường gặp" + bài tập error-correction
```

## Loading / Error / Empty states

- **Loading**: Suspense fallback skeleton (giữ nguyên `ListSkeleton` và `DetailSkeleton` hiện có).
- **Error**: Route ErrorBoundary (đã có ở `_app.tsx`).
- **Empty**: Nếu không có grammar points cho 1 view/group → hiện message "Chưa có nội dung cho mục này".
- **Success**: Render bình thường.

## Accessibility

- Tab bar dùng `<Link>` (keyboard navigable, có focus ring).
- Exercise cards: tất cả interactive elements là `<button>` hoặc `<input>`, không `<div onClick>`.
- `FillBlankCard` và `RewriteCard` có `<label>` cho input/textarea.
- `ErrorCorrectionCard`: vùng lỗi có `aria-label` mô tả.
- Keyboard shortcuts giữ nguyên pattern hiện tại (1-4 chọn đáp án, Enter next).
