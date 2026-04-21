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
- **Auth**: Zustand store (`lib/auth.ts`). Không Context/Provider.
- **Forms**: @tanstack/react-form (`useForm`). Không useState per field.
- **URL state**: TanStack Router search params. Không useState cho modal/tab/step.
- **Khi gặp case mới**: đánh giá trước — nếu state cần share > 1 component → Zustand. Nếu chỉ 1 component → useState OK. Nếu URL-representable → search params.
- Mockup (`apps/mockup/`) là source of truth cho UI.

## Code rules

- **No inline helpers.** Formatting, rounding, date — dùng `lib/utils.ts`. Không viết function cục bộ trong component.
- **No hardcode values.** Colors dùng `SKILL_CONFIG` hoặc CSS variables. Không hex trong components.
- **No mock data trong components.** Data từ API (TanStack Query). Nếu API chưa có → tạo endpoint trước.
- **Shared trước, inline sau.** Trước khi viết helper/type/constant → grep `lib/` và `types/` xem đã có chưa.
- **No `as` casts trong business logic.** Chỉ chấp nhận ở DOM/React boundary. Dùng discriminated union, `===` check, early return.
- **API response nhất quán.** Backend luôn trả `{ data: T }`. Frontend dùng `ApiResponse<T>`. Không inline type trong `.json<>()`.
- **Error boundary.** Mọi route page wrap trong Error Boundary. Fallback UI khi component crash.
- **Loading states nhất quán.** Dùng shared loading pattern, không mỗi component tự xử lý khác nhau.

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
- Focus mode (thi): ẩn sidebar + header.
- Card: `border-2 border-b-4 rounded-[16px]`. Button: `box-shadow bottom, rounded-[13px]`.

## Workflow

- Change >3 files: plan trước, confirm, rồi code.
- Audit trước khi tạo mới. Grep existing patterns.
- `bun run lint` sau mỗi edit. Không commit trừ khi user yêu cầu.

## Hard limits

- File ≤ 300 lines. Function ≤ 50 lines. Params ≤ 3.
- Route page ≤ 80 lines — chỉ compose.
- No `any`. No `console.log`. No commented-out code. No barrel files.

## Skills

`.agents/skills/` — load khi cần. Pattern mới chưa có skill: dừng, báo user.
