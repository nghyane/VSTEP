# VSTEP Frontend V3 — Agent Instructions

Stack: bun · Vite 8 · React 19 · TanStack Router + Query v5 · Tailwind v4 · Biome · ky · Recharts.

Commands: `bun run dev` · `bun run build` · `bun run lint`.

## Architecture

- Route → Component → Hook → Lib. Không vòng.
- Server state = TanStack Query. Client state = Zustand (auth, UI). Form state = @tanstack/react-form.
- No UI library (shadcn, MUI). Custom components theo design tokens.
- Icons = `assets/icons/*.svg` (Duo SVG). Fonts = `public/fonts/` (Duolingo Sans + Feather).

## State management

- **Server data**: TanStack Query (`useQuery` + `select`). Không prop drill.
- **Auth**: Zustand discriminated union (`lib/auth.ts`). `useSession()` cho _app context (typed non-null). `useAuth` cho guards + actions.
- **Forms**: @tanstack/react-form (`useForm`). Không useState per field.
- **URL state**: TanStack Router search params. Không useState cho modal/tab/step.
- **Khi gặp case mới**: đánh giá trước — nếu state cần share > 1 component → Zustand. Nếu chỉ 1 component → useState OK. Nếu URL-representable → search params.
- Mockup (`apps/mockup/`) là source of truth cho UI.

## Code rules

- **No inline helpers.** Formatting, rounding, date — dùng `lib/utils.ts`. Không viết function cục bộ trong component.
- **No hardcode values.** Colors dùng `skills` config hoặc CSS variables. Không hex trong components.
- **No mock data trong components.** Data từ API (TanStack Query). Nếu API chưa có → tạo endpoint trước.
- **Shared trước, inline sau.** Trước khi viết helper/type/constant → grep `lib/` và `types/` xem đã có chưa.
- **No `as` casts trong business logic.** Chỉ chấp nhận ở DOM/React boundary. Dùng discriminated union, `===` check, early return.
- **No `!` non-null assertions.** Dùng early return, null check, hoặc `?? fallback`.
- **API response nhất quán.** Backend luôn trả `{ data: T }`. Frontend dùng `ApiResponse<T>`. Không inline type trong `.json<>()`.
- **Error handling.** Global `on-error.ts` trên QueryClient. Components không try/catch cho toast.
- **Error boundary.** Layout routes (`_app`, `_focused`) wrap Outlet trong ErrorBoundary.
- **Loading states nhất quán.** Dùng shared `Loading` component.

## Data rules (bất di bất dịch)

- 1 User → nhiều Profile. 1 Profile = 1 Target (level + deadline). Không đổi target, tạo profile mới.
- Profile = đơn vị tính tiền. Mỗi profile là 1 "khóa học".
- Không test đầu vào. User tự chọn target.
- Chart/spider = **chỉ exam** (graded). Drill score không vào chart.
- Study time + streak = **chỉ drill**. Exam không cộng.
- SRS adaptive **chỉ vocab**. Exam = đề cố định.
- Không roadmap ép buộc. Tabs rời rạc.
- Spider chart ẩn nếu < 5 bài thi.
- Grading result: Strengths → Improvements → Rewrites. Không đổi.

## Layout

- Sidebar 260px fixed. Content adaptive width.
- Focus mode (`_focused` layout): ẩn sidebar + header. Dùng `FocusBar`, `FocusComplete`, `FocusEmpty`.
- Card: `border-2 border-b-4 rounded-(--radius-card)`. Button: `box-shadow bottom, rounded-(--radius-button)`.

## Workflow

- Trước khi code: grep `.agents/wiki/` tìm kiến thức liên quan. Follow `[[links]]` nếu có.
- Change >3 files: plan trước, confirm, rồi code.
- Audit trước khi tạo mới. Grep existing patterns.
- `bun run lint` sau mỗi edit. Không commit trừ khi user yêu cầu.

## Wiki (bắt buộc)

Ghi `.agents/wiki/` + append LOG.md khi:
- Fix bug mà phải sửa > 1 lần (root cause không obvious)
- Phát hiện pattern sai lặp lại (anti-pattern mới)
- Thay đổi architecture decision (auth, API, state management)
- Research library/convention mới mà kết quả khác expectation
- Refactor mà lý do không rõ từ code alone

Không ghi khi: typo fix, style tweak, thêm feature đơn giản theo pattern có sẵn.

## Hard limits

- Function ≤ 50 lines. Props ≤ 3.
- Route page ≤ 80 lines — chỉ compose.
- Component file: 1 concern. Nhiều concern → tách file. Không limit dòng cứng.
- Component dùng ≥ 2 nơi → shared (lib/ hoặc components/).
- Hook file: 1 state machine (useReducer + useMutation cho 1 flow).
- No `any`. No `console.log`. No commented-out code. No barrel files.
