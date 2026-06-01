# RFC 0008 — Redesign 4 Skills Practice Flow

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |
| Depends on | [0002 — Design System v3](./0002-design-system.md) |
| Scope | `src/routes/_app.luyen-tap.ky-nang.*`, `src/features/practice/components/*` |

## Summary

Redesign toàn bộ luồng luyện tập 4 kỹ năng (Listening, Reading, Writing, Speaking) theo RFC 0002 Duolingo gamification. Chia làm 3 trang: Hub → Session → Result. Áp dụng depth border, skill-coded accent, progress gamification, no-emoji-Unicode.

## Motivation

### Pain points hiện tại

| Trang | Vấn đề |
|---|---|
| **Hub** (`/ky-nang`) | Tab bar underline nhạt, sidebar "Loại câu hỏi" chung chung, ExerciseCard generic (không skill-coded), Card dùng pattern cũ (`border` flat, không depth) |
| **Listening Session** | Audio player fixed ở top, không gamified. MCQ list dài cuộn xuống, thiếu progress visual. Footer bar có StatusText rời rạc |
| **Reading Session** | Split panel không responsive tốt (mobile = stack, mất context passage). PassagePanel không có highlight/interactive affordance |
| **Writing Session** | Tab "Viết bài / Bài mẫu" bằng pill muted — không rõ skill color. Editor không có milestone (50 từ / min / max). Footer chỉ show word count thô |
| **Speaking Session** | ShadowingPanel tốt rồi (đã có AudioBar + recorder) nhưng thiếu visual feedback khi shadow done, nav pills giống MCQ (cùng button pattern) |
| **Result page** | McqResultSummary hiển thị score dạng text, thiếu celebration/encouragement, không có skill-coded confetti |

### Design debt từ RFC 0002 audit

- ExerciseCard dùng `border` đơn (không có depth border signature)
- Các session header dùng `text-skill-*` cho label nhưng background không có skill accent
- Progress bars dùng `bg-muted` (không có inner shadow 3D theo RFC 0002 #5)
- Status badges chưa tuân thủ rule chip 3 loại (status badge, tag hashtag, skill chip)

## Design philosophy

### Skill-coded accent xuyên suốt

Mỗi skill có 1 màu định danh (`--skill-listening/reading/writing/speaking`). Màu này xuyên suốt:

1. **Hub**: tab underline
2. **Session header**: eyebrow label + progress bar color
3. **Session footer**: accent bar trên cùng footer
4. **Result**: celebration card border-b-4 skill color

### Depth border mọi card

Tất cả card trong luồng practice phải dùng neutral depth:
```
rounded-2xl border-2 border-[oklch(0.88_0.005_260)]
border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card
```

Hoặc semantic depth khi highlight:
```
border-skill-{X}/20 border-b-4 border-b-skill-{X}/50 bg-skill-{X}/5
```

### Progress gamification

- Progress bar 3D: `h-3 rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]` với fill `bg-skill-{X} shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]`
- Step chips (Nav bar) thay vì MCQ pills — circle `size-8`, số bên trong, depth border
- Milestone markers ở progress (50%, 100%) với GameIcon

### No emoji Unicode

Thay bằng Icons8 PNG:
- `trophy.png` — result >= 80%
- `target.png` — result 50-79%
- `star.png` — result có đạt min words
- `fire.png` — streak maintained

### Celebration pattern

Khi submit thành công:
- Score card `border-success border-b-success/50 bg-success/10`
- Animated check icon + GameIcon trophy
- Encouraging copy theo bảng RFC 0002 (90-100%, 70-89%, 50-69%, <50%)
- Không confetti emoji, không particle spam

## Reference-level explanation

### Trang 1: Skill Hub (`/luyen-tap/ky-nang`)

```
┌───────────────────────────────────────────────────────┐
│ ← Luyện tập                                            │
│                                                        │
│ Luyện tập kỹ năng                                      │
│                                                        │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│ │ Nghe │ │ Đọc  │ │ Nói  │ │ Viết │  ← Tab bar 3D     │
│ └──▼───┘ └──────┘ └──────┘ └──────┘     (depth border)│
│   skill color fill on active                           │
│                                                        │
│ ┌────────────┬───────────────────────────────┐        │
│ │  Part 1    │  Hub info banner (skill color)│        │
│ │  Part 2 •  │  "Listening — Part 1"         │        │
│ │  Part 3    │  3 bài hoàn thành / 12 bài    │        │
│ │            │                               │        │
│ │  (sidebar  │  [Progress bar overall]       │        │
│ │   depth    │                               │        │
│ │   border)  │  ┌─────┐ ┌─────┐ ┌─────┐     │        │
│ │            │  │Card │ │Card │ │Card │     │        │
│ │            │  └─────┘ └─────┘ └─────┘     │        │
│ │            │  ┌─────┐ ┌─────┐ ┌─────┐     │        │
│ │            │  │Card │ │Card │ │Card │     │        │
│ │            │  └─────┘ └─────┘ └─────┘     │        │
│ └────────────┴───────────────────────────────┘        │
└───────────────────────────────────────────────────────┘
```

**Thay đổi chính:**

| Element | Before | After |
|---|---|---|
| Tab bar | `border-b` underline thin | 4 tab buttons depth border, active = skill color fill |
| Sidebar | flat bg-muted/50 | rounded-2xl depth border + GameIcon cho mỗi category |
| Hub info banner | (không có) | MỚI — skill accent card hiển thị overall progress |
| ExerciseCard | `border` flat | depth border neutral, hover shadow-md, status badge rõ |

**ExerciseCard redesign:**
- Header: GameIcon (pencil/book/headphones/microphone) theo skill thay vì `FileText` generic
- Status: chip 3 loại rõ — "Chưa làm" (muted), "Đang làm" (warning), "Hoàn thành X%" (success)
- Progress bar 3D khi đang làm hoặc hoàn thành
- CTA button built-in depth border (primary / outline)

### Trang 2: Session — Listening (`/ky-nang/nghe/$exerciseId`)

```
┌───────────────────────────────────────────────────────┐
│ LISTENING — PART 1                                    │ ← skill eyebrow
│ Hội thoại ngắn #3                                     │
│ 8 câu · 15 phút                                        │
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🎧 [Audio player với subtitle]                    │ │ ← skill accent card
│ │ ━━━━━━●━━━━━━━━━━━━━━  0:42 / 2:15                │ │   bg-skill-listening/5
│ │                                                    │ │
│ │ [Subtitle đang phát, highlight word-by-word]      │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ Tiến độ: 3/8 câu · ━━━━━━━━━━━━━━━━━━ 37%             │ ← progress 3D
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Câu 1. What time does the meeting start?          │ │
│ │   ○ A. 9:00 AM                                    │ │ ← MCQ option
│ │   ● B. 10:00 AM  ← selected                       │ │   depth border
│ │   ○ C. 11:00 AM                                   │ │
│ │   ○ D. 12:00 PM                                   │ │
│ └───────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Câu 2. Who is the speaker?                        │ │
│ │   ...                                              │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ [...]                                                  │
│                                                        │
│═══════════════════════════════════════════════════════│
│ ▼ Footer skill-coded accent bar (listening blue)      │
│                                                        │
│ [Step chips 1-2-3-4-5-6-7-8]  [Nộp bài →]            │
└───────────────────────────────────────────────────────┘
```

**Thay đổi:**

- Audio player trong card depth border bg-skill-listening/5
- Thêm **progress bar tổng 3D** (inset shadow) trên list MCQ
- MCQ options depth border, active/selected có border skill color
- Footer: thay nav pills bằng **step chips** (circle số, có tick mark khi answered)
- Skill accent bar 4px trên cùng footer

### Trang 2: Session — Reading (`/ky-nang/doc/$exerciseId`)

```
┌───────────────────────────────────────────────────────┐
│ READING — PART 2                                       │
│ Đọc hiểu đoạn văn #5 · 6 câu · 20 phút                 │
│                                                        │
│ ┌───────────────────────┬─────────────────────────┐  │
│ │ 📖 Passage             │ 📝 Questions             │  │
│ │ (max-w fit text 65ch)  │ (scroll independent)     │  │
│ │                         │                          │  │
│ │ [Passage text          │ Tiến độ 2/6 ━━━━━ 33%    │  │
│ │  highlight-on-hover]   │                          │  │
│ │                         │ ┌──────────────────────┐ │  │
│ │                         │ │ Câu 1. ...           │ │  │
│ │                         │ │   A/B/C/D            │ │  │
│ │                         │ └──────────────────────┘ │  │
│ │                         │                          │  │
│ │  (sticky scroll)       │ ...                      │  │
│ └───────────────────────┴─────────────────────────┘  │
│═══════════════════════════════════════════════════════│
│ ▼ Footer skill-coded (reading green)                  │
│ [Step chips]  [Nộp bài]                               │
└───────────────────────────────────────────────────────┘
```

**Thay đổi:**

- Split panel: `lg:grid-cols-[1fr_1.1fr]` — passage chiếm nhiều hơn
- Passage panel: depth border bg-skill-reading/5
- Questions panel: depth border neutral, sticky progress bar trên đầu
- Mobile: passage collapse thành accordion ở đầu, MCQ full-width
- InteractivePassage highlight giữ nguyên nhưng update style: selection cue = underline skill-reading thay vì bg

### Trang 2: Session — Writing (`/ky-nang/viet/$exerciseId`)

```
┌───────────────────────────────────────────────────────┐
│ WRITING — TASK 1                                       │
│ Viết thư phản hồi · 120-150 từ · 25 phút               │
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Đề bài                                            │ │ ← skill accent card
│ │ [Prompt text]                                     │ │   bg-skill-writing/5
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│   ┌───────────────┬───────────────┐                   │
│   │ [Viết bài] ●  │  Bài mẫu       │  ← tab bar       │
│   └───────────────┴───────────────┘     (depth border)│
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Word count: 87 / 120-150  ━━━━━━━━ 58%            │ │ ← milestones
│ │   🎯 min(120) ━━━━━━ 🏆 optimal(135) ━━ max(150)  │ │   marker
│ │                                                    │ │
│ │ [Editor — smart autocomplete]                     │ │
│ │                                                    │ │
│ │ (bg-background, border-2 focus-within:border-     │ │
│ │  skill-writing)                                   │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│═══════════════════════════════════════════════════════│
│ ▼ Footer skill-coded (writing purple)                 │
│ 87 / 120-150 từ           [Nộp bài →]                 │
└───────────────────────────────────────────────────────┘
```

**Thay đổi:**

- Prompt card: bg-skill-writing/5 với depth border skill color
- Tab bar: 2 tabs depth border, active = skill-writing accent
- **Word count progress** với 2 milestone markers (min/max), fill color đổi theo range:
  - `< min`: `bg-warning` (chưa đủ)
  - `min ≤ x ≤ max`: `bg-success` (đạt)
  - `> max`: `bg-destructive` (vượt)
- Editor focus state: `border-skill-writing` thay vì primary
- Footer: thay "tròn" bằng depth border button; word count có màu theo range

### Trang 2: Session — Speaking (`/ky-nang/noi/$exerciseId`)

```
┌───────────────────────────────────────────────────────┐
│ SPEAKING — B1                                          │
│ Mô tả hình ảnh #2 · 5 câu · 10 phút                    │
│                                                        │
│ Tiến độ: 2/5 câu đã ghi  ━━━━━━━━━━━ 40%              │
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Câu 2 / 5                                         │ │ ← skill accent card
│ │                                                    │ │   bg-skill-speaking/5
│ │ [ Câu mẫu ] (rounded-xl bg-background p-5)        │ │
│ │ "The picture shows a family having dinner..."      │ │
│ │ Bức tranh cho thấy một gia đình đang ăn tối...     │ │
│ │                                                    │ │
│ │ ┌──────────────────────────────────────┐          │ │
│ │ │ 🔊 Nghe câu  [Tốc độ 1x]             │          │ │
│ │ │  ▶ ━━━━●━━━━━━━━  1.2s / 3.5s        │          │ │
│ │ └──────────────────────────────────────┘          │ │
│ │                                                    │ │
│ │         ┌────────────────────┐                     │ │
│ │         │ 🎤 Bắt đầu nhại    │  ← bigger CTA      │ │
│ │         └────────────────────┘                     │ │
│ │                                                    │ │
│ │ [Bản ghi của bạn — audio controls]                │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│═══════════════════════════════════════════════════════│
│ ▼ Footer skill-coded (speaking orange)                │
│ ● ● ○ ○ ○  (nav pills — đã ghi)       [Nộp bài]       │
└───────────────────────────────────────────────────────┘
```

**Thay đổi:**

- Overall progress bar 3D trên đầu
- Shadowing card: depth border bg-skill-speaking/5 (hiện đang `bg-muted/50`)
- Record button: size `h-14` full rounded primary, hover pulse
- Nav pills: thay vì 8 ô vuông, dùng circle dots với tick mark khi done
- Khi submit: celebration "Bạn đã ghi âm X/Y câu"

### Trang 3: Result (`*/ket-qua`)

Pattern chung cho cả 4 skills:

```
┌───────────────────────────────────────────────────────┐
│ ← Về danh sách                                         │
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🏆 GameIcon trophy (96x96)                        │ │ ← celebration card
│ │                                                    │ │   skill accent + success
│ │      85%                                           │ │   border-b-success/50
│ │    text-5xl                                        │ │
│ │                                                    │ │
│ │ Xuất sắc! Bạn trả lời đúng 17/20 câu              │ │ ← copy theo RFC 0002
│ │                                                    │ │
│ │ [Progress bar 3D success]                         │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Chi tiết từng câu                                 │ │
│ │                                                    │ │
│ │ Câu 1  ✓ Đúng                                     │ │ ← per-question
│ │ Câu 2  ✗ Sai  (đáp án đúng: B)                    │ │   review list
│ │  → Giải thích: ...                                │ │
│ │                                                    │ │
│ │ [...]                                              │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ [Làm lại]  [Về danh sách]  [Đề tiếp theo →]           │
└───────────────────────────────────────────────────────┘
```

**Special case:**
- **Writing result**: thay score bằng `AnnotatedFeedbackView` (đã có) nhưng wrap trong skill-writing accent
- **Speaking result**: list câu đã ghi với audio playback + self-rating button

## Component changes summary

### Tạo mới

| Component | Path | Lý do |
|---|---|---|
| `SkillHubBanner` | `features/practice/components/SkillHubBanner.tsx` | Banner skill-coded với overall progress |
| `SkillStepChips` | `features/practice/components/SkillStepChips.tsx` | Circle step chips thay McqNavBar (keep legacy for backward compat) |
| `SessionProgressBar` | `features/practice/components/SessionProgressBar.tsx` | 3D progress bar shared 4 skills |
| `WordCountMilestones` | `features/practice/components/writing/WordCountMilestones.tsx` | Writing-specific progress với min/max markers |
| `CelebrationCard` | `features/practice/components/CelebrationCard.tsx` | Result celebration shared |

### Cập nhật

| Component | Path | Thay đổi |
|---|---|---|
| `ExerciseCard` | `features/practice/components/SkillPageLayout.tsx` | Depth border, skill-coded GameIcon |
| `SkillSidebar` | `features/practice/components/SkillPageLayout.tsx` | Depth border, skill accent on active |
| `McqQuestionList` | `features/practice/components/McqQuestionList.tsx` | MCQ options depth border, skill accent |
| `McqNavBar` | `features/practice/components/McqNavBar.tsx` | → `SkillStepChips` (alias giữ import cũ) |
| `McqResultSummary` | `features/practice/components/McqResultSummary.tsx` | → dùng `CelebrationCard` mới |
| `McqSubmitBar` | `features/practice/components/McqSubmitBar.tsx` | Footer skill-coded accent bar |
| `AudioSubtitlePlayer` | `features/practice/components/AudioSubtitlePlayer.tsx` | Wrap in skill accent card |
| `PassagePanel` | `routes/.../doc/.../PassagePanel.tsx` | Skill accent + interactive highlight updated |
| `SmartWritingEditor` | `features/practice/components/writing/SmartWritingEditor.tsx` | Focus skill-writing, word count → milestones |
| `ShadowingPanel` | `routes/.../noi/.../ShadowingPanel.tsx` | Skill accent card, bigger record CTA |

### Giữ nguyên

- `AnnotatedFeedbackView` + parts (đã compliant)
- `StickerNote`, `StickerLayer`, `StickerAnchor`
- `InteractivePassage` (chỉ update highlight color)
- All 4 session state hooks (`useListeningSession`, `useReadingSession`, `useWritingSession`, `useSpeakingSession`)
- Data layer (queries, progress, result-storage)

## Implementation plan

### Phase 1 — Shared primitives (1 PR)

Tạo components mới dùng chung:
- `SessionProgressBar` (3D progress)
- `SkillStepChips` (circle chips)
- `CelebrationCard` (result)

Unit test visual ở isolation (có thể mock data inline).

### Phase 2 — Hub redesign (1 PR)

- Update `ExerciseCard` (depth border, GameIcon, status chip)
- Update `SkillSidebar` (depth border, skill accent)
- Update tab bar trong `_app.luyen-tap.ky-nang.index.tsx`
- Thêm `SkillHubBanner` cho mỗi skill tab

Screenshot before/after.

### Phase 3 — Listening session (1 PR)

- Wrap `AudioSubtitlePlayer` trong skill-listening accent
- Thêm `SessionProgressBar` trên MCQ list
- Update `McqQuestionList` options → depth border
- Footer `McqSubmitBar` + accent bar
- Update nav bar → `SkillStepChips`

### Phase 4 — Reading session (1 PR)

- `PassagePanel` skill accent, `InteractivePassage` highlight update
- Mobile accordion wrap cho passage
- Reuse Phase 3 components (progress bar, step chips, footer)

### Phase 5 — Writing session (1 PR)

- Prompt card skill-writing accent
- Tab bar depth border
- `WordCountMilestones` component
- `SmartWritingEditor` focus update
- Footer dynamic color theo word count range

### Phase 6 — Speaking session (1 PR)

- `ShadowingPanel` skill-speaking accent
- Record button CTA bigger
- Nav pills → done-dots
- Reuse `SessionProgressBar`

### Phase 7 — Result pages (1 PR)

- Replace 4 `*/ket-qua.tsx` score cards bằng `CelebrationCard`
- Writing result giữ `AnnotatedFeedbackView` nhưng wrap
- Thêm "Đề tiếp theo" CTA nếu có bài kế tiếp trong cùng category

### Phase 8 — Polish (1 PR)

- Micro-animations (check tick when answered, pulse on submit)
- Loading states (`Session*Skeleton.tsx` match new card style)
- Empty states
- A11y pass (focus ring, aria-live cho progress changes)

## Acceptance criteria

Cho mỗi PR phase:

- [ ] `tsc --noEmit` pass
- [ ] `biome check` không tăng errors vs baseline
- [ ] `bun run build` pass
- [ ] Screenshot before/after cả desktop + mobile
- [ ] Tất cả skill color xuất hiện đúng chỗ (tab, header eyebrow, accent card, footer bar)
- [ ] Zero emoji Unicode trong UI (chỉ Icons8 PNG)
- [ ] Zero `rounded-3xl`, `dark:` variants
- [ ] Zero raw Tailwind palette ngoài amber exception
- [ ] Progress bars có inner shadow 3D
- [ ] Card interactive dùng depth border signature

## Drawbacks

- 8 PR nghĩa là refactor kéo dài. Nếu có work khác blocked bởi luồng này, cần merge sớm
- CelebrationCard shared có thể tạo coupling — nếu 1 skill cần result layout khác, phải extend prop chứ không fork
- Skill-coded accent xuyên suốt có thể gây visual noise — monitor sau Phase 2/3, sẵn sàng giảm saturation nếu user feedback

## Alternatives considered

### A. Big-bang redesign (1 PR toàn bộ)

Reject — risk quá cao, khó review, rollback khó. 8 phase cho phép ship từng skill độc lập.

### B. Chỉ redesign visual, không đổi structure

Reject — structure hiện tại có pain (footer `StatusText + McqNavBar + SubmitAction` rời rạc). Redesign đúng lúc để fix cả structure.

### C. Shared SessionLayout component

Considered. Tạo 1 `<SessionLayout>` wrapper dùng chung header + footer + progress cho cả 4 skills. **Defer** — mỗi skill có pattern content khác nhau (audio / split / editor / recorder), chỉ shared primitives đủ. Nếu sau này có skill #5 (grammar, vocabulary) cùng pattern thì revisit.

## Implementation status

- [ ] Phase 1 — Shared primitives
- [ ] Phase 2 — Hub redesign
- [ ] Phase 3 — Listening session
- [ ] Phase 4 — Reading session
- [ ] Phase 5 — Writing session
- [ ] Phase 6 — Speaking session
- [ ] Phase 7 — Result pages
- [ ] Phase 8 — Polish

## References

- [0002 — Design System v3](./0002-design-system.md) — source of truth cho tokens, depth border, interactions
- [0001 — Architecture](./0001-architecture.md) — package-by-feature structure, Scout rule
- [claude-design-prompt.md](../claude-design-prompt.md) — prompt template nếu dùng Claude Design preview
