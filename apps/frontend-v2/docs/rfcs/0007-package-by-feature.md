# RFC 0007 — Package-by-Feature Architecture Migration

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2026-04-18 |
| Updated | 2026-04-19 |
| Supersedes | — (bundles action plan cho 0000, 0001, 0002) |

## Summary

Tổ chức lại codebase từ **layered (components + lib + routes)** sang **package-by-feature**, đồng thời enforce design token (RFC 0000/0001/0002) khi migrate từng feature. App đang ở giai đoạn mockup (chưa có API, user, test) → tranh thủ refactor kiến trúc trước khi wire backend.

In-place migration, không viết lại trong subfolder riêng. Mỗi feature = 1 commit = 1 ngày work. Tổng 12 features + phase nền tảng.

## Motivation

### Vấn đề hiện tại

1. **Không có boundary giữa domain.** `src/components/` trộn `common/`, `practice/`, `auth/`, `onboarding/`, `ai-chat/` cùng cấp. Khó biết component nào thuộc feature nào, owner là ai.
2. **Logic bị xé ra khỏi UI.** Coin store ở `src/lib/coins/`, CoinButton ở `src/components/common/`, TopUpDialog cũng ở `common/`. Cùng 1 domain nhưng ở 3 folder khác nhau.
3. **Route files ôm quá nhiều logic.** 15 route files > 80 dòng (limit AGENTS.md). Lớn nhất: `nen-tang.tu-vung.$topicId.tsx` 720 dòng, `ky-nang.index.tsx` 479 dòng.
4. **Design token inconsistent.** 125 hits hardcoded Tailwind colors, 20 gradients, 6 misuse `border-b-4`, 42 dark mode overrides (RFC 0001 evidence).
5. **Router convention trộn.** Flat `.tsx` + directory `/index.tsx` mix trong cùng 1 nhánh (ví dụ `doc.tsx` flat + `doc.$exerciseId/` directory).
6. **Dead code còn sót.** `ComingSoon`, `SupportModeSwitch`, `KeywordsPills` không ai import.

### Tại sao package-by-feature

- **Team 4 người** → mỗi người own 1 feature folder, ownership rõ.
- **Mock-first, API-later** (AGENTS.md) → feature folder có sẵn slot `queries/`, sau này thay `mockFetch` → `apiFetch` trong domain, components không biết.
- **`src/lib/<domain>/`** đã tồn tại (coins, streak, notifications, courses, ai-chat, onboarding, grammar) → migration cost thấp, chỉ cần gom UI về cùng feature.
- **Duolingo, Remix apps, bulletproof-react** đều dùng pattern này cho app scale > 5k LOC.

## Architecture

### Target structure

```
src/
  app/
    main.tsx                # entry (di từ src/main.tsx)
    providers.tsx           # QueryClient + RouterProvider
    router.ts               # createRouter config
    styles.css              # global (di từ src/styles.css)
  
  shared/                   # tái dùng toàn app, không biết domain
    ui/                     # shadcn primitives (di từ src/components/ui)
    lib/                    # cn, utils, format (di từ src/lib/utils.ts)
    hooks/                  # use-mobile (di từ src/hooks)
    config/                 # env, constants
  
  features/                 # vertical slices
    landing/
      components/           # HeroSection, CtaSection, etc.
      index.tsx             # <LandingPage /> entry
    
    auth/
      components/AuthDialog.tsx
      index.ts              # public API: AuthDialog
    
    onboarding/
      components/           # OnboardingDialog, OnboardingStep.*
      lib/                  # useMockGoal, types
      index.ts
    
    notification/
      components/NotificationButton.tsx
      lib/store.ts
      index.ts
    
    coin/
      components/           # CoinButton, CoinIcon, AnimatedCoinIcon, TopUpDialog
      lib/store.ts          # coin-store
      index.ts
    
    streak/
      components/           # StreakButton, StreakDialog, FireIcon
      lib/rewards.ts        # streak-rewards
      index.ts
    
    ai-chat/
      components/FloatingChatDock.tsx  # cần split
      lib/
      index.ts
    
    course/                 # khoa-hoc
      components/           # CourseCard, MyCourseCard, CourseSchedule, CommitmentCard, CoursePurchaseDialog
      lib/
      queries.ts
      types.ts
      index.ts
    
    overview/
      components/           # 11 cards: StatGrid, ExamCountdown, ActivityHeatmap, etc.
      lib/
      queries.ts
      index.tsx             # <OverviewPage />
    
    practice/
      skills/
        _shared/            # McqQuestionList, McqNavBar, McqSubmitBar, InteractivePassage, etc.
        listening/
        reading/
        writing/
        speaking/
      foundation/
        vocabulary/
        grammar/
      lib/
      queries.ts
    
    exam/                   # thi-thu detail + phong-thi (room)
      detail/               # _app.thi-thu.$examId
      room/                 # _focused.phong-thi.$examId
      list/                 # _app.thi-thu.index
      components/_shared/
      lib/
      queries.ts
      types.ts
  
  mocks/                    # mock data (di từ src/lib/mock)
    overview.ts
    vocabulary.ts
    grammar.ts
    ...
  
  routes/                   # TanStack file routes — CHỈ compose
    __root.tsx
    index.tsx               # → features/landing
    _app.tsx                # AppLayout shell
    _app/
      overview/
        index.tsx           # import from features/overview
      luyen-tap/
        index.tsx
        ky-nang/
          index.tsx
          nghe/
            index.tsx
            $exerciseId.tsx
          doc/
          viet/
          noi/
        nen-tang/
      thi-thu/
        index.tsx
        $examId.tsx
      khoa-hoc/
    _focused.tsx
    _focused/
      phong-thi/
        $examId/
          index.tsx
          chi-tiet.tsx
          ket-qua.tsx
  
  routeTree.gen.ts          # auto
```

### Router convention: directory-first nhất quán

Sau migration:
- **Mọi route có children HOẶC co-locate components** → directory + `index.tsx`
- **Route leaf 1 file duy nhất** → flat `.tsx` trong directory cha (không tạo subfolder 1 file)
- **Co-locate components** → gỡ hết `-components/` khỏi routes, đẩy vào `features/X/components/`. Routes chỉ import, không chứa.
- **Cấm trộn flat + directory cho cùng 1 branch.** Ví dụ hiện tại `doc.tsx` + `doc.$exerciseId/` → chuyển thành `doc/index.tsx` + `doc/$exerciseId.tsx` hoặc `doc/$exerciseId/index.tsx` (nếu có children).

### Import boundaries (enforced bằng convention)

```
routes         → features, shared
features/X     → features/X/*, entities (nếu có), shared
features/X     ↛ features/Y     # CẤM (trừ qua index.ts public API)
shared         ↛ features       # CẤM
mocks          ↛ features       # CẤM (mocks là data, features import mocks qua queries)
features → mocks               # OK tạm (sẽ thay bằng API sau)
```

**Public API pattern:** mỗi feature có `index.ts` export những gì ngoài có thể import. Import nội bộ feature dùng relative. Import cross-feature dùng `#/features/X` → hit `index.ts`.

Ví dụ `features/coin/index.ts`:
```ts
export { CoinButton } from "./components/CoinButton"
export { TopUpDialog } from "./components/TopUpDialog"
export { useCoins, spendCoins, refundCoins, computeSessionCost, FULL_TEST_COST } from "./lib/store"
```

AGENTS.md cấm barrel internally — exception: `index.ts` ở root feature folder (public API), **không** dùng barrel trong `components/index.ts`, `lib/index.ts`.

### Path aliases (tsconfig)

```json
{
  "paths": {
    "#/*": ["./src/*"],
    "#/app/*": ["./src/app/*"],
    "#/shared/*": ["./src/shared/*"],
    "#/features/*": ["./src/features/*"],
    "#/routes/*": ["./src/routes/*"],
    "#/mocks/*": ["./src/mocks/*"]
  }
}
```

Giữ `#/*` để tránh break imports hiện tại trong lúc migrate.

### Ngôn ngữ

- **Folder name + code identifier**: English (`practice`, `exam`, `coin`, `streak`)
- **URL path**: giữ tiếng Việt (`/luyen-tap`, `/thi-thu`, `/phong-thi`) — user-facing
- **Copy UI**: tiếng Việt (như hiện tại)

Lý do: folder English dễ autocomplete/grep, universal. URL tiếng Việt giữ SEO + UX cho user.

## Migration plan

### Phase 0 — Chuẩn bị (không move code)

- [ ] Viết RFC này (đang làm)
- [ ] User duyệt
- [ ] Update tsconfig path aliases
- [ ] Create skeleton folders: `src/app/`, `src/shared/{ui,lib,hooks,config}/`, `src/features/`, `src/mocks/`
- [ ] Update `.agents/skills/` nếu cần thêm convention mới
- [ ] Commit: `chore(arch): prepare skeleton folders for package-by-feature`

### Phase 1 — Shared layer (low risk, mechanical)

- [ ] `src/components/ui/` → `src/shared/ui/` (shadcn, ~30 files)
- [ ] `src/lib/utils.ts` → `src/shared/lib/utils.ts`
- [ ] `src/hooks/use-mobile.ts` → `src/shared/hooks/use-mobile.ts` (hoặc delete nếu dead — verify)
- [ ] Codemod update imports: `#/components/ui/X` → `#/shared/ui/X`, `#/lib/utils` → `#/shared/lib/utils`
- [ ] `src/lib/mock/*` → `src/mocks/*`
- [ ] Update imports `#/lib/mock/X` → `#/mocks/X`
- [ ] `src/main.tsx` → `src/app/main.tsx`, `src/styles.css` → `src/app/styles.css`
- [ ] Update `index.html` script src + `vite.config.ts` nếu cần
- [ ] Verify: `pnpm exec tsc --noEmit` + `pnpm build`
- [ ] Commit: `refactor(arch): phase 1 — extract shared layer + mocks`

### Phase 2 — Biome format sweep (prerequisite cho clean migration)

- [ ] `pnpm exec biome check --write .` — fix organize imports, format whitespace
- [ ] Manual fix: a11y title, exhaustive deps, template literals (5 files)
- [ ] Delete dead code: `ComingSoon`, `SupportModeSwitch`, `KeywordsPills`
- [ ] Verify: 53 errors → 0
- [ ] Commit: `chore(lint): biome clean + remove dead components`

### Phase 3 — Feature migrations (1 PR / feature)

Order từ ít dep → nhiều dep. Mỗi feature: move → rewrite UI với design token (RFC 0001/0002) → split file lớn.

| # | Feature | Files | LOC | Khó |
|---|---|---|---|---|
| 3.1 | `landing` | 9 | ~900 | Low |
| 3.2 | `auth` | 1 | ~200 | Low |
| 3.3 | `notification` | 2 | ~300 | Low |
| 3.4 | `coin` | 4 | ~400 | Low-Med |
| 3.5 | `streak` | 3 | ~500 | Low-Med |
| 3.6 | `onboarding` | 7 | ~600 | Med |
| 3.7 | `ai-chat` | 3+ | ~700 | Med (split 469L file) |
| 3.8 | `course` | 5 routes + 5 components | ~800 | Med |
| 3.9 | `overview` | 11 components | ~1500 | Med-High |
| 3.10 | `practice-skills` (4 kỹ năng) | ~30 files | ~4000 | High |
| 3.11 | `practice-foundation` (vocab + grammar) | ~10 files | ~2000 | High |
| 3.12 | `exam` (thi-thu + phong-thi) | ~20 files | ~3000 | Very High |

Mỗi feature follow checklist (xem bên dưới).

### Phase 4 — Router cleanup

- [ ] Chuyển tất cả route sang directory style nhất quán
- [ ] Gỡ `_app.luyen-tap.ky-nang.doc.tsx` flat + `doc.$exerciseId/` → thành `ky-nang/doc/{index,$exerciseId}.tsx` nhất quán
- [ ] Gỡ conflict `_focused.phong-thi.$examId/` + `_focused.phong-thi.$examId.chi-tiet.tsx` → thành `_focused/phong-thi/$examId/{index,chi-tiet,ket-qua}.tsx`
- [ ] Route files ≤ 80 dòng: chỉ import feature component + loader
- [ ] Verify: URL paths không đổi (test navigate qua mỗi page)
- [ ] Commit: `refactor(routes): unify to directory convention`

### Phase 5 — Skill update + RFC close

- [ ] Update `.agents/skills/` với convention mới (feature structure, import boundaries)
- [ ] Mark RFC 0001, 0002, 0007 → `Implemented`
- [ ] Cleanup RFC 0000 implementation status

## Per-feature migration checklist

Áp dụng cho mỗi feature trong Phase 3:

```
1. Tạo folder: src/features/<name>/{components,lib,queries}
2. Move code liên quan:
   - src/components/<relevant>/* → src/features/<name>/components/
   - src/lib/<name>/* → src/features/<name>/lib/
   - src/routes/*/-components/<relevant>/* → src/features/<name>/components/
3. Move route-specific queries: src/lib/queries/<name>.ts → src/features/<name>/queries.ts
4. Rewrite UI từng component (design token sweep):
   - Hardcoded color → token (RFC 0001 mapping)
   - Gradient → solid (RFC 0000)
   - border-b-4 khỏi cards/tables (RFC 0000)
   - Max 2 hue per component
   - Remove dark: overrides khi đã dùng token
5. Split file > 300 dòng (component) hoặc > 80 dòng (route)
6. Tạo src/features/<name>/index.ts export public API
7. Update imports globally:
   - #/components/<old> → #/features/<name>
   - #/lib/<name> → #/features/<name>
8. Route files update import path, giữ nguyên URL
9. Verify: tsc --noEmit + biome check + pnpm build
10. Smoke test: dev server, click qua các page của feature
11. Commit: refactor(<name>): migrate to feature folder + apply design tokens
```

## Non-goals

- **Không wire API.** Vẫn dùng mock. Backend v2 vừa reset schema, chưa sẵn sàng.
- **Không thêm test.** Chưa có test infrastructure, không setup trong RFC này.
- **Không đổi URL.** User-facing paths giữ nguyên.
- **Không đổi behavior.** Chỉ move code + rewrite UI tokens. Logic flow giữ nguyên.
- **Không thêm feature mới.** Feature pending (OnboardingBanner render, NextActionCard render, "Bài tiếp theo", Lesson Complete Duolingo 3-stat) ở RFC 0003/0004, làm **sau** migration, không gộp vào RFC này.

## Risks

1. **Plugin TanStack regen tree lỗi.** Mitigation: 1 feature/commit, verify build sau mỗi step.
2. **Import path sót.** Mitigation: `tsc --noEmit` strict, `noUnusedLocals`, `noUnusedParameters` bắt hầu hết.
3. **File trùng tên (2 feature có `index.ts`).** OK — namespace bằng feature folder.
4. **Phase 3.12 (exam) phức tạp nhất, risk cao nhất.** Mitigation: làm cuối khi đã quen pattern, chia sub-commit (thi-thu, phong-thi room, phong-thi result riêng).
5. **Bundle size tăng do tách file.** Unlikely vì Vite/TanStack auto code-split theo route.

## Drawbacks

- **Thời gian:** ~3-4 ngày work thực cho team 4 người (12 feature × ~8h), phase 0-2 + 4-5 thêm ~2 ngày. Tổng 5-6 ngày.
- **Mid-state ugliness:** trong Phase 3, codebase sẽ "nửa cũ nửa mới" — một số feature đã migrate, một số chưa. Kỷ luật: không pause > 1 tuần giữa 2 feature.
- **Conflict với branch mobile.** Branch `mobile` đang maintain, sẽ merge rebase đau khi migrate. Mitigation: freeze mobile merge trong thời gian migrate, hoặc migrate main → rebase mobile sau.

## Alternatives considered

### Rewrite in `src-v2/` (bỏ)

Lý do bỏ:
- 25k LOC rewrite ước lượng 25-40 ngày team work (x2-3 thực tế)
- Mất công 21 commit hôm qua (coin/streak/notification/practice UI)
- Mock data 5190 dòng phải copy dù sao
- App broken trong suốt thời gian rewrite → không dev feature mới được

### FSD (Feature-Sliced Design) strict (bỏ)

Lý do bỏ:
- Overhead layer `entities/` chưa cần thiết ở scale này
- Team 4 người chưa kỷ luật enough để enforce 6 layer (app/pages/widgets/features/entities/shared)
- Package-by-feature là subset của FSD, đủ dùng

Có thể evolve lên FSD sau khi số feature > 20.

### Layered cleanup only (bỏ)

Lý do bỏ:
- Không giải được "đâu là boundary" — vẫn sẽ thấy coin logic lẫn practice logic
- Ownership vẫn mờ

## Implementation status

- [x] Phase 0: Chuẩn bị
- [x] Phase 1: Shared layer
- [x] Phase 2: Biome clean + dead code
- [x] Phase 3.1: landing
- [ ] Phase 3.2: auth
- [ ] Phase 3.3: notification
- [ ] Phase 3.4: coin
- [ ] Phase 3.5: streak
- [ ] Phase 3.6: onboarding
- [ ] Phase 3.7: ai-chat
- [ ] Phase 3.8: course
- [ ] Phase 3.9: overview
- [ ] Phase 3.10: practice-skills
- [ ] Phase 3.11: practice-foundation
- [ ] Phase 3.12: exam
- [ ] Phase 4: Router cleanup
- [ ] Phase 5: Skill update + RFC close
