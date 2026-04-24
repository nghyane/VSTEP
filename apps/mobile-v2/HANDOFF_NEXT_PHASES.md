# Mobile v2 Handoff — Session Tiếp Theo

## Current state

- Branch: `mobile`
- Latest commit: `e4ed26b chore(mobile-v2): update learner flow parity — mark Phase 1+3 done, integrate external commit notes`
- `main` đã merge vào `mobile` qua `4db545d`
- Remote: `origin/mobile` đã push

## Source of truth (theo thứ tự ưu tiên)

1. Backend API contract: `apps/backend-v2/routes/api.php`
2. Web learner flow & UI reference: `apps/frontend-v3`
3. Mobile implementation: `apps/mobile-v2`
4. Audit checklist: `apps/mobile-v2/src/lib/learner-flow-parity.ts`

## Scope rules

- Làm việc **chỉ trong** `apps/mobile-v2` trừ khi được chỉ định khác.
- Không động vào legacy apps: `apps/frontend-v2`, `apps/frontend`, `apps/mobile`, `apps/_deprecated`.
- API contract owned bởi `backend-v2`. Mobile là consumer only.
- Trước khi code: đọc `learner-flow-parity.ts` để biết status và gaps của feature.
- Change >3 files: plan trước, confirm, rồi code.
- Luôn chạy `bun run typecheck` trong `apps/mobile-v2` trước khi commit.

## Phase summary

| Phase | Area | Status | Notes |
|-------|------|--------|-------|
| 1 | Auth/session restore/onboarding | ✅ **done** | Refresh authoritative, explicit auth states, register payload aligned, onboarding dùng complete-onboarding |
| 2 | Shared focused primitives | ✅ **gộp vào Phase 3** | FocusHeader, SubmitFooter, SupportPanel đã tạo |
| 3 | Listening/Reading parity | ✅ **done** | Support API wired, type parity hoàn chỉnh, CC toggle, translation display, audio error handling |
| 4 | Vocab/Grammar final parity | ✅ **done** | SRS review invalidate/refetch, reusable session hooks, shared primitives, grammar feedback states |
| 5 | Writing async grading | ⏳ | Xem chi tiết bên dưới |
| 6 | Speaking + drill flow | ⏳ | Xem chi tiết bên dưới |
| 7 | Exam room MCQ core | ⏳ | Xem chi tiết bên dưới |
| 8 | Exam full submit/results | ⏳ | Xem chi tiết bên dưới |
| 9 | Profile/goal/account | ⏳ | Xem chi tiết bên dưới |
| 10 | Dashboard parity | ⏳ | Xem chi tiết bên dưới |
| 11 | Notifications/Wallet/Courses | ⏳ | Xem chi tiết bên dưới |
| 12 | Final UI polish | ⏳ | Chỉ sau khi flow parity đúng |

## Phase tiếp theo — chi tiết

### Phase 4 — Vocab/Grammar final parity

**Goal:** Hoàn thiện foundation behavior cho vocabulary và grammar.

**Definition of done:** ✅
- SRS review invalidate/refetch đúng như FE-v3 (`useSrsReviewMutation` với `queryClient.invalidateQueries`)
- Session hooks reusable cho vocab (`useVocabExerciseSession`) + grammar (`useGrammarExerciseSession`)
- Empty/complete states thống nhất qua shared components (`MascotResult`, `MascotEmpty`, `FocusHeader`)
- Grammar exercise có feedback states đúng parity

---

### Phase 5 — Writing async parity

**Goal:** Writing có full async grading lifecycle.

**Files cần inspect:**
- FE-v3: `src/routes/_focused/writing/$promptId.tsx`, `src/routes/_focused/grading/writing.$submissionId.tsx`, `src/features/practice/components/WritingInProgress.tsx`, `src/features/grading/components/WritingResult.tsx`
- Mobile: `app/(app)/practice/writing/`, `app/(app)/grading/writing/[submissionId].tsx`, `src/hooks/use-practice.ts`
- Backend: `GET/POST /api/v1/practice/writing/*`, `GET /api/v1/grading/writing/practice_writing/{submissionId}`

**Gaps cần xử lý:**
- Writing history UI chưa có
- Writing type thiếu: `keywords`, `sampleAnswer`, `sampleMarkers`
- Grading screen poll result nhưng không hiện explicit job/status states
- Writing editor cần scrollable (FE-v3 commit `ee836b5`)
- TranslateSelection popup (FE-v3 commit `490b35f`) — cân nhắc port sang mobile
- Support API cho writing sessions (`POST /practice/writing/sessions/{sessionId}/support`)

**Definition of done:**
- Writing history có UI hiển thị
- Writing prompt detail có đầy đủ fields
- Grading screen hiện states: pending → processing → completed/failed
- Writing editor scrollable trên mobile
- Support API wired cho writing sessions

---

### Phase 6 — Speaking parity + drill flow

**Goal:** Hoàn thiện VSTEP speaking upload/grading và thêm drill flow.

**Files cần inspect:**
- FE-v3: `src/routes/_focused/speaking/task/$taskId.tsx`, `src/routes/_focused/speaking/drill/$drillId.tsx`, `src/routes/_focused/grading/speaking.$submissionId.tsx`, `src/features/practice/components/VstepSpeakingInProgress.tsx`, `src/features/practice/use-voice-recorder.ts`, `src/features/grading/components/SpeakingResult.tsx`
- Mobile: `app/(app)/practice/speaking/`, `app/(app)/grading/speaking/[submissionId].tsx`, `src/hooks/use-practice.ts`
- Backend: `GET/POST /api/v1/practice/speaking/*`, `POST /api/v1/audio/presign-upload`, `GET /api/v1/grading/speaking/practice_speaking/{submissionId}`

**Gaps cần xử lý:**
- Audio recording chưa upload qua `presign-upload` trước khi submit
- Speaking VSTEP history UI chưa có
- Speaking drill flow hoàn toàn chưa có: list drills → detail → start session → sentence attempts → history
- Grading screen poll result nhưng không hiện explicit job/status states
- VstepSpeakingInProgress đã update ở FE-v3 (commit `490b35f`) — cần align mobile
- TranslateSelection popup — cân nhắc port

**Definition of done:**
- Speaking VSTEP: record → presign-upload → submit → poll grading → show result states
- Speaking drill: đầy đủ CRUD flow (list, detail, session, attempt, history)
- Grading screen hiện explicit states cho cả writing và speaking

---

### Phase 7 — Exam room MCQ core

**Goal:** Full/custom start, real session data, timer, listening/reading answers.

**Files cần inspect:**
- FE-v3: `src/routes/_focused/phong-thi/$sessionId.tsx`, `src/features/exam/use-exam-session.ts`, `src/features/exam/components/ListeningPanel.tsx`, `src/features/exam/components/ReadingPanel.tsx`, `src/features/exam/components/DeviceTestWidgets.tsx`
- Mobile: `app/(app)/session/[id].tsx`, `app/(app)/exam/[id].tsx`, `app/(app)/(tabs)/exams.tsx`, `src/hooks/use-exam-session.ts`, `src/hooks/use-exams.ts`
- Backend: `GET/POST /api/v1/exams/*`, `GET/POST /api/v1/exam-sessions/*`

**Gaps cần xử lý:**
- Mobile chỉ start full exam, chưa có custom selected-skills flow
- Config/pricing chưa dùng trên exam detail như FE-v3
- Exam cards + detail header đã polish ở FE-v3 (commit `17d5380`) — mobile cần align
- Passage highlighter (commit `d0ead97`) — mobile exam reading chưa có
- Submit warning scoped to selected skills — mobile chưa có
- Exam sessions API giờ trả array thay vì paginator (commit `7a8be17`) — mobile hook có thể cần update
- Device test widgets cho speaking/listening trước khi vào exam

**Definition of done:**
- Exam detail có custom skill selection + config/pricing
- Exam room có real session data, timer, listening/reading answers đúng parity
- Passage highlighter trong reading exam
- Submit warning đúng scope selected skills
- Device test trước khi vào exam (mic/speaker check)

---

### Phase 8 — Exam full submit/results

**Goal:** Writing/speaking answers, async results, active session resume.

**Files cần inspect:**
- FE-v3: `src/routes/_focused/phong-thi/$sessionId.tsx` (writing/speaking sections), `src/features/exam/components/WritingPanel.tsx`, `src/features/exam/components/SpeakingPanel.tsx`, `src/features/exam/components/DeviceTestWidgets.tsx`
- Mobile: `app/(app)/session/[id].tsx`, `app/(app)/exam-result/[id].tsx`, `app/(app)/grading/`
- Backend: `POST /api/v1/exam-sessions/{sessionId}/submit`, `GET /api/v1/exam-sessions/{sessionId}/writing-results`, `GET /api/v1/exam-sessions/{sessionId}/speaking-results`, `GET /api/v1/exam-sessions/active`

**Gaps cần xử lý:**
- Submit payload exam hiện chỉ có MCQ answers, thiếu writing_answers và speaking_answers
- Autosave/resume behavior chưa implement
- Active session resume endpoint (`GET /exam-sessions/active`) chưa dùng
- Writing/speaking async exam results chưa fully modeled
- Speaking studio layout + re-record fix (commit `b8e94d4`) — mobile cần align
- Backend exam/grading services đã decomposed (commit `2318192`) — verify API contract

**Definition of done:**
- Exam submit gửi đúng writing_answers + speaking_answers
- Autosave hoạt động, resume từ active session
- Exam result screen hiện đầy đủ MCQ + writing + speaking results
- Writing/speaking grading states (pending → processing → completed)
- Speaking re-record hoạt động đúng

---

### Phase 9 — Profile/goal/account parity

**Goal:** Create/edit/switch profiles như FE-v3.

**Files cần inspect:**
- FE-v3: `src/routes/_app/ho-so.tsx`, `src/features/profile`
- Mobile: `app/(app)/(tabs)/profile.tsx`, `app/(app)/goal.tsx`, `app/(app)/account.tsx`
- Backend: `GET/POST/PATCH/DELETE /api/v1/profiles`, `POST /api/v1/auth/switch-profile`

**Gaps cần xử lý:**
- Goal screen là local UI only, text tiếng Việt thiếu dấu
- Create/edit/switch profile parity với FE-v3 chưa có
- Account screen minimal, text tiếng Việt thiếu dấu

**Definition of done:**
- Profile CRUD đầy đủ (create, edit, switch, delete, reset)
- Goal screen persist qua backend profile update
- Account screen có đủ thông tin, tiếng Việt đúng dấu
- Switch profile reissue JWT đúng như backend spec

---

### Phase 10 — Dashboard parity

**Goal:** Activity heatmap, gap analysis, score trend, better next-action logic.

**Files cần inspect:**
- FE-v3: `src/routes/_app/dashboard.tsx`, `src/features/dashboard/queries.ts`, `src/features/dashboard/components/ScoreTrend.tsx`
- Mobile: `app/(app)/(tabs)/index.tsx`, `src/hooks/use-progress.ts`
- Backend: `GET /api/v1/overview`, `GET /api/v1/streak`, `GET /api/v1/activity-heatmap`

**Gaps cần xử lý:**
- Activity heatmap hook có nhưng chưa render UI
- GapAnalysis component từ FE-v3 chưa có
- ScoreTrend component mới trong FE-v3 (commit `490b35f`) — chưa port
- Next action logic đơn giản hơn FE-v3 target-band gap selector

**Definition of done:**
- Dashboard có heatmap UI
- Gap analysis hiển thị kỹ năng yếu nhất
- Score trend chart (chỉ exam graded)
- Next action logic đúng như FE-v3 target-band gap selector

---

### Phase 11 — Notifications/Wallet/Courses

**Goal:** Hoàn thiện product learner support flows.

**Files cần inspect:**
- FE-v3: `src/features/notifications`, `src/features/wallet`, `src/features/course`, `src/routes/_app/khoa-hoc`
- Mobile: `src/features/notification/`, `src/features/coin/`, `app/(app)/(tabs)/notifications.tsx`, `app/(app)/(tabs)/classes.tsx`
- Backend: `GET/POST/DELETE /api/v1/notifications/*`, `GET/POST /api/v1/wallet/*`, `GET/POST /api/v1/courses/*`

**Gaps cần xử lý:**
- Notification tab redirect về dashboard, chỉ có button/store shell
- Wallet chưa có — mobile dùng coin store local, không mirror backend wallet flow
- Classes tab redirect về dashboard, course learner flow chưa implement
- Welcome gift + top-up dialog (commit `e4ab064`) — chưa có ở mobile

**Definition of done:**
- Notification list, read-all, delete UI hoạt động
- Wallet balance, transactions, top-up, promo redeem
- Course list, detail, enrollment, booking
- Classes tab không còn redirect

---

### Phase 12 — Final UI polish

**Chỉ sau khi tất cả flow parity đúng.**

- Mascot "Lạc" usage đúng quy tắc (wave/login, happy/register, expression by step/onboarding, hero/dashboard, wave/profile, think/empty, skill-specific/practice)
- Text tiếng Việt có dấu đầy đủ
- Design tokens nhất quán với FE-v3 (`src/theme/colors.ts`)
- No hardcoded hex trong components
- Haptic feedback đúng chỗ
- Animations mượt, không layout-triggering

## Important implementation notes

### API conventions

Mobile API client (`src/lib/api.ts`):
- Tự động unwrap `{ data: T }` từ backend
- Tự động transform snake_case → camelCase cho responses
- Tự động transform camelCase → snake_case cho request bodies
- Mobile app-layer types dùng camelCase: `targetLevel`, `serverDeadlineAt`, `wordCount`

Backend API prefix:
- Mobile calls bao gồm `/api/v1/...` ví dụ: `api.get("/api/v1/overview")`
- FE-v3 dùng ky prefix nên gọi path như: `api.get("overview")`
- **KHÔNG** copy FE-v3 path strings vào mobile mà không thêm `/api/v1`

### Auth flow hiện tại (Phase 1 đã xong)

- App launch gọi `refreshSession()` để validate refresh token
- Refresh thành công → set user/profile → authenticated
- Refresh fail → clear tokens → unauthenticated → redirect login
- Authenticated nhưng chưa có profile → redirect onboarding
- Onboarding hoàn tất → `POST /auth/complete-onboarding` → lưu access token + profile

### Audio handling (Phase 3 đã fix)

- `resolveAssetUrl()` trong `src/lib/asset-url.ts` chuyển relative paths thành full API URLs
- Audio load/play wrapped trong try/catch, không crash app
- CC subtitle toggle cho listening, translation display cho reading

### Shared focused primitives (Phase 3 đã tạo)

- `FocusHeader` — progress bar + count, dùng cho listening/reading/vocab/grammar/exam
- `SubmitFooter` — dot nav + submit button, dùng cho listening/reading/exam
- `SupportPanel` — hint/translation support, dùng cho listening/reading

## Verification commands

Luôn chạy trước khi commit/handoff:

```powershell
cd apps\mobile-v2
bun run typecheck
```

Optional runtime:

```powershell
cd apps\mobile-v2
bun start
```

## Git notes

Current branch: `mobile`
Remote: `origin/mobile`

Nếu tiếp tục từ đây:

1. Pull latest `mobile` trước:
   ```powershell
   git pull --no-rebase origin mobile
   ```
2. Làm việc chỉ trong `apps/mobile-v2` trừ khi được chỉ định.
3. Chạy typecheck sau mỗi thay đổi lớn.
4. Commit với scoped messages, ví dụ:
   ```
   feat(mobile-v2): phase 4 — vocab SRS review parity
   fix(mobile-v2): align grammar exercise feedback states
   feat(mobile-v2): phase 5 — writing async grading lifecycle
   ```
5. Không rebase, không force-push, không `reset --hard` trừ khi được yêu cầu rõ ràng.

## External commits cần lưu ý (từ người khác)

| Commit | Author | Summary | Impact Mobile |
|--------|--------|---------|---------------|
| `490b35f` | nhật phát | translate selection popup + score trend + speaking/writing UI updates | Cần port TranslateSelection, ScoreTrend |
| `b8e94d4` | phatse | speaking studio layout + re-record fix | Exam speaking align |
| `d0ead97` | phatse | passage highlighter + scoped submit warning | Exam reading highlighter |
| `ee836b5` | phatse | gamified toast + scrollable writing editor | Writing editor scrollable |
| `17d5380` | phatse | exam cards + detail header polish | Exam UI align |
| `7a8be17` | phatse | exam sessions returns array not paginator | Hook update may need |
| `4cfbc2d` | nhật phát | vocab query invalidate on unmount | SRS review fix |
| `2318192` | nghyane | decompose exam/grading services (backend) | API contract verify |
| `0253726` | nghyane | official Google token verifier (backend) | Google login ready |
| `e4ab064` | phatse | wallet welcome gift + top-up dialog | Wallet/Coin align |
| `2924ff0` | phatse | splash loader + safer auth boot | Auth boot align |
| `b6a499e` | phatse | block child routes on auth init | Auth guard align |

## Recommended next implementation order

Bắt đầu từ **Phase 4**, không nhảy qua UI polish.

1. ~~**Phase 4**~~ — Vocab/Grammar final parity (foundation hoàn thiện) ✅
2. **Phase 5** — Writing async grading (writing flow + grading states)
3. **Phase 6** — Speaking + drill flow (upload audio, drill CRUD, grading)
4. **Phase 7** — Exam room MCQ core (custom start, real data, timer)
5. **Phase 8** — Exam full submit/results (writing/speaking answers, autosave, resume)
6. **Phase 9** — Profile/goal/account (CRUD, switch, persist)
7. **Phase 10** — Dashboard parity (heatmap, gap analysis, score trend)
8. **Phase 11** — Notifications/Wallet/Courses (support flows)
9. **Phase 12** — Final UI polish (sau khi tất cả flow parity đúng)
