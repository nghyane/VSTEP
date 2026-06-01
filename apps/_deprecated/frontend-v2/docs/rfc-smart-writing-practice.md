# RFC: Smart Writing Practice — Redesign v2 (Sticker & Annotation Overhaul)

> **Phiên bản này thay thế RFC v1.** v1 đã ship được split-screen + 2 mode (free/smart) + mock annotation, nhưng sticker hiện tại **chưa đủ "đắt"**: không có line trỏ, nội dung quá mỏng (chỉ label), và sau khi nộp bài không có sticker ở lề chỉ rõ chỗ sai trên bài của user. RFC v2 tập trung fix 3 vấn đề đó.

---

## Problem (các điểm đau hiện tại)

Sau khi ship v1, khi QA lại UX thấy 3 lỗ hổng lớn:

### 1. Sticker bài mẫu quá sơ sài, không có đường nối

File hiện tại `SampleWithStickers.tsx`:
- Sticker chỉ là badge màu + số thứ tự + `section.title` (VD `"Mở đầu"`).
- Sticker đặt **phía trên paragraph** trong cùng card, không có mũi tên / line trỏ vào đoạn văn.
- Không có liên kết trực quan giữa **sticker** ↔ **cụm từ khóa** trong sample.
- User đọc sticker xong vẫn phải tự map "mục đích này ứng với câu nào" → mất focus.
- Cấu trúc câu (tab "Cấu trúc") tách rời hoàn toàn khỏi sample → user không biết cấu trúc `Despite + N/V-ing` đang **được dùng ở đâu** trong bài mẫu.

### 2. Editor không có sticker dàn ý trỏ vào đoạn user đang viết

- RFC v1 hứa "Sticker bên lề trái: label + mũi tên → trỏ vào vị trí tương ứng" nhưng `SmartWritingEditor.tsx` hiện chỉ có textarea + ghost-text autocomplete.
- Không có visual cue nào cho user biết "bạn đang viết đến đoạn số mấy trong outline", "đoạn tiếp theo cần nói gì".

### 3. Trang kết quả không có sticker trỏ vào bài user

File `AnnotatedFeedbackView.tsx` hiện tại:
- Có highlight inline (underline wavy) + click mở 1 `AnnotationDetail` card **bên dưới** bài viết.
- Không có **marginalia** (sticker lề) gắn với từng đoạn/lỗi.
- Feedback mức "paragraph" hoàn toàn thiếu — user không biết đoạn nào **quá ngắn cần phát triển ý**, đoạn nào **lạc đề**, đoạn nào **thiếu từ nối**.
- 3 card tóm tắt (Strengths/Improvements/Rewrites) tách khỏi bài viết → user phải nhảy mắt đi lại để map.

---

## Goals (v2)

1. **Sticker + connector line**: mỗi sticker có SVG/CSS line cong nối vào **đúng cụm từ / paragraph** nó chú thích, trên cả bài mẫu và editor.
2. **Sticker nhiều tầng thông tin (content-rich)**: không chỉ label. Mỗi sticker có: mục đích đoạn → cấu trúc câu chính được dùng → phrase mở đoạn → lý do tại sao (mini).
3. **Highlight cấu trúc câu trong bài mẫu**: cụm như `Despite the rain` được tô màu + khi hover → popover giải thích pattern + link nhảy sang tab Cấu trúc.
4. **Editor stickers động**: khi user gõ tới `\n\n` thứ n, sticker đoạn n+1 xuất hiện ở lề với gợi ý **mục đích + opener phrase**.
5. **Result margin stickers**: bên cạnh bài đã nộp, mỗi paragraph có 1 sticker "đánh giá đoạn" (length OK / cần thêm ý / đi đúng requirement chưa); các annotation inline cũng có sticker ở lề với connector line trỏ vào span.
6. **Connected summary**: click item trong card "Cần cải thiện" → cuộn tới đúng annotation + highlight flash.

## Non-goals

- Không dùng canvas / thư viện diagram nặng (react-xarrows, react-archer...). Dùng SVG inline + positioning bằng ref.
- Không làm AI chấm realtime.
- Không thay đổi data shape của `WritingExercise` nhiều — chỉ **annotate thêm** sample bằng markers, không viết lại sample.
- Không làm collaborative / voice input.

---

## Proposed solution

### A. Sticker System v2 — Anchored + Connector Line

**Concept**: tách khái niệm sticker thành 3 primitive tái sử dụng cho cả 3 ngữ cảnh (sample, editor, result):

```
┌─────────────────────────────────────────────────┐
│  <StickerLayer>                                  │
│   ┌────────────┐                                 │
│   │ Sticker 1  │╲                                │
│   │ (marginal) │ ╲___ connector SVG (cubic)      │
│   └────────────┘     ╲                           │
│                       ╲                          │
│                     ┌───▼──────────────────────┐ │
│                     │ Target: <AnchorPoint />  │ │
│                     │   cụm từ hoặc paragraph  │ │
│                     └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**3 primitive:**

```tsx
// components/practice/writing/sticker/StickerLayer.tsx
<StickerLayer>           // container relative, chứa SVG overlay + children
<StickerNote id="..." side="left" tone="teach">
  ... nội dung sticker ...
</StickerNote>
<StickerAnchor id="..."> // wrap cụm từ hoặc paragraph target
  Dear Sir,
</StickerAnchor>
```

**Cách hoạt động:**
- `StickerLayer` dùng `ResizeObserver` + `getBoundingClientRect()` để lấy vị trí của mỗi `StickerNote` và `StickerAnchor` có cùng `id`.
- Render 1 `<svg class="pointer-events-none absolute inset-0">` overlay, vẽ 1 cubic Bezier từ **cạnh phải của sticker** → **cạnh trái của anchor** (với offset tránh đâm vào text).
- Line màu theo `tone` (teach = amber, warn = destructive, ok = success). Endpoint có dot nhỏ ở anchor.
- Re-compute khi: resize, scroll trong container (sample scrollable), content thay đổi (editor gõ).
- Trên mobile (`< lg`): sticker chuyển thành **inline chip phía trên anchor** (không vẽ line), reuse cùng component với prop `layout="stacked"`.

**Lý do tự build thay vì dùng lib:**
- Nhu cầu rất cụ thể (1-way, ngang, cong nhẹ) — 1 SVG path là đủ.
- Tránh thêm dep ~30-80KB cho feature nhỏ.
- Control được z-index, performance, dark mode.

### B. Sticker trên BÀI MẪU — content-rich + structure highlighting

**Mỗi sticker (mỗi paragraph) chứa:**

```
┌─── STICKER (amber, ở lề phải sample) ──────────────┐
│ ① Mở bài — Lời chào & nêu mục đích                 │
│                                                     │
│ 🎯 Mục đích: Thiết lập tone formal + câu mở gọn    │
│                                                     │
│ 🧱 Cấu trúc chính dùng trong đoạn:                 │
│   • I am writing to + V        [B1]   ← click      │
│   • would like to + V          [B1]   ← click      │
│                                                     │
│ 💡 Opener: "Dear [Title] [Name],"                  │
│                                                     │
│ ⚠ Tránh: "Hi" (informal) trong thư trang trọng     │
└─────────────────────────────────────────────────────┘
      ╲
       ╲___ connector line
            ╲
             ▼
       ┌──────────────────────────────────────┐
       │ Dear Mr. Smith,                       │  ← StickerAnchor
       │ I am writing to inform you that...    │
       └──────────────────────────────────────┘
```

**Thành phần bắt buộc (4 tầng):**

| Tầng | Tên | Nội dung | Vì sao cần |
|------|-----|----------|-----------|
| 1 | **Purpose** | 1 dòng giải thích mục đích rhetorical của đoạn (không lặp `section.title`) | User hiểu "writing move", không copy máy móc |
| 2 | **Structures used** | 1-3 pattern câu từ `WRITING_STRUCTURES` được **thực sự dùng** trong đoạn + tag level | Kết nối bài mẫu ↔ tab Cấu trúc — đây là điều user hỏi |
| 3 | **Opener** | Cụm bắt đầu đoạn (có trong `sentenceStarters`) | Scaffold cho user đang bí |
| 4 | **Pitfall** | 1 lỗi phổ biến nên tránh (formal/informal, chia động từ...) | Dạy đối chiếu, không chỉ bắt chước |

**Highlighting cụm cấu trúc TRONG bài mẫu:**

Sample answer được annotate ở data layer bằng markers (format `[[s:id]]...[[/s]]`):

```
"...I am writing to [[s:struct-writing-to]]inform you[[/s]] about..."
```

Render: cụm bên trong `[[s:...]]...[[/s]]` thành `<mark>` màu primary mờ, hover → popover nhỏ:
```
┌─ Cấu trúc B1 ────────────────┐
│ I am writing to + V           │
│ "Tôi viết thư để..."          │
│ [→ Xem thêm cấu trúc B1]      │
└───────────────────────────────┘
```
Click popover → switch sang tab **Cấu trúc** với item được scroll + flash.

**Sticker ↔ highlighted phrase liên kết:**
Khi hover 1 `pattern` trong sticker (tầng 2) → mark tương ứng trong sample **glow/pulse** 800ms để user thấy nó ở đâu.

### C. Sticker trong EDITOR khi đang viết (Smart mode)

**Visual khi user đang ở đoạn 2 (đã viết xong đoạn 1):**

```
┌─── EDITOR ────────────────────────────────────────┐
│                                                    │
│  ✓ ① Mở đầu ─ Dear Mr. Smith, ...                  │  (sticker đoạn 1 = done, collapsed)
│                                                    │
│  Dear Mr. Smith,                                   │
│  I am writing to inform you...                     │
│                                                    │
│  ┌─ ② Nội dung chính ─────────┐                    │  (sticker đoạn 2 = active)
│  │ 🎯 Trình bày lý do chính   │╲                   │
│  │ 🧱 Thử dùng: Despite + N   │ ╲___               │
│  │ 💡 Bắt đầu: "The reason..."│     ╲              │
│  └────────────────────────────┘      ▼             │
│  [caret ở đây] ▮                                   │
│                                                    │
│  ○ ③ Đề xuất cách bù đắp (pending, mờ)             │
│  ○ ④ Lời kết (pending, mờ)                         │
└────────────────────────────────────────────────────┘
```

**Logic:**
- Đếm `\n\n` trong `value` → xác định user đang ở paragraph index nào.
- Sticker states: `done` (collapsed, tick) / `active` (expanded, connector trỏ vào dòng đang gõ) / `pending` (mờ 40%, không connector).
- Anchor của sticker active = **caret line** — lấy vị trí caret bằng 1 mirror div (đã có sẵn trong `SmartWritingEditor` cho autocomplete, dùng lại).
- Sticker `active` có CTA nhỏ: "Dùng opener này" → chèn phrase vào caret.
- Khi `wordCount` của đoạn < gợi ý tối thiểu (derived từ `(minWords / numSections)`), sticker hiện badge "Còn thiếu ~X từ".

### D. Trang KẾT QUẢ — Margin stickers trỏ vào bài user

**Layout mới (thay cho 1 block + summary rời):**

```
┌────────────────────────────┬───────────────────────────────────┐
│  LỀ TRÁI (paragraph cards) │  BÀI VIẾT (có highlight inline)   │
│                             │                                   │
│  ① Mở đầu      ✓ Good       │  Dear Sir,                         │
│  • Tone formal OK           │╲ I [am writing] to [inform you]    │
│  • 22 từ                    │ ╲ about the recent changes...      │
│                             │  ▼                                 │
│                             │                                   │
│  ② Nội dung    ⚠ Cần mở rộng│  I [wants] to apply for...        │
│  • Mới 18 từ (gợi ý 40-50) │╲   ↑─ sticker lề phải:             │
│  • Thiếu cấu trúc phức      │ ╲    [Chia động từ]                │
│  • Lạc đề câu 3?            │  ▼   "I" → "want"                  │
│                             │     [Sửa thử]                     │
│                             │                                   │
│  ③ Kết thúc    ✓ OK         │  Despite [I went out]...          │
│                             │    ↑─ [Sai Despite + V]            │
│                             │        "Despite + N/Ving"          │
└────────────────────────────┴───────────────────────────────────┘
```

**3 loại sticker ở trang kết quả:**

1. **Paragraph sticker (lề trái)** — 1 card mỗi paragraph của user:
   - Trạng thái: `good` / `warn` / `bad` (có icon + màu).
   - Metrics: word count đoạn + so với suggested range.
   - Checklist: `requiredPoints` đoạn này đã cover chưa (map bằng keyword match).
   - Gợi ý mở rộng: "Thử thêm ví dụ cụ thể / lý do chi tiết hơn / dùng từ nối".
   - Click sticker → scroll + highlight paragraph bên phải.

2. **Annotation sticker (lề phải, inline với span lỗi)** — thay vì detail card ở dưới:
   - Sticker nhỏ hơn paragraph sticker, có connector line cong trỏ vào `<mark>`.
   - Tự stack theo thứ tự dọc, tránh overlap bằng layout algo (xem Risks).
   - Có action button "Thay bằng gợi ý" / "Bỏ qua".

3. **Cohesion sticker (giữa 2 paragraph)** — gợi ý dùng từ nối:
   - Xuất hiện ở khoảng trống `\n\n` khi AI detect chuyển đoạn cụt.
   - VD: "Thử thêm 'However,' / 'In addition,' ở đầu đoạn này".

**Summary cards vẫn giữ nhưng connected:**
- Mỗi bullet trong "Cần cải thiện" → có icon `→` → click scroll tới annotation tương ứng.
- Mỗi bullet trong "Gợi ý viết lại" → inline diff (strikethrough original + highlight improved).

---

## Data model changes

### 1. Bài mẫu — annotate structure markers

Thay vì sửa `sampleAnswer` thành string có `[[s:...]]`, tách thành field mới để giữ backward compat:

```ts
interface WritingExercise {
  // existing...
  sampleAnswer: string                        // giữ nguyên (plain text fallback)
  sampleAnnotations?: readonly {              // NEW
    sectionIndex: number                      // 0-based, khớp với outline
    purpose: string                           // tầng 1 của sticker
    structuresUsed: readonly {
      patternId: string                       // ref tới WRITING_STRUCTURES entry
      level: TargetLevel
      /** Range trong sampleAnswer (tính bằng character offset) */
      range: { start: number; end: number }
    }[]
    opener: string                            // tầng 3
    pitfall?: string                          // tầng 4
  }[]
}
```

`WRITING_STRUCTURES` cần thêm `id` để ref từ annotations:

```ts
interface StructureEntry {
  id: string           // NEW — stable id, e.g. "b1-writing-to"
  pattern: string
  example: string
  vietnamese: string
}
```

### 2. Mock grading — thêm paragraph-level feedback

```ts
interface AnnotatedWritingFeedback {
  annotations: readonly WritingAnnotation[]   // inline (đã có)
  paragraphs: readonly {                      // NEW
    index: number
    wordCount: number
    suggestedWordRange: { min: number; max: number }
    status: "good" | "warn" | "bad"
    checklist: readonly { point: string; covered: boolean }[]
    notes: readonly string[]                  // "Thử thêm ví dụ cụ thể"
  }[]
  cohesionHints: readonly {                   // NEW
    afterParagraphIndex: number
    suggestion: string                        // "Thử thêm 'However,' ở đầu đoạn sau"
  }[]
  strengths: readonly string[]
  improvements: readonly { message: string; explanation: string; annotationIdx?: number }[]  // thêm link
  rewrites: readonly { original: string; improved: string; reason: string }[]
}
```

`buildAnnotatedWritingFeedback(text, exercise)` giờ nhận thêm `exercise` để biết `minWords`, `requiredPoints`, `outline` → tính paragraph status.

---

## Files affected

**New:**
- `components/practice/writing/sticker/StickerLayer.tsx` — container + SVG connector engine
- `components/practice/writing/sticker/StickerNote.tsx` — the card itself, tone variants
- `components/practice/writing/sticker/StickerAnchor.tsx` — target wrapper (inline span hoặc block)
- `components/practice/writing/sticker/useConnectorGeometry.ts` — hook tính path SVG từ ref pairs
- `components/practice/writing/SampleStickerContent.tsx` — render 4-tier content cho sample (reuse ở editor)
- `components/practice/writing/EditorOutlineStickers.tsx` — overlay sticker dàn ý lên SmartWritingEditor
- `components/practice/writing/ResultParagraphSticker.tsx` — paragraph-level sticker ở result
- `components/practice/writing/ResultAnnotationSticker.tsx` — inline annotation sticker w/ connector
- `lib/practice/writing-sample-annotations.ts` — helper parse + merge `sampleAnnotations` với text

**Modified:**
- `lib/practice/writing-structures.ts` — thêm `id` cho mỗi entry
- `lib/mock/writing.ts` — thêm `sampleAnnotations` cho 6 đề (có thể rollout dần, default undefined)
- `lib/practice/mock-ai-grading.ts` — `buildAnnotatedWritingFeedback` nhận exercise, trả thêm `paragraphs` + `cohesionHints`
- `components/practice/writing/SampleWithStickers.tsx` — rewrite dùng StickerLayer + sample highlights
- `components/practice/writing/SmartWritingEditor.tsx` — compose với `EditorOutlineStickers` overlay
- `components/practice/writing/AnnotatedFeedbackView.tsx` — rewrite layout 2-cột + margin stickers
- `components/practice/writing/WritingSmartSidebar.tsx` — cross-link sticker hover ↔ tab Cấu trúc (scroll + flash)

**Unchanged:**
- `WritingConfigBar`, `StructurePhrasesList` (chỉ thêm `data-structure-id` để scroll target)
- `useWritingSession`, `result-storage`, routes

---

## Alternatives considered

1. **Dùng `react-xarrows` hoặc `react-archer`**: đơn giản hơn nhưng thêm ~50KB, kém kiểm soát animation/dark mode, khó tích hợp với scroll container. → Tự build SVG.
2. **Sticker dạng popover khi click word**: user phải khám phá, không proactive dạy được. Giữ sticker cố định bên lề.
3. **Highlight cấu trúc bằng icon nhỏ (underline + chỉ số)** thay vì `<mark>`: ít intrusive nhưng khó nhìn; user test sơ bộ thấy `<mark>` dễ scan hơn.
4. **Paragraph feedback dưới dạng accordion dưới bài viết** (không phải margin): đỡ tốn chỗ nhưng mất context với bài viết. Margin thắng vì screen size ≥ lg user có đủ chỗ.
5. **Đặt sample + cấu trúc chung 1 view (merged tab)** thay vì 3 tabs riêng: cân nhắc nhưng 3 tabs giữ mental model rõ, chỉ cần **cross-link** thay vì merge.

---

## Risks / trade-offs

| Risk | Mitigation |
|------|-----------|
| **Connector line overlap** khi nhiều sticker cùng trỏ vào anchor gần nhau (nhất là trang kết quả) | Layout algo: sort stickers theo y của anchor, đẩy dọc để min-gap 12px; nếu vẫn overlap → giảm số sticker hiển thị đồng thời, còn lại ẩn sau "+3 more" |
| **SVG path bị lệch** khi content resize (font load, image) | `ResizeObserver` trên cả `StickerLayer` và mọi anchor; debounce 50ms recompute |
| **Mobile không đủ chỗ cho margin stickers** | Fallback `layout="stacked"`: sticker chuyển thành card phía trên anchor, không vẽ line. Paragraph sticker dùng accordion collapse |
| **Sample annotations thủ công** cho 6 đề — tốn effort content | Phase 1 chỉ annotate 2 đề đầu mỗi part (tổng 4 đề), 2 đề còn lại degrade gracefully về v1 sticker (chỉ label) |
| **Performance**: editor recompute connector mỗi keystroke | Chỉ recompute khi số paragraph thay đổi (không phải mỗi char), dùng `useDeferredValue` |
| **Accessibility**: connector line không có ARIA nghĩa | Sticker có `aria-describedby` trỏ tới anchor id; screen reader đọc sticker → "chú thích cho đoạn X"; SVG decorative `aria-hidden` |
| **Stacking algorithm phức tạp** | Giới hạn scope: chỉ cần tránh overlap **dọc**, không cần route around (stickers ở cột riêng biệt, anchor ở cột text — 2 cột không đè nhau) |

---

## Rollout plan

1. **Phase 2.1** (RFC này, 1 sprint): Build sticker primitives + rewrite sample/editor/result stickers. Annotate 4/6 đề.
2. **Phase 2.2**: Annotate full 6 đề + thêm cohesion hints logic.
3. **Phase 2.3**: Replace mock grading bằng AI API thật (separate RFC).

### Task order (ordered)

1. Tạo `sticker/StickerLayer` + `StickerNote` + `StickerAnchor` + `useConnectorGeometry` — standalone, có storybook-style test page tạm ở `/dev/stickers`.
2. Thêm `id` cho `WRITING_STRUCTURES`, thêm `sampleAnnotations` schema + annotate 4 đề.
3. Rewrite `SampleWithStickers` dùng StickerLayer + render highlights cấu trúc + popover.
4. Cross-link sticker ↔ tab Cấu trúc (scroll + flash) trong `WritingSmartSidebar`.
5. Build `EditorOutlineStickers` — compose vào `SmartWritingEditor` với overlay.
6. Mở rộng `buildAnnotatedWritingFeedback` trả `paragraphs[]` + `cohesionHints[]`.
7. Rewrite `AnnotatedFeedbackView` — layout 2-cột + margin paragraph sticker + annotation sticker w/ connector.
8. Connected summary: click improvement bullet → scroll tới annotation.
9. Mobile stacked fallback.
10. Cleanup + tsc + lint.

### Definition of Done

- [ ] Sticker primitives hoạt động: connector line render đúng ở viewport resize, scroll container, dark mode.
- [ ] Sample: mỗi paragraph có sticker 4-tầng + ≥2 cụm cấu trúc được highlight + popover mở tab Cấu trúc.
- [ ] Editor smart mode: sticker dàn ý hiện theo paragraph hiện tại của user, có connector vào dòng caret, states done/active/pending.
- [ ] Result: mỗi paragraph có sticker lề trái với status + wordcount + checklist; annotation có sticker lề phải với connector; cohesion hints xuất hiện giữa paragraph khi thiếu từ nối.
- [ ] Click summary → scroll + flash highlight annotation.
- [ ] Mobile (< lg): sticker stacked, không line, vẫn usable.
- [ ] Keyboard navigation: Tab qua sticker, Enter mở detail/popover.
- [ ] tsc pass + biome check clean.
- [ ] Không có layout shift / flicker khi load sample.
