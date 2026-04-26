# Duolingo-style Progress Bar

Thanh tiến độ dùng cho XP, word count, daily goal, exam progress, streak goal — tone gamification của Duo.

## Anatomy

3 layer:

1. **Track** (nền) — `bg-border/60` rounded pill, height ≥ 8px (default 12).
2. **Fill** — solid color tone (vd `bg-coin` = `#ffc800`), width = giá trị %, animate `transition-[width] duration-300`.
3. **Highlight stripe** — vạch sáng nhỏ phía trên trong fill (`top-1 left-1.5 right-1.5 h-0.5 rounded-full`), color tone-light (vd `bg-coin-light` = `#fbe56d`). Nhờ `inset` 1.5 nên highlight scale theo fill, không bị clip ở 2 đầu.

Highlight chỉ render khi `value > 0` để tránh dải sáng lơ lửng trên track rỗng.

## Component

[`components/DuoProgressBar.tsx`](../../src/components/DuoProgressBar.tsx)

```tsx
<DuoProgressBar value={pct} tone="primary" heightPx={12} label="..." />
```

API:
- `value: number` — 0–100, tự clamp.
- `tone: "primary" | "coin" | "warning" | "info" | "streak"` — default `"primary"`.
- `heightPx: number` — default `12`. Tăng cho banner-style, giảm cho inline mini bar.
- `label: string` — aria-label.

## Tokens

Mỗi tone cần cặp `--color-{tone}` (fill) + `--color-{tone}-light` (highlight) trong `styles.css`:

| Tone | Fill | Light |
|------|------|-------|
| primary | `#58cc02` | `#79d634` |
| coin | `#ffc800` | `#fbe56d` |
| warning | `#ff9b00` | `#ffc04d` |
| info | `#1cb0f6` | `#6dd2ff` |
| streak | `#ff7800` | `#ffaa55` |

Thêm tone mới: thêm cặp token, cập nhật `TONE` map trong `DuoProgressBar.tsx`. Không truyền hex trực tiếp vào component.

## Use cases

- **Writing word count** ([WritingPanel.tsx](../../src/features/exam/components/WritingPanel.tsx)) — tone đổi theo trạng thái: dưới min → `warning`, đạt → `primary`.
- **Daily goal / streak** — `tone="streak"`.
- **XP bar** — `tone="primary"` hoặc `tone="coin"`.
- **Exam progress** (overall completion) — `tone="primary"`.

## Range slider variant (`<input type="range">`)

`<input>` track + thumb chia sẻ cùng stacking context — z-index không tách được thumb khỏi track. Pseudo-element không tạo được DOM con với `border-radius`. Solution: 4 layer DOM riêng biệt, input track *trong suốt*, chỉ thumb hiện.

```html
<div class="duration-slider-wrap" style="--fill-pct: 50%">
  <span aria-hidden class="duration-slider-track"></span>      <!-- 1. nền xám rounded pill -->
  <span aria-hidden class="duration-slider-fill"></span>       <!-- 2. fill primary, width = fill% -->
  <span aria-hidden class="duration-slider-highlight"></span>  <!-- 3. light stripe rounded, width = fill% - 6px -->
  <input type="range" class="duration-slider">                 <!-- 4. transparent track + thumb on top -->
</div>
```

Z-stack theo document order: track < fill < highlight < input thumb. Highlight kéo dài tới fill end, thumb vẽ lên trên — không gap khi nửa thanh, không tràn lên thumb khi đầy. CSS:
- `.duration-slider-track`: `inset: 0; bg: border; rounded`
- `.duration-slider-fill`: `width: var(--fill-pct); bg: primary; rounded`
- `.duration-slider-highlight`: `left: 6px; top: 4px; width: max(0, fill% - 6px); h: 2px; bg: primary-light; rounded`
- `.duration-slider`: `position: absolute; inset: 0; bg: transparent` + `::-moz-range-track / progress` đều `transparent`

Thumb: 18×18 round, primary fill, white border-2, `box-shadow: 0 2px 0 primary-dark`. Active: `scale(1.2)`.

Reference: classes `.duration-slider*` trong [`styles.css`](../../src/styles.css). Use site: [`BottomActionBar.tsx`](../../src/features/exam/components/BottomActionBar.tsx).

### Lý do KHÔNG dùng CSS multi-bg gradient

- Gradient layer không có `border-radius` → highlight stripe ends sharp.
- Không tách được track khỏi thumb để overlay highlight giữa hai layer này.
- Input pseudo-elements (`::-webkit-slider-thumb`) không nhận child DOM.

## Anti-patterns

- ❌ Hardcode `bg-yellow-400` / `#ffc800` — luôn dùng token tone.
- ❌ Highlight cố định `inset-x-0` (full-width) — bị tràn khi fill nhỏ.
- ❌ Highlight không có `pct > 0` guard — vạch sáng hiện trên track rỗng nhìn lạ.
- ❌ Không có `transition-[width]` — fill thay đổi giật cục, mất cảm giác gamification.
- ❌ Tự render bar inline thay vì gọi component — bỏ qua highlight stripe, mất Duo feel.
