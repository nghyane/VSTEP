# VSTEP Mobile V2 — Agent Instructions

Stack: Expo ~54 · React Native 0.81 · Expo Router ~6 · TanStack Query v5 · Nunito fonts · TypeScript.

Commands: `bun run start` · `bun run android` · `bun run ios` · `bun run lint` · `bun run typecheck`.

## Architecture

- Route → Component → Hook → Lib. Không vòng.
- Server state = TanStack Query. Client state = React Context/Zustand (auth, UI, local stores).
- No UI library (shadcn, MUI). Custom components theo design tokens.
- Icons = `assets/icons/*.png`. Fonts = `assets/fonts/Nunito-*.ttf`.
- Design bám sát frontend-v3 về theme, flow, naming.

## State Management

- **Server data**: TanStack Query (`useQuery` + `select`). Không prop drill.
- **Auth**: React Context (`src/contexts/AuthContext.tsx`). `useAuth()` cho guards + actions.
- **Local stores**: Zustand cho coin, streak, notification (`src/features/*/`).
- **Animations**: React Native Animated API hoặc react-native-reanimated.
- **URL state**: Expo Router params. Không useState cho route state.

## Code Rules

- **No inline helpers.** Formatting, date — dùng `src/lib/utils.ts` (tạo nếu chưa có).
- **No hardcode values.** Colors dùng `src/theme/colors.ts`. Không hex trong components.
- **No mock data trong components.** Data từ API (TanStack Query). Nếu API chưa có → tạo endpoint trước.
- **Shared trước, inline sau.** Trước khi viết helper/type/constant → grep `src/lib/` và `src/types/` xem đã có chưa.
- **No `as` casts trong business logic.** Chỉ chấp nhận ở RN boundary. Dùng discriminated union, `===` check.
- **No `!` non-null assertions.** Dùng early return, null check.
- **API response nhất quán.** Backend luôn trả `{ data: T }`. Frontend dùng `.json<ApiResponse<T>>()`.
- **Error handling.** Global error handler trên QueryClient. Components không try/catch cho toast.
- **Loading states nhất quán.** Dùng shared `LoadingScreen` component.

## Data Rules (bất di bất dịch)

- 1 User → nhiều Profile. 1 Profile = 1 Target (level + deadline). Không đổi target, tạo profile mới.
- Profile = đơn vị tính tiền. Mỗi profile là 1 "khóa học".
- Chart/spider = **chỉ exam** (graded). Drill score không vào chart.
- Study time + streak = **chỉ drill**. Exam không cộng.
- FSRS adaptive **chỉ vocab**. Exam = đề cố định.
- Grading result: Strengths → Improvements → Rewrites. Không đổi.

## Design Tokens

Source of truth: `src/theme/colors.ts` synced với `apps/frontend-v3/src/styles.css @theme`.

- Primary: `#58CC02` (VSTEP green)
- Semantic: destructive `#EA4335`, warning `#FF9B00`, success `#58CC02`, info `#1CB0F6`
- Skills: listening `#1CB0F6`, reading `#7850C8`, writing `#58CC02`, speaking `#FFC800`
- Neutrals: background `#F7F7FA`, surface `#FFFFFF`, border `#E5E5E5`
- Components use token names, never hardcode hex.

## Layout

- Bottom tabs navigation (4 tabs: Tổng quan, Luyện tập, Thi thử, Hồ sơ).
- Cards: `DepthCard` component — border-2 border-b-4 rounded-xl.
- Buttons: `DepthButton` component — 3D press effect.
- Focus mode: `headerShown: false` cho exam/practice screens.
- Safe area: `useSafeAreaInsets()` từ react-native-safe-area-context.

## Component Patterns

- Props ≤ 3 per component. Group related props vào shared types.
- Components dùng ≥ 2 nơi → shared (`src/components/`).
- Hook file: 1 state machine (useReducer + useMutation cho 1 flow).
- No inline `.map()` cho fixed UI sets — viết tường minh.
- Text: luôn dùng `fontFamily` từ theme, không hardcode font names.

## Mobile-Specific

- **Haptics**: `expo-haptics` cho tactile feedback. Dùng `HapticTouchable` wrapper.
- **Mascot**: "Lạc" character với animation states (happy, think, sad, wave, hero, listen, read, write, speak, vocabulary, levelup). Dùng tiết chế, đúng biểu cảm.
- **Audio**: `expo-av` cho playback. Không dùng native controls cho exam audio.
- **Speech**: `expo-speech` cho text-to-speech practice.
- **Secure storage**: `expo-secure-store` cho tokens. Không lưu token trong AsyncStorage.

## Workflow

- Trước khi code: đọc `src/lib/learner-flow-parity.ts` để biết status feature.
- Change >3 files: plan trước, confirm, rồi code.
- Audit trước khi tạo mới. Grep existing patterns.
- `bun run lint` và `bun run typecheck` sau mỗi edit. Không commit trừ khi user yêu cầu.

## Hard Limits

- Function ≤ 50 lines. Props ≤ 3.
- Route page ≤ 80 lines — chỉ compose. Logic trong `src/hooks/`.
- Component file: 1 concern. Nhiều concern → tách file.
- No `any`. No `console.log`. No commented-out code.
