# RFC: Grammar Detail Page — UI Redesign

## Problem

Trang chi tiết ngữ pháp (`/luyen-tap/nen-tang/ngu-phap/$pointId`) hiện có 3 vấn đề lớn về UX:

**1. Header thiếu context**
- Không có level badges (B1/B2/C1) — user không biết bài này dành cho trình độ nào
- Không có task tags (WT1, WT2, SP2...) — không thấy liên kết với bài thi
- Không có mastery indicator — không biết mình đã luyện bao nhiêu, accuracy bao nhiêu
- Category label chỉ là text `text-xs uppercase` mờ, không nổi

**2. Tab Lý thuyết — layout rời rạc, thiếu visual hierarchy**
- 4 section card đều cùng style `rounded-2xl border bg-card p-6` — không có phân cấp
- "Khi nào dùng" và "Cấu trúc" là 2 card riêng dù liên quan chặt → tạo scroll thừa
- Structures dùng `font-mono` nhưng không có color coding, khó scan
- Examples: `border-l-2` đơn giản, phần tiếng Anh và tiếng Việt không đủ contrast
- "Lỗi thường gặp": `line-through` + `✓` text — quá thô, không đủ visual weight để user nhớ

**3. Tab Luyện tập — card design yếu, thiếu orientation**
- Không có badge hiển thị loại bài (MCQ / Điền từ / Sửa lỗi / Viết lại) — user không biết đang làm dạng gì
- MCQ: `p-8` rộng, prompt `text-xl` to nhưng options nhỏ — mất cân đối
- `ErrorCorrectionCard`: highlight lỗi bằng `line-through` nhưng không rõ user cần làm gì
- `RewriteCard`: `rows=2` quá nhỏ, instruction không nổi bật so với câu gốc
- `SessionSummary`: chỉ có % to + text — thiếu breakdown

**4. Tab Mẹo thi — task label không đủ nổi**
- Task label chỉ là `text-xs uppercase text-primary` — WT1 vs SP2 trông giống nhau
- Ví dụ trong `bg-muted/50 italic` — khó đọc

## Goals

- G1: Header hiển thị level badges, task tags, mastery progress
- G2: TheoryView — gộp "Khi nào dùng" + "Cấu trúc" thành 1 block; cải thiện example và mistake rendering
- G3: PracticeSession — thêm exercise kind badge; cải thiện từng card type; cải thiện SessionSummary
- G4: VstepTipsView — task label rõ hơn, example dễ đọc hơn

## Non-goals

- Không thay đổi data model hay mock data
- Không thay đổi routing, search params, tab structure
- Không thay đổi business logic (mastery tracking, answer checking)
- Không thêm animation phức tạp

## Proposed solution

### 1. Header — thêm meta row

Sau `<p className="mt-3 ...summary">`, thêm một meta row:

```
[B1] [B2]   ·   [WT1] [WT2] [SP2]        đúng 12/15 · 80%
 level badges     task badges              mastery (nếu có)
```

- Level badges: `rounded-full border px-2 py-0.5 text-xs font-semibold` — màu neutral, không dùng bg màu
- Task badges: tương tự, text muted hơn
- Mastery: chỉ hiện nếu `mastery.attempts > 0`, dạng `text-xs text-muted-foreground tabular-nums`

Tuân thủ Rule 0.1b — không bọc icon+text thêm bg trang trí.

### 2. TheoryView

**Gộp "Khi nào dùng" + "Cấu trúc" thành 1 section:**
```
┌─────────────────────────────────────┐
│ Khi nào dùng                        │
│ <whenToUse text>                    │
│                                     │
│ Cấu trúc                            │
│ [S + V(s/es) + O]                   │
│ [S + do/does + not + V]             │
└─────────────────────────────────────┘
```

**Examples — tăng contrast:**
- Câu tiếng Anh: `text-sm font-semibold text-foreground` (tăng từ `font-medium`)
- Câu tiếng Việt: giữ `text-xs text-muted-foreground`
- Note: `text-xs text-primary` bỏ italic, thêm `·` prefix thay `→`
- Border left tăng từ `border-primary/30` lên `border-primary/50`

**CommonMistakes — dùng 2-column layout thay vì stacked:**
```
┌──────────────────────────────────────────┐
│ ✗ She go to school every day.            │  ← text-destructive, bg-destructive/5
│ ✓ She goes to school every day.          │  ← text-success, bg-success/5
│   Ngôi thứ ba số ít phải thêm -s/-es.   │  ← text-xs muted
└──────────────────────────────────────────┘
```
Mỗi mistake là 1 card riêng với 2 row màu rõ ràng, không dùng `line-through`.

### 3. PracticeSession

**Exercise kind badge** — hiện ở góc trên phải mỗi card:
```
kind → label:
"mcq"              → "Trắc nghiệm"
"error-correction" → "Sửa lỗi"
"fill-blank"       → "Điền từ"
"rewrite"          → "Viết lại"
```
Badge: `rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground`

**McqCard:**
- Giảm padding từ `p-8` xuống `p-6`
- Prompt giữ `text-xl` nhưng thêm `font-semibold` (đã có)
- Options: tăng padding từ `py-3` lên `py-3.5` để dễ tap

**ErrorCorrectionCard:**
- Thêm instruction rõ ràng: *"Phần gạch chân có lỗi. Nhập từ/cụm đúng vào ô bên dưới."*
- Highlight lỗi: đổi từ `line-through` sang `underline decoration-destructive decoration-2` + `text-destructive` — rõ hơn, không bị xóa mất text
- Input + button layout giữ nguyên

**RewriteCard:**
- Instruction: `text-sm font-semibold` thay vì `text-xs uppercase` — dễ đọc hơn
- Câu gốc: `rounded-xl bg-muted px-4 py-3 text-sm` — giữ nguyên
- Textarea: tăng `rows={3}`

**SessionSummary:**
- Giữ % to ở giữa
- Thêm dòng breakdown: `{correct} đúng · {total - correct} sai` dưới %
- Progress bar ngang thay vì chỉ text

### 4. VstepTipsView

**Task label** — dùng badge có border thay vì text thuần:
```tsx
<span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
  {TASK_LABELS[tip.task]}
</span>
```

**Example block** — bỏ italic, tăng contrast:
```tsx
<div className="mt-3 border-l-2 border-primary/40 pl-4">
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Ví dụ</p>
  <p className="text-sm text-foreground">{tip.example}</p>
</div>
```

## Alternatives considered

**A. Dùng Tabs component của shadcn/ui thay vì Link tabs**
Bỏ vì: hiện tại dùng URL search params cho tab state — đúng rule 8 (URL là nguồn state). Đổi sang shadcn Tabs sẽ mất URL state, back/forward không hoạt động.

**B. Tách TheoryView thành nhiều sub-component file**
Bỏ vì: TheoryView nhỏ, tách file tạo overhead không cần thiết. Gộp section trong cùng file là đủ.

**C. Dùng accordion cho TheoryView sections**
Bỏ vì: lý thuyết ngữ pháp nên đọc tuần tự, không nên ẩn. Accordion phù hợp cho FAQ/list dài, không phải content học.

## Risks / trade-offs

- **Gộp 2 section** (Khi nào dùng + Cấu trúc): nếu `whenToUse` dài, section sẽ cao. Chấp nhận — nội dung thực tế không quá dài.
- **CommonMistakes layout mới**: cần test dark mode vì dùng `bg-destructive/5` và `bg-success/5`.

## Rollout plan

Ship 1 lần, scope hẹp — chỉ đụng 3 files:
- `index.tsx` (header)
- `TheoryView.tsx`
- `PracticeSession.tsx`

## Implementation plan

1. `index.tsx` — thêm meta row (level badges + task tags + mastery) vào header
2. `TheoryView.tsx` — gộp section, cải thiện examples, redesign commonMistakes
3. `PracticeSession.tsx` — thêm kind badge, fix từng card, cải thiện SessionSummary
4. `index.tsx` — cải thiện VstepTipsView task label + example block
5. Biome format + tsc check + build

## Files affected

| File | Thay đổi |
|---|---|
| `routes/.../$pointId/index.tsx` | Header meta row + VstepTipsView styling |
| `routes/.../$pointId/-components/TheoryView.tsx` | Gộp section + examples + mistakes |
| `routes/.../$pointId/-components/PracticeSession.tsx` | Kind badge + card improvements + summary |

## Definition of done

- `bunx --bun tsc --noEmit` — 0 errors mới
- `bunx biome check` — 0 errors mới
- `bun run build` — pass
- Dark mode render đúng (test `bg-destructive/5`, `bg-success/5`)
- Keyboard navigation vẫn hoạt động (1-4 cho MCQ, Enter next)
