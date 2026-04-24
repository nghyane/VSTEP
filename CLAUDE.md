# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145). Monorepo:

| App | Stack | Port | Entry |
|-----|-------|------|-------|
| **backend-v2** | PHP 8.4 · Laravel 13 · PostgreSQL · Redis | 8000 | `apps/backend-v2/` |
| **frontend-v3** | bun · Vite 8 · React 19 · TanStack Router + Query v5 · Tailwind v4 · Biome · ky · Recharts | 5173 | `apps/frontend-v3/` |
| **mockup** | UI source of truth (design reference) | -- | `apps/mockup/` |
| **frontend-v2** | [LEGACY] TanStack Start + shadcn/ui | -- | `apps/frontend-v2/` |
| **frontend** | [LEGACY] React 19 + Vite 7 | -- | `apps/frontend/` |

> **Active development:** `frontend-v3`. Legacy `frontend-v2/` và `frontend/` không còn phát triển — chỉ dùng để tham khảo spec cũ khi cần.

## Commands

### Backend (`apps/backend-v2/`)

```bash
php artisan serve             # Start dev server
php artisan test              # Run tests
php artisan horizon           # Queue worker
php artisan migrate           # Run migrations
php artisan db:seed           # Seed database
./vendor/bin/pint             # Lint + format
```

### Frontend-v3 (`apps/frontend-v3/`)

```bash
bun install
bun run dev                   # Vite dev server
bun run build                 # Production build
bun run lint                  # Biome lint + format
```

### Infrastructure

```bash
docker compose up -d          # Start PostgreSQL + Redis
```

---

## Global Rules

- **No secrets in code or logs.** Use `.env` files (git-ignored).
- **Structured JSON logging** in all services. Use `Log` facade (backend), never `console.log` or `print()`.
- **Throw errors, don't return them.** All apps use typed error hierarchies.
- **YAGNI** -- no speculative code. No consumer = no commit.
- **Git:** Never rebase without asking. Never force push. Never `git reset --hard`. Chỉ commit khi user yêu cầu.
- **Lint after every edit.** Thứ tự bắt buộc sau mỗi thay đổi:
  1. `mcp__ide__getDiagnostics` — verify ngay, không đoán
  2. Nếu lỗi → fix → verify lại → `mcp__ide__getDiagnostics` lần cuối
  3. Hết lỗi → `bun run lint` (hoặc `bunx biome check --fix ./src/<path/to/file.tsx>`) cho frontend-v3
  4. Verify cuối → mới sang task tiếp theo
- **Fail 3 lần cùng lỗi → đổi approach.** Không loop edit-đoán. Dùng `mcp__ide__getDiagnostics` để xác nhận lỗi thật, không phải đoán.
- **Đọc code trước khi sửa.** Sửa nhỏ nhất có thể. Không refactor ngoài scope.

---

## Architecture

### Backend

See `apps/backend-v2/AGENTS.md` for full Laravel conventions.

### Frontend-v3

**Entry point bắt buộc đọc đầu tiên:** [apps/frontend-v3/AGENTS.md](apps/frontend-v3/AGENTS.md).
**Wiki knowledge base (grep trước khi code):** [apps/frontend-v3/.agents/wiki/](apps/frontend-v3/.agents/wiki/).

Stack: bun · Vite 8 · React 19 · TanStack Router + Query v5 · Tailwind v4 · Biome · ky · Recharts.
UI source of truth: `apps/mockup/`. Không dùng shadcn/MUI — custom components theo design tokens.

Xem chi tiết rules (state, code, data, layout, hard limits) trong `apps/frontend-v3/AGENTS.md`.

### AI Grading Agent

Writing/Speaking grading runs inside Laravel Queue Jobs using `laravel/ai` SDK:

1. `GradeSubmission` job dispatched when student submits writing/speaking
2. Job loads rubric (DB) + knowledge scope (graph) + question content
3. Agent (WritingGrader/SpeakingGrader) calls LLM via tool calling (`SubmitWritingGrade`/`SubmitSpeakingGrade`)
4. Speaking: Azure Speech API for pronunciation assessment before agent grading
5. Code calculates overall score (VstepScoring), enriches result with criteria names + knowledge graph paths
6. Submission updated with scores, feedback, knowledge gaps

Key files (backend-v2):
- `app/Ai/Agents/` -- WritingGrader, SpeakingGrader
- `app/Ai/Tools/` -- SubmitWritingGrade, SubmitSpeakingGrade
- `app/Jobs/GradeSubmission.php` -- Queue job orchestrator
- `app/Services/AzureSpeechService.php` -- Azure pronunciation assessment
- `resources/views/grading/` -- System prompt blade templates
- `database/seeders/GradingRubricSeeder.php` -- VSTEP rubric data (27 criteria)
- `database/seeders/KnowledgeGraphSeeder.php` -- Knowledge graph (57 nodes, 63 edges)

### Cross-App Communication

- Frontend-v3 -> Backend: REST at `VITE_API_URL` (default `http://localhost:8000`), HTTP client = `ky`.
- AI Grading: Laravel Queue Jobs (Redis), no separate service.
- Speaking audio: presigned URL upload to R2 -> Azure Speech API -> Agent grading.
- Auth: JWT Bearer tokens (issued by backend, validated on each request). Frontend-v3 dùng Zustand discriminated union (`lib/auth.ts`).

### Database

PostgreSQL with Eloquent ORM. Key tables:
- `grading_rubrics` + `grading_criteria` -- VSTEP rubric per skill/level
- `knowledge_points` + `knowledge_point_edges` -- Knowledge graph
- `submissions` -- Grading results with enriched criteria + knowledge gaps
- See `apps/backend-v2/AGENTS.md` for full model/service conventions.

---

## Code Style

### Backend (`apps/backend-v2/`)

See `apps/backend-v2/AGENTS.md` for Laravel-specific patterns:
- `declare(strict_types=1)` in all PHP files
- Models extend BaseModel (UUIDs, ISO dates)
- Enums for all fixed values
- Thin controllers, services for business logic
- `./vendor/bin/pint` must pass before commit

### Frontend-v3 (`apps/frontend-v3/`)

Quy tắc đầy đủ nằm trong [apps/frontend-v3/AGENTS.md](apps/frontend-v3/AGENTS.md) — **đây là nguồn chuẩn, luôn đọc file này trước khi code**. Các điểm cốt lõi:

**Architecture flow:** Route → Component → Hook → Lib. Không vòng ngược.

**State management:**
- Server state: TanStack Query (`useQuery` + `select`). Không prop drill.
- Client state: Zustand (auth, UI). `useSession()` cho `_app` context (typed non-null), `useAuth` cho guards + actions.
- Form state: `@tanstack/react-form` (`useForm`). Không `useState` per field.
- URL state: TanStack Router search params. Không `useState` cho modal/tab/step.

**Code rules (bất di bất dịch):**
- No inline helpers — format/round/date dùng `lib/utils.ts`.
- No hardcode values — colors qua design tokens / CSS variables, không hex trong components.
- No mock data trong components — data từ API (TanStack Query). API chưa có → tạo endpoint trước.
- Shared trước, inline sau — grep `lib/` và `types/` trước khi viết mới.
- No `as` casts trong business logic. No `!` non-null assertions. No `?? fallback` để giấu loading/null.
- API response nhất quán: backend trả `{ data: T }`, frontend dùng `ApiResponse<T>`.
- Error handling: global `on-error.ts` trên QueryClient. Components không try/catch cho toast.
- Layout routes (`_app`, `_focused`) wrap Outlet trong ErrorBoundary.
- Loading states: shared `Loading` component.

**Layout:**
- Sidebar 260px fixed, content adaptive width.
- Focus mode (`_focused` layout): ẩn sidebar + header, dùng `FocusBar`, `FocusComplete`, `FocusEmpty`.
- Card: `border-2 border-b-4 rounded-(--radius-card)`.
- Button: `box-shadow bottom, rounded-(--radius-button)`.

**Assets:**
- Icons: `assets/icons/*.svg` (Duo SVG). Không dùng `lucide-react` / `@hugeicons/react`.
- Fonts: `public/fonts/` (Duolingo Sans + Feather).

**Hard limits:**
- Function ≤ 50 dòng. Props ≤ 3.
- Route page ≤ 80 dòng — chỉ compose.
- Component file: 1 concern. Nhiều concern → tách file.
- Component dùng ≥ 2 nơi → shared (`lib/` hoặc `components/`).
- Hook file: 1 state machine (useReducer + useMutation cho 1 flow).
- No `any`. No `console.log`. No commented-out code. No barrel files.

**Data rules (domain invariants):**
- 1 User → nhiều Profile. 1 Profile = 1 Target (level + deadline). Không đổi target, tạo profile mới.
- Profile = đơn vị tính tiền (mỗi profile = 1 "khóa học").
- Không test đầu vào — user tự chọn target.
- Chart/spider = **chỉ exam** (graded). Drill score không vào chart.
- Study time + streak = **chỉ drill**. Exam không cộng.
- FSRS adaptive **chỉ vocab**. Exam = đề cố định.
- Spider chart ẩn nếu < 5 bài thi.
- Grading result order: Strengths → Improvements → Rewrites.

**Workflow:**
- Trước khi code: grep `.agents/wiki/` tìm kiến thức liên quan, follow `[[links]]`.
- Change > 3 files: plan trước, confirm, rồi code.
- Audit trước khi tạo mới — grep existing patterns.
- `bun run lint` sau mỗi edit. Không commit trừ khi user yêu cầu.

**Wiki (ghi `.agents/wiki/` + append `LOG.md`) khi:**
- Fix bug phải sửa > 1 lần (root cause không obvious)
- Phát hiện anti-pattern lặp lại
- Thay đổi architecture decision (auth, API, state)
- Research library/convention khác expectation
- Refactor mà lý do không rõ từ code alone

Không ghi khi: typo fix, style tweak, feature đơn giản theo pattern có sẵn.
