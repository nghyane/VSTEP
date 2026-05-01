# VSTEP Mobile V2 — Agent Instructions

Stack: Expo ~54 · React Native 0.81 · Expo Router ~6 · TanStack Query v5 · Nunito fonts · TypeScript.

Commands: `bun run start` · `bun run android` · `bun run ios` · `bun run lint` · `bun run typecheck`.

## Architecture

- Route → Component → Hook → Lib. No circular dependencies.
- Server state = TanStack Query. Client state = React Context/Zustand (auth, UI, local stores).
- No UI library (shadcn, MUI). Custom components using design tokens.
- Icons = `assets/icons/*.png`. Fonts = `assets/fonts/Nunito-*.ttf`.
- Design mirrors frontend-v3: theme, flow, naming.

## State Management

- **Server data**: TanStack Query (`useQuery` + `select`). No prop drilling.
- **Auth**: React Context (`src/contexts/AuthContext.tsx`). `useAuth()` for guards + actions.
- **Local stores**: Zustand for coin, streak, notification (`src/features/*/`).
- **Animations**: React Native Animated API or react-native-reanimated.
- **URL state**: Expo Router params. No useState for route state.

## Code Rules

- **No inline helpers.** Formatting, date — use `src/lib/utils.ts` (create if missing).
- **No hardcoded values.** Colors use `src/theme/colors.ts`. No hex in components.
- **No mock data in components.** Data from API (TanStack Query). If API missing → create endpoint first.
- **Shared before inline.** Before writing helper/type/constant → grep `src/lib/` and `src/types/` first.
- **No `as` casts in business logic.** Only at RN boundary. Use discriminated unions, `===` checks.
- **No `!` non-null assertions.** Use early return or null check.
- **Consistent API responses.** Backend always returns `{ data: T }`. Frontend uses `.json<ApiResponse<T>>()`.
- **Error handling.** Global error handler on QueryClient. Components do not try/catch for toast.
- **Consistent loading states.** Use shared `LoadingScreen` component.

## Data Rules (immutable)

- 1 User → many Profiles. 1 Profile = 1 Target (level + deadline). Do not change target, create new profile.
- Profile = billing unit. Each profile is one "course".
- Chart/spider = **exam only** (graded). Drill scores excluded from chart.
- Study time + streak = **drill only**. Exam does not count.
- FSRS adaptive = **vocab only**. Exam = fixed questions.
- Grading result: Strengths → Improvements → Rewrites. Do not change order.

## Design Tokens

Source of truth: `src/theme/colors.ts` synced with `apps/frontend-v3/src/styles.css @theme`.

- Primary: `#58CC02` (VSTEP green)
- Semantic: destructive `#EA4335`, warning `#FF9B00`, success `#58CC02`, info `#1CB0F6`
- Skills: listening `#1CB0F6`, reading `#7850C8`, writing `#58CC02`, speaking `#FFC800`
- Neutrals: background `#F7F7FA`, surface `#FFFFFF`, border `#E5E5E5`
- Components use token names, never hardcode hex.

## Layout

- Bottom tabs navigation (4 tabs: Overview, Practice, Exams, Profile).
- Cards: `DepthCard` component — border-2 border-b-4 rounded-xl.
- Buttons: `DepthButton` component — 3D press effect.
- Focus mode: `headerShown: false` for exam/practice screens.
- Safe area: `useSafeAreaInsets()` from react-native-safe-area-context.

## Component Patterns

- Props ≤ 3 per component. Group related props into shared types.
- Components used ≥ 2 places → shared (`src/components/`).
- Hook file: 1 state machine (useReducer + useMutation for 1 flow).
- No inline `.map()` for fixed UI sets — write explicitly.
- Text: always use `fontFamily` from theme, no hardcoded font names.

## Mobile-Specific

- **Haptics**: `expo-haptics` for tactile feedback. Use `HapticTouchable` wrapper.
- **Mascot**: "Lạc" character with animation states (happy, think, sad, wave, hero, listen, read, write, speak, vocabulary, levelup). Use sparingly, appropriate expression.
- **Audio**: `expo-av` for playback. No native controls for exam audio.
- **Speech**: `expo-speech` for text-to-speech practice.
- **Secure storage**: `expo-secure-store` for tokens. No AsyncStorage for tokens.

## Workflow

### Mandatory before coding (each new session)

1. Read `AGENTS.md` and `.agents/skills/handoff/SKILL.md` only as the session bootstrap.
2. Read `src/lib/learner-flow-parity.ts` — check feature status.
3. Load only the task-relevant skills from the handoff skill mapping.
4. Read wiki files only when the loaded skill explicitly references them or the task needs deeper implementation details.
5. Grep FE v3 patterns — find reference implementation.
6. Grep BE v2 routes — find API endpoint.
7. Plan: screens → components → hooks → API.
8. Confirm with user if plan > 3 files.

### Mandatory before handoff

1. Read `handoff` skill — `.agents/skills/handoff/SKILL.md`
2. Follow Section 8 — append session notes template
3. Update `HANDOFF.md` if progress made
4. Update `LOG.md` if important decision made
5. Double check: all changed files are documented

### Mandatory before commit/push

1. Read `commit-push` skill — `.agents/skills/commit-push/SKILL.md`
2. Follow pre-commit checklist: typecheck PASS, lint PASS, no console.log, no any
3. Commit message in Conventional Commits format (ENGLISH, detailed body)
4. Only stage files related to current task
5. NO force-push, NO rebase

### Coding workflow

- Change > 3 files: plan first, confirm, then code.
- Audit before creating new files. Grep existing patterns.
- `bun run lint` and `bun run typecheck` after every edit.
- Do not commit unless user requests.

## Hard Limits

- Function ≤ 50 lines. Props ≤ 3.
- Route page ≤ 80 lines — compose only. Logic in `src/hooks/`.
- Component file: 1 concern. Multiple concerns → split file.
- No `any`. No `console.log`. No commented-out code.

---

## Session Rules (immutable)

### Before coding ANYTHING
- ✅ Read `AGENTS.md` + `.agents/skills/handoff/SKILL.md` as bootstrap
- ✅ Read `learner-flow-parity.ts` — know feature status
- ✅ Load only task-relevant skills
- ✅ Read wiki files only on demand for deeper details
- ✅ Grep FE v3 + BE v2 — find reference
- ✅ Plan > 3 files → confirm with user

### Before handoff
- ✅ Read `handoff` skill — `.agents/skills/handoff/SKILL.md`
- ✅ Follow Section 8 template — append session notes
- ✅ Update `HANDOFF.md` + `LOG.md`

### Before commit/push
- ✅ Read `commit-push` skill — `.agents/skills/commit-push/SKILL.md`
- ✅ Pre-commit checklist: typecheck PASS, lint PASS
- ✅ Commit message in ENGLISH, Conventional Commits format, with full change list in body
- ✅ Only stage related files — NO force-push
