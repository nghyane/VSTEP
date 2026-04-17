# RFC 0002 — Layout & Spacing Consistency

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2025-07-14 |
| Updated | 2025-07-14 |
| Superseded by | — |

## Summary

Container max-width, border-radius, heading hierarchy, card patterns, và spacing đang dùng không nhất quán giữa các trang cùng cấp. RFC này chốt quy tắc thống nhất.

## Motivation

- Cùng level page (hub pages) mà `max-w-5xl` lẫn `max-w-6xl`
- Cards dùng 4 loại radius khác nhau (`rounded-3xl`, `rounded-2xl`, `rounded-xl`, `rounded-lg`) không có quy tắc
- Heading cùng cấp mà style khác nhau (`text-3xl tracking-tight` vs `text-2xl` thiếu `tracking-tight`)
- Card background lẫn lộn `bg-card` / `bg-background` / `bg-muted/50`
- Page padding top/bottom không nhất quán

## Rules

### 1. Container max-width

| Page type | max-width | Ví dụ |
|---|---|---|
| Hub / list pages | `max-w-5xl` | Overview, Luyện tập index, Nền tảng hub, Thi thử, Từ vựng list, Ngữ pháp list |
| Split-panel sessions (passage + questions) | `max-w-6xl` | Đọc session, Kỹ năng hub (có sidebar) |
| Single-column sessions | `max-w-3xl` | Nghe session, Nói session, Viết session, Từ vựng topic, Ngữ pháp point |

**Violations:**
| File | Current | Should be |
|---|---|---|
| `_app.luyen-tap.index.tsx` | `max-w-6xl` | `max-w-5xl` |
| `_app.luyen-tap.ky-nang.index.tsx` | `max-w-6xl` | OK (has sidebar) |
| `viet.$exerciseId/index.tsx` | `max-w-5xl` | `max-w-3xl` (single-column writing) |
| `noi.$exerciseId/ket-qua.tsx` | `max-w-5xl` | `max-w-3xl` (single-column result) |

### 2. Border radius

| Element type | Radius | Tailwind class |
|---|---|---|
| Large cards (mode cards, feature cards) | 24px | `rounded-2xl` |
| Medium cards (exercise cards, stat cards) | 16px | `rounded-xl` |
| Small elements (pills, badges, buttons) | `rounded-lg` or `rounded-full` | context-dependent |
| Skeleton placeholders | Match the element they replace | — |

**Violations:**
| File | Current | Should be |
|---|---|---|
| `_app.luyen-tap.index.tsx` ModeCard | `rounded-3xl` | `rounded-2xl` |
| `_app.luyen-tap.nen-tang.index.tsx` SubModuleCard | `rounded-3xl` | `rounded-2xl` |
| `NextActionCard.tsx` | `rounded-3xl` | `rounded-2xl` |
| `ExerciseCard` (SkillPageLayout) | `rounded-xl` | OK |
| `StatGrid` | `rounded-2xl` | OK |

### 3. Heading hierarchy

| Page type | H1 style |
|---|---|
| Hub pages (top-level within a section) | `text-3xl font-bold tracking-tight md:text-4xl` |
| Sub-pages (exercise detail, topic detail) | `text-2xl font-bold` |

**Violations:**
| File | Current | Should be |
|---|---|---|
| `_app.thi-thu.index.tsx` | `text-2xl font-bold` | `text-3xl font-bold tracking-tight md:text-4xl` (hub page) |
| `_app.luyen-tap.ky-nang.index.tsx` | `text-2xl font-bold` | `text-3xl font-bold tracking-tight md:text-4xl` (hub page) |

### 4. Card surface colors

| Card type | Background |
|---|---|
| Interactive cards (clickable, navigable) | `bg-card` + `border` |
| Stat / info cards (read-only) | `bg-muted/50` (no border) |
| Inline content blocks (prompt, passage) | `bg-muted/50` (no border) |

### 5. Page spacing

| Element | Value |
|---|---|
| Sections within a page | `space-y-6` |
| Page bottom padding (pages with fixed footer) | `pb-10` |
| Page top (after back link) | `mt-4` on heading or `space-y-6` on container |

**Violations:**
| File | Current | Should be |
|---|---|---|
| `_app.thi-thu.index.tsx` | `space-y-8 pb-10 pt-6` | `space-y-6 pb-10` |
| `_app.overview.tsx` | `space-y-6` (no pb) | Add `pb-10` |

### 6. Back link style

Standardize: `ArrowLeft` icon (not `ChevronLeft`), same class everywhere.

```
className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
```

**Violation:** `_app.thi-thu.$examId/index.tsx` uses `ChevronLeft` + `gap-1` instead of `ArrowLeft` + `gap-1.5`.

## Implementation status

- [ ] Fix max-width violations (4 files)
- [ ] Fix border-radius: `rounded-3xl` → `rounded-2xl` (3 files)
- [ ] Fix heading hierarchy (2 files)
- [ ] Fix page spacing (2 files)
- [ ] Fix back link icon (1 file)
