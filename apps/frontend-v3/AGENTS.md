# VSTEP Frontend V3 — Agent Instructions

Stack: bun · Vite 8 · React 19 · TanStack Router + Query v5 · Tailwind v4 · Biome · ky · Recharts.

Commands: `bun run dev` · `bun run build` · `bun run lint`.

## Architecture

- Route → Component → Hook → Lib. Không vòng.
- Server state = TanStack Query. UI state = useState/context.
- No UI library (shadcn, MUI). Custom components theo design tokens.
- Icons = `assets/icons/*.svg` (Duo SVG). Fonts = `public/fonts/` (Duolingo Sans + Feather).
- Mockup (`apps/mockup/`) là source of truth cho UI.

## Data rules (bất di bất dịch)

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
