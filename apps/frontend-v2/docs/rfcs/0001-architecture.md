# RFC 0001 — Package-by-Feature Architecture

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |
| Supersedes | — (v1 big-bang migration, rewritten to incremental) |

## Summary

Target architecture: **package-by-feature** (Bulletproof React style). Nhưng thay vì
big-bang migration, áp dụng **incremental approach**: feature mới viết thẳng vào
`features/`, feature cũ chỉ move khi có lý do touch (fix bug, thêm scope, split file
> 300 dòng). Setup `shared/` skeleton + path aliases trong 1 PR riêng, không block
team đang code.

## Motivation

### Current pain (evidence)

| Pain | Evidence | Severity |
|---|---|---|
| `-components/` scattered trong `routes/`, không share được | 8 route folders có `-components/` riêng | Medium — duplicate |
| File > 300 dòng | 22 files (`BottomActionBar.tsx` 322, `_app.khoa-hoc.$courseId.tsx` 320, ...) | Medium — vi phạm hard limit AGENTS.md |
| Mock data sẽ thay API — scattered imports | `lib/mock/*.ts` import từ 50+ nơi | High — khi wire API phải hunt |
| Layered structure (components + lib + routes) không scale | 7 subfolder trong `components/`, 12 trong `lib/` | Low — còn work |

### Tại sao KHÔNG big-bang

Version 1 của RFC này đề xuất 9-step migration, touch ~100 file. Vấn đề:

- **Conflict nặng** — team 4 người đang code RFC 0003/0004/0005 + feature mới
- **Double-touch** — file bị move rồi lại fix tokens (RFC 0007) rồi lại split
- **Risk cao** — import path đổi sai → dev server đỏ nguyên cây
- **Value delay** — user không thấy gì cho tới khi xong hết
- **Revert khó** — big PR không revert từng phần được

### Tại sao incremental đúng hơn

- **Parallel-safe** — feature cũ giữ nguyên, feature mới dùng structure mới
- **Scout rule** — file nào touch thì clean/move file đó
- **YAGNI** — theo Global Rules: "No speculative code. No consumer = no commit"
- **Reversible** — mỗi PR nhỏ, git bisect dễ
- **Value sớm** — tuần 1 có skeleton, tuần 2 có feature mới theo pattern mới

## Target structure

```
src/
  app/
    main.tsx
    providers.tsx           # QueryClient, Router, Theme
    router.ts
    styles.css

  shared/
    ui/                     # shadcn primitives (move từ components/ui/)
    lib/                    # cn, utils, srs algorithm
    hooks/                  # use-mobile, cross-cutting hooks
    config/                 # env, constants

  features/
    auth/                   # components/, lib/, index.ts
    landing/
    notification/
    coin/
    streak/
    onboarding/
    ai-chat/                # + hooks/
    course/                 # khoa-hoc
    overview/
    practice/
      components/           # shared: McqQuestionList, SkillPageLayout, ...
      hooks/                # use-mcq-session, use-voice-recorder
      lib/                  # dictation-diff, speak-sentence
      skills/
        listening/
        reading/
        writing/
        speaking/
      foundation/
        vocabulary/
        grammar/
    exam/                   # thi-thu + phong-thi

  mocks/                    # mock data (move từ lib/mock/)
                            # sẽ bỏ dần khi wire API

  routes/                   # TanStack file routes — CHỈ compose, ≤ 80 dòng/file
  routeTree.gen.ts          # auto-generated, không touch
```

### Quyết định giữ nguyên

| Item | Giữ nguyên vì |
|---|---|
| `routeTree.gen.ts` tại root | Auto-generated, path config trong `vite.config.ts` |
| Flat route naming (`_app.luyen-tap.ky-nang.viet.$exerciseId.tsx`) | Nest không đáng churn (xem RFC 0006 Withdrawn) |
| `routes/-components/landing/` | RFC 0007 exempt, refactor riêng nếu cần |

## Import boundaries

```
routes          → features, shared, mocks
features/X      → features/X/**, shared, mocks (qua query layer)
features/X      ↛ features/Y      (ngoại lệ: qua features/Y/index.ts public API)
shared          ↛ features        (shared phải self-contained)
features        → mocks            (tạm, sẽ thay bằng API via queries/)
```

### Path aliases (tsconfig.json)

Cập nhật `tsconfig.json` + `package.json` `imports`:

```json
{
  "paths": {
    "#/*": ["./src/*"],
    "#/app/*": ["./src/app/*"],
    "#/shared/*": ["./src/shared/*"],
    "#/features/*": ["./src/features/*"],
    "#/mocks/*": ["./src/mocks/*"]
  }
}
```

`package.json`:
```json
"imports": {
  "#/*": "./src/*"
}
```

Giữ alias `#/*` làm catch-all (existing imports không break). Thêm alias cụ thể cho readability.

## Naming

- Folder + code: **English** (`practice`, `exam`, `coin`, `course`)
- URL paths: **tiếng Việt** (`/luyen-tap`, `/thi-thu`, `/khoa-hoc`)
- UI copy: **tiếng Việt**
- Component: `PascalCase.tsx`
- Hook: `camelCase.ts` bắt đầu bằng `use`
- Util: `kebab-case.ts` (hoặc `camelCase.ts` nếu 1 function)

## Public API per feature

Mỗi feature có `index.ts` export public surface:

```ts
// features/coin/index.ts
export { CoinButton } from "./components/CoinButton"
export { TopUpDialog } from "./components/TopUpDialog"
export { useCoins, computeSessionCost, FULL_TEST_COST } from "./lib/coin-store"
```

Import cross-feature qua `#/features/X` (resolve tới `index.ts`). **Không** import
sâu `#/features/X/components/SomeInternal`.

**Không barrel** trong `components/index.ts` hay `lib/index.ts` (chỉ `features/X/index.ts`).

## Migration approach — Incremental

### Rule 1: New feature → thẳng vào `features/`

Feature mới (sau RFC 0001 accepted) **không** được tạo trong `routes/-components/`
hay `components/`. Phải:

1. Tạo `features/<name>/{components,lib,hooks}/`
2. Tạo `features/<name>/index.ts` — export public API
3. Route file chỉ import + compose

### Rule 2: Old feature → move when touched

Khi touch file cũ vì lý do khác (fix bug, thêm scope, fix tokens RFC 0007):

1. Nếu scope cho phép (≤ 3 file related) → move sang `features/` luôn
2. Nếu scope lớn (> 3 file) → chỉ fix lý do chính, **không move**, log lại vào RFC

### Rule 3: Scout rule cho hard limits

Khi touch file vi phạm AGENTS.md hard limits:

- File > 300 dòng → split
- Function > 50 dòng → extract helper
- Route page > 80 dòng → move UI sang component trong feature
- Params > 3 → object param

### Rule 4: Queries layer tách biệt

Mọi server state đi qua `features/X/lib/queries.ts` (hoặc `shared/lib/queries/`):

```ts
// features/exam/lib/queries.ts
export const examDetailQueryOptions = (id: number) => queryOptions({
  queryKey: ['exam', id],
  queryFn: () => mockFetchExam(id),  // sau: apiFetchExam(id)
})
```

Component **không** import mock trực tiếp. Chỉ dùng `useSuspenseQuery(queryOptions)`.
Khi wire API, đổi `queryFn` tại 1 chỗ.

## Priority order

### Phase 0 — Skeleton (1 PR, low-risk)

- [ ] Tạo folder `src/{app,shared,features,mocks}/` (chỉ `.gitkeep`)
- [ ] Cập nhật `tsconfig.json` paths
- [ ] Cập nhật `package.json` imports
- [ ] Verify `bun dev`, `bunx tsc --noEmit`, `bunx biome check` — không break
- [ ] Document trong `AGENTS.md`: "new code goes to features/"

### Phase 1 — Shared layer move (low-risk, mechanical)

- [ ] Move `src/components/ui/` → `src/shared/ui/`
- [ ] Move `src/lib/utils.ts` → `src/shared/lib/utils.ts`
- [ ] Move `src/hooks/` → `src/shared/hooks/`
- [ ] Move `src/lib/srs/` → `src/shared/lib/srs/`
- [ ] Move `src/lib/mock/` → `src/mocks/`
- [ ] Global find-replace imports (biome sẽ handle formatting)
- [ ] Verify build + smoke test toàn app
- [ ] Cập nhật biome.json overrides path (`src/components/ui/**` → `src/shared/ui/**`)

Note: phase này **mechanical**, không clean code, không fix tokens. Mục tiêu zero
logic change.

### Phase 2+ — Per-feature opportunistic move

**Không còn "migration order 9 steps".** Feature được move khi:

- Feature mới code → thẳng features/
- Feature cũ có scope work (bug, enhancement, RFC 0007 tokens) → kết hợp move

Khi move feature X:

1. Tạo `features/X/{components,lib,hooks}/`
2. Move từng file, update imports
3. Tạo `features/X/index.ts`
4. Replace `routes/-components/X/` imports → `#/features/X`
5. Route page file giảm xuống ≤ 80 dòng
6. Fix RFC 0002 tokens cùng lúc (nếu scope cho phép)
7. Split file > 300 dòng
8. `tsc --noEmit` + `biome check` + smoke test
9. 1 PR = 1 feature

## Drawbacks

1. **Structure không đồng nhất trong transition period.** Vài tháng sẽ có cả
   `components/` cũ + `features/` mới tồn tại.
   - Mitigate: AGENTS.md rule rõ "new code → features/".
2. **Scout rule phụ thuộc touch pattern** — feature ít đụng sẽ ở `components/` lâu.
   - Accept: không work thì không cần move. YAGNI.
3. **Team phải học 2 structure** transition time.
   - Mitigate: AGENTS.md example + 1-2 PR reference.

## Alternatives considered

### A. Big-bang 9-step (v1 của RFC này)

Loại. Quá nhiều touch, conflict cao, value delay. (Detail trong Motivation.)

### B. Keep layered, chỉ clean code

Không scale. Khi có 15 features, `components/` thành monolith. Khó locate code
theo business scope.

### C. Monorepo với workspaces per feature

Overkill cho capstone. Tooling cost > benefit.

### D. Atomic design (atoms/molecules/organisms)

Loại. Design-driven naming, business logic không map tốt. Industry shift khỏi atomic
(Duolingo, Shopify, Vercel đều package-by-feature).

## Open questions

1. **Queries layer:** tách global `shared/lib/queries/` hay per-feature
   `features/X/lib/queries.ts`?
   - Đề xuất: per-feature, trừ khi query cross-feature (user, auth).
2. **Types:** `features/X/lib/types.ts` hay inline trong file?
   - Đề xuất: types hẹp inline, types chia sẻ trong feature → `types.ts`.
3. **Khi nào `routes/-components/` xóa hết?**
   - Khi tất cả feature đã move. Không deadline cứng.

## Implementation status

- [ ] Phase 0 — Skeleton + aliases
- [ ] Phase 1 — Shared layer mechanical move
- [ ] Phase 2+ — Opportunistic per-feature (tracked per PR, không check list ở đây)

## Non-goals

- Không wire API trong RFC này
- Không thêm tests
- Không đổi URL
- Không thêm feature mới
- Không nest routes (RFC 0006 Withdrawn)
