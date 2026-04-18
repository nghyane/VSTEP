# RFCs

| # | Title | Status | Priority |
|---|---|---|---|
| 0001 | [Architecture](./0001-architecture.md) | Draft | P1 — incremental package-by-feature |
| 0002 | [Design System v3](./0002-design-system.md) | **Accepted** | P0 — Duolingo gamification, verified via `/design-test` |
| 0003 | [Overview](./0003-overview.md) | Draft | P2 — actionability |
| 0004 | [Session Completion](./0004-session-completion.md) | Draft | P2 — flow |
| 0005 | [Khóa học](./0005-khoa-hoc.md) | Draft | P2 — luồng mới |
| 0006 | [Routes directory-based](./0006-routes-directory-based.md) | Withdrawn | — |
| 0007 | [Design Token Enforcement](./0007-design-token-enforcement.md) | Withdrawn | — absorbed vào 0002 v3 |
| 0008 | [Redesign 4 Skills Flow](./0008-redesign-4-skills-flow.md) | Draft | P0 — apply RFC 0002 vào luồng luyện tập |

## Implement order

```
[DONE] 0002 Phase A — User design approval via /design-test
[DONE] Color palette tune (Duolingo-bright in styles.css)
[DONE] Icon library setup (Icons8 + Lucide + Custom)
[DONE] Component spec chốt (button, card, chip, progress, dialog)
[DONE] 0001 Phase 0 — Skeleton folders + aliases
  ↓
[NEXT] 0001 Phase 1 — Shared layer mechanical move
  ↓
[NEXT] 0001 Phase 2+ — Opportunistic per-feature (Scout rule)
  - Mỗi PR 1 feature
  - Move sang features/X/
  - Apply RFC 0002 v3 spec
  - Screenshot before/after
  ↓
0002 Phase D — CI guard script
  ↓
0003 → 0004 → 0005 (feature enhancements)
```

## Implementation notes

### RFC 0002 v3 — Chốt

**Đã verify trực quan tại `/design-test`:**
- 24 sections cover toàn bộ pattern
- 3D depth border đồng nhất (border-2 border-b-4, trên nhạt dưới đậm)
- Icon system 3 layer (Icons8 PNG + Lucide + Custom)
- Hover/Active behavior (height cố định)
- Duolingo-bright palette

**Cần xóa sau refactor:**
- `src/routes/design-test.tsx`
- Route `/design-test` sẽ tự biến mất khi xóa file

### Next action — RFC 0001 Phase 1

Move shared layer mechanical (không đổi logic):

- `src/components/ui/` → `src/shared/ui/`
- `src/lib/utils.ts` → `src/shared/lib/utils.ts`
- `src/hooks/` → `src/shared/hooks/`
- `src/lib/mock/` → `src/mocks/`
- Update imports (`#/components/ui/*` → `#/shared/ui/*`)
- Update biome.json overrides

1 PR, zero logic change, verify build + smoke test.

## Template

[0000-template.md](./0000-template.md)
