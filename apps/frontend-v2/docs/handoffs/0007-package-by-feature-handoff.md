# Handoff — Package-by-Feature Migration (RFC 0007)

| Field | Value |
|---|---|
| Created | 2026-04-18 |
| Context thread | RFC 0007 discussion + evidence scan |
| Next thread mission | Implement Phase 0 → Phase 5 theo RFC 0007 |
| Source of truth | `docs/rfcs/0007-package-by-feature.md` |

## Mục đích handoff

Thread hiện tại đã phân tích, scan evidence, thảo luận options và viết xong RFC 0007. Thread mới tiếp tục **implement** theo plan, không cần discuss lại. File này tóm tắt mọi quyết định đã chốt + context cần thiết để bắt đầu ngay.

## Đọc trước (thứ tự)

1. `apps/frontend-v2/AGENTS.md` — rule cứng (hard limits, guardrails, definition of done)
2. `docs/rfcs/0007-package-by-feature.md` — RFC chính, plan đầy đủ
3. `docs/rfcs/0000-design-direction.md` — design language (Duolingo, max 2 hue, border-b-4 chỉ cho buttons)
4. `docs/rfcs/0001-design-token-consistency.md` — mapping hardcoded color → token
5. `docs/rfcs/0002-layout-spacing-consistency.md` — layout, radius, heading, gamification pattern
6. `.agents/skills/refactor` — quy trình refactor (đọc → phân tích → báo cáo → chờ → thực thi → verify)
7. `.agents/skills/rfc` — khi nào cập nhật RFC, checklist syntax
8. `.agents/skills/design-system` — tokens, cn pattern, card pattern
9. `.agents/skills/tanstack-query` — nếu đụng queries
10. `.agents/skills/typescript` — convention

## Context quan trọng

### Trạng thái codebase khi handoff

- **Mockup, không có API**. Backend v2 vừa reset schema (commit `20b441f`), chưa sẵn sàng.
- **Không có test**. Không setup test infrastructure trong migration này.
- **Branch `mobile` đang maintain song song.** Freeze merge từ `main → mobile` trong lúc migrate, hoặc merge sau khi xong full phase 3.
- **21 commit hôm qua (2026-04-17)** vừa ship coin system, streak, notifications, practice UI overhaul, writing Zen Focus. Không được revert behavior.

### Số liệu evidence (từ scan)

| Metric | Count | Ghi chú |
|---|---|---|
| Hardcoded colors (`text/bg/border-{hue}-\d`) | 125 hits / 28 files | Worst: CommitmentCard (14), OnboardingStep.Level (13), CoursePurchaseDialog (11) |
| Gradient | 20 hits / 12 files | Worst: StreakDialog (4), LandingPage (3), ExamCountdown (3) |
| `border-b-4` misuse | 6 instances | KetQuaCard, ChiTietCard, PerformanceTable, sonner.tsx toast |
| Dark mode overrides | 42 hits / 10 files | Khi migrate sang token, remove luôn |
| Route > 80 dòng | 15 files | Worst: `tu-vung.$topicId.tsx` (720), `ky-nang.index.tsx` (479) |
| Component > 300 dòng | 8 files | Worst: LandingPage (726), PracticeSession grammar (524), SentencePracticeView (514) |
| Biome errors | 53 / 52 files | ~40 format, còn lại a11y/exhaustive-deps/non-null |
| Dead components | 3 | ComingSoon, SupportModeSwitch, KeywordsPills |
| Total LOC | Routes 14680, Components 7683, Lib non-mock 3517, Mock 5190 | |

### Breakdown hardcoded color theo hue

emerald 41, amber 49, rose 7, slate 6, blue 7, violet 4, orange 4, sky 3, pink 2, yellow 2, gray 1.

## Quyết định đã chốt (không cần tranh luận lại)

| Topic | Quyết định | Lý do |
|---|---|---|
| Kiến trúc | Package-by-feature (Bulletproof React style) | Match scale team 4 người + codebase đã gần cấu trúc này |
| Migration strategy | In-place, 1 feature/commit | Không rewrite subfolder vì 25k LOC + mất 21 commit hôm qua |
| Design token | Apply **khi migrate** mỗi feature (không sweep riêng) | Mỗi file chỉ touch 1 lần |
| Folder language | English (`practice`, `exam`, `coin`) | Universal, autocomplete-friendly |
| URL language | Giữ tiếng Việt (`/luyen-tap`, `/thi-thu`) | User-facing, SEO |
| Router style | Directory-first nhất quán, gỡ trộn flat+directory | Match phần lớn code đã có `-components/` |
| Entities layer | Không tách, gộp vào `features/X/lib` + `types.ts` | Scale chưa đủ cần FSD |
| Public API | `features/X/index.ts` là barrel duy nhất được phép | Exception của AGENTS.md "no barrel" |
| Mocks | Top-level `src/mocks/` | Không phải shared lib, là data |
| Test | Không setup | Non-goal, mockup stage |
| API wire | Non-goal | Backend chưa sẵn sàng |

## Structure target (tóm tắt)

```
src/
  app/{main.tsx, providers.tsx, router.ts, styles.css}
  shared/{ui, lib, hooks, config}
  features/{landing, auth, onboarding, notification, coin, streak,
            ai-chat, course, overview, practice, exam}
  mocks/
  routes/  ← chỉ compose, ≤ 80 dòng/file
  routeTree.gen.ts  ← auto
```

**Import rules:** `routes → features → shared`. `features/X ↛ features/Y` (trừ qua `index.ts`). `shared ↛ features`.

Chi tiết đầy đủ trong RFC 0007.

## Phases

| Phase | Scope | Est | Status |
|---|---|---|---|
| 0 | Skeleton folders + tsconfig alias | 1 commit | ⏳ |
| 1 | Shared layer move (ui, lib, hooks) + mocks move | 1-2 commit | ⏳ |
| 2 | Biome sweep + delete dead code | 1 commit | ⏳ |
| 3.1 | `landing` feature | 1 commit | ⏳ |
| 3.2 | `auth` | 1 commit | ⏳ |
| 3.3 | `notification` | 1 commit | ⏳ |
| 3.4 | `coin` | 1 commit | ⏳ |
| 3.5 | `streak` | 1 commit | ⏳ |
| 3.6 | `onboarding` | 1 commit | ⏳ |
| 3.7 | `ai-chat` (split 469L file) | 1-2 commit | ⏳ |
| 3.8 | `course` | 1 commit | ⏳ |
| 3.9 | `overview` | 1 commit | ⏳ |
| 3.10 | `practice-skills` (listening, reading, writing, speaking) | 4 commit | ⏳ |
| 3.11 | `practice-foundation` (vocab, grammar) | 2 commit | ⏳ |
| 3.12 | `exam` (thi-thu + phong-thi, phức tạp nhất) | 2-3 commit | ⏳ |
| 4 | Router cleanup (flat → directory nhất quán) | 1 commit | ⏳ |
| 5 | Skill update + RFC close | 1 commit | ⏳ |

Tổng ~20-25 commit, 5-6 ngày work team 4 người.

## Per-feature checklist (phase 3)

Copy vào mỗi PR description của phase 3:

```
[ ] 1. Tạo src/features/<name>/{components,lib,queries}
[ ] 2. Move src/components/<relevant> → features/<name>/components
[ ] 3. Move src/lib/<name> → features/<name>/lib
[ ] 4. Move src/routes/*/-components/<relevant> → features/<name>/components
[ ] 5. Move src/lib/queries/<name>.ts → features/<name>/queries.ts
[ ] 6. Rewrite UI từng component:
     - Hardcoded color → token (RFC 0001)
     - Gradient → solid (RFC 0000)
     - border-b-4 khỏi cards/tables (RFC 0000)
     - Max 2 hue per component
     - Remove dark: overrides khi đã token
[ ] 7. Split file > 300 dòng (component) hoặc > 80 dòng (route)
[ ] 8. Tạo features/<name>/index.ts (public API)
[ ] 9. Update imports globally:
     - #/components/<old> → #/features/<name>
     - #/lib/<name> → #/features/<name>
[ ] 10. Route files update import, giữ URL nguyên
[ ] 11. Verify: tsc --noEmit + biome check + pnpm build
[ ] 12. Smoke test dev server
[ ] 13. Commit: refactor(<name>): migrate to feature folder + design tokens
```

## Bắt đầu từ đâu trong thread mới

**Recommend: Phase 0 trước.** Tạo skeleton folders, update tsconfig alias, commit, verify build vẫn chạy. Đây là safety checkpoint trước khi move hàng loạt.

Prompt mẫu cho thread mới:

```
Đọc docs/rfcs/0007-package-by-feature.md và docs/handoffs/0007-package-by-feature-handoff.md.
Bắt đầu Phase 0: tạo skeleton folder, update tsconfig path alias. 
Verify tsc + build pass. Commit rồi dừng lại báo cáo.
```

## Cần confirm từ user trước khi thread mới bắt đầu

Các câu hỏi đã đưa nhưng chưa close:

1. **Routes structure cụ thể trong RFC (dòng ~100)** — có cần review lại trước khi tôi rename hàng loạt không? Ví dụ `_app/luyen-tap/ky-nang/nghe/{index,$exerciseId}.tsx` so với style hiện tại `_app.luyen-tap.ky-nang.nghe.$exerciseId/`.

2. **Freeze branch `mobile`?** Trong thời gian migrate (5-6 ngày) có cho merge main → mobile không. Nếu có: conflict lớn. Nếu không: mobile fall behind.

3. **RFC 0007 có cần commit trước khi start không?** Hay đợi review kỹ hơn.

4. **Ai làm phase nào?** Nếu team 4 người parallel: chia phase 3.x cho từng người. Chú ý dep: 3.1-3.7 độc lập, 3.8-3.12 có dep lẫn nhau.

5. **Pattern cho `practice/skills/_shared/`** — 4 kỹ năng share McqQuestionList, McqNavBar, InteractivePassage, etc. Cấu trúc recommend:
   ```
   features/practice/
     skills/
       _shared/components/  # cross-skill components
       listening/{components, lib, index.ts}
       reading/...
       writing/...
       speaking/...
   ```
   Hay tách luôn `features/practice-core/` riêng? Confirm chốt style trước phase 3.10.

## Artifact references (cần re-read nếu cần)

| Loại | Path | Khi nào cần |
|---|---|---|
| RFC chính | `docs/rfcs/0007-package-by-feature.md` | Luôn luôn |
| RFC 0000 | `docs/rfcs/0000-design-direction.md` | Mỗi lần rewrite UI |
| RFC 0001 | `docs/rfcs/0001-design-token-consistency.md` | Token mapping |
| RFC 0002 | `docs/rfcs/0002-layout-spacing-consistency.md` | Layout + gamification |
| Skill refactor | `.agents/skills/refactor` | Quy trình |
| Skill rfc | `.agents/skills/rfc` | Update RFC status |
| Skill design-system | `.agents/skills/design-system` | Tokens, patterns |
| Biome config | `biome.jsonc` (nếu có) | Format rules |
| tsconfig | `tsconfig.json` | Path alias |
| Vite config | `vite.config.ts` | Router plugin |

## Commands cheat sheet

```bash
# Verify sau mỗi phase
pnpm exec tsc --noEmit
pnpm exec biome check --max-diagnostics=500 .
pnpm build

# Biome auto-fix
pnpm exec biome check --write .

# Scan evidence design token
rg -c '(text|bg|border)-(emerald|rose|amber|slate|gray|blue|green|red|yellow|purple|indigo|sky|teal|cyan|orange|pink|fuchsia|violet|lime)-\d' -g '*.tsx' -g '*.ts' src/

# File quá dài
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -exec wc -l {} + | awk '$1 > 300'

# Dead exports (quick heuristic)
# Lấy file list từ components/common → kiểm tra ai import
```

## Warning cho thread mới

1. **Không tự ý thêm feature mới.** OnboardingBanner render, NextActionCard render, Lesson Complete Duolingo 3-stat, "Bài tiếp theo" button vẫn pending trong RFC 0003/0004 — làm **sau** migration, không gộp.

2. **Không đụng backend-v2, bun.lock, composer.json.** Dirty worktree hiện có 3 file unrelated (backend + bun.lock) — ignore, không stage.

3. **Không commit mà user không yêu cầu.** AGENTS.md rule 79.

4. **Khi plugin TanStack rewrite `createFileRoute(...)` string**, verify `git diff` xem có corrupt không trước khi commit. Đã có precedent bug.

5. **Phase 3.12 (exam)** phức tạp nhất, risk cao — nếu dừng migration giữa chừng, nên dừng sau phase 3.11 chứ không dừng giữa 3.12.

6. **Không quên update RFC status**. Mỗi phase xong → tick checkbox trong `docs/rfcs/0007-package-by-feature.md` + đổi `Updated` date.

## Success criteria

Khi thread mới kết thúc, các tiêu chí sau phải đạt:

- [ ] Tất cả phase tick xong trong RFC 0007
- [ ] `pnpm exec tsc --noEmit` clean
- [ ] `pnpm exec biome check .` clean (< 5 warnings OK, 0 errors)
- [ ] `pnpm build` pass
- [ ] Dev server chạy, smoke test click qua mọi page
- [ ] 0 file route > 80 dòng
- [ ] 0 component > 300 dòng (trừ có exemption document hóa)
- [ ] 0 hardcoded color (rg check)
- [ ] 0 gradient (trừ landing page)
- [ ] 0 `border-b-4` trên cards/tables
- [ ] 0 dead export trong `components/` hoặc `lib/`
- [ ] Import graph: không có `features/X → features/Y` (trừ qua `index.ts`)
- [ ] RFC 0001, 0002, 0007 → status `Implemented`
- [ ] Skill files cập nhật convention mới
