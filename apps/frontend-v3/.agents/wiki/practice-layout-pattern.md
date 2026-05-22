# Practice Page Layout Pattern

## Quy chuẩn layout trang luyện tập

Tất cả trang luyện tập (Nghe, Đọc, Viết, Nói, Ngữ pháp, Từ vựng) tuân theo cùng 1 layout pattern:

### Route page (≤ 80 lines)
```tsx
<Header title="..." backTo="/luyen-tap" />
<div className="px-10 pb-12">
  <p className="text-sm text-subtle mb-5">Mô tả ngắn</p>
  <XxxContent />
</div>
```

### Content component
```
Filter buttons (nếu có)
└─ Section 1
   ├─ h3.font-extrabold.text-xl  (heading)
   ├─ p.text-sm.text-subtle.mt-0.5.mb-4  (sub)
   └─ grid.gap-4.sm:grid-cols-2.xl:grid-cols-3
      └─ ExerciseCard (shared component)
└─ Section 2 ...
```

### Filter components
- **Level filter** (`LevelFilters`): A1/A2/B1/B2/C1 toggle buttons, màu theo level. Dùng cho: Nói, Từ vựng, Ngữ pháp.
- **Status filter**: Tất cả/Chưa làm/Đang làm/Hoàn thành. Dùng cho: Nói (kết hợp level).
- Nghe/Đọc/Viết: **không có filter** — group by part bằng heading, không có filter buttons.

### Card component
Tất cả dùng `ExerciseCard` từ `features/practice/components/`. Props:
- `title`, `description`, `meta`, `overlay` (bắt buộc)
- `level` (optional — hiện badge góc phải)
- `progress` + `progressLabel` (optional — hiện progress bar)
- `tag` (optional — hiện tag text)

### Shared components
| Component | File | Dùng bởi |
|-----------|------|----------|
| `ExerciseCard` | `features/practice/components/ExerciseCard.tsx` | Tất cả |
| `LevelFilters` | `features/practice/components/LevelFilters.tsx` | Nói, Từ vựng, Ngữ pháp |
| `SpeakingFilters` | `features/practice/components/SpeakingFilters.tsx` | Nói (wrap LevelFilters + status) |

### Quyết định
- Không dùng tab layout / sticky bottom bar cho trang danh sách — giữ flat scroll giống Duolingo.
- Trang chi tiết ngữ pháp: scroll dọc liên tục (Structures → Examples → Mistakes → Tips → CTA), không tab.
- Filter = `useState` local (không URL search params) — trừ khi cần share state qua navigation.

---
See also: [[anti-patterns]] · [[practice-ux]]
