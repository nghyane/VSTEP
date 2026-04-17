# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSTEP exam practice platform with AI grading and adaptive learning. Capstone project (SP26SE145). Monorepo:

| App | Stack | Port | Entry |
|-----|-------|------|-------|
| **backend-v2** | PHP 8.4 · Laravel 13 · PostgreSQL · Redis | 8000 | `apps/backend-v2/` |
| **frontend-v2** | TanStack Start · React 19 · TypeScript · Tailwind v4 · shadcn/ui | 5173 | `apps/frontend-v2/` |
| **frontend** | [LEGACY] React 19 + Vite 7 | -- | `apps/frontend/` (reference only) |

> **Active development:** `frontend-v2`. Legacy `frontend/` khong con phat trien, chi dung de reference spec.

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

### Frontend-v2 (`apps/frontend-v2/`)

```bash
bun install
bun dev                       # Vite dev server
bun test                      # Run tests
bunx biome check --fix .      # Lint + format
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
  3. Hết lỗi → `bunx biome check --fix ./src/<path/to/file.tsx>` (frontend-v2)
  4. Verify cuối → mới sang task tiếp theo
- **Fail 3 lần cùng lỗi → đổi approach.** Không loop edit-đoán. Dùng `mcp__ide__getDiagnostics` để xác nhận lỗi thật, không phải đoán.
- **Đọc code trước khi sửa.** Sửa nhỏ nhất có thể. Không refactor ngoài scope.

---

## Architecture

### Backend

See `apps/backend-v2/AGENTS.md` for full Laravel conventions.

### Frontend-v2

Design spec: `apps/frontend-v2/docs/skill-design.md` -- **derive truc tiep tu source code frontend cu.**
Moi spec deu co truy xuat ve file goc. Dung spec nay de implement frontend-v2.

**Stack:** TanStack Start + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Recharts

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

- Frontend-v2 -> Backend: REST at `VITE_API_URL` (default `http://localhost:8000`)
- AI Grading: Laravel Queue Jobs (Redis), no separate service
- Speaking audio: presigned URL upload to R2 -> Azure Speech API -> Agent grading
- Auth: JWT Bearer tokens (issued by backend, validated on each request).

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

### Frontend-v2 (`apps/frontend-v2/`)

See `apps/frontend-v2/docs/skill-design.md` for full design spec. Key rules:

**Rule 0.1 -- Khong boc background cho icon.**
Icon (lucide, SVG) phai render tran, khong dat trong khung vuong/tron co `bg-*` rieng.
Chi dung `text-*` cho mau icon.

```tsx
// Dung
<Icon className="size-6 text-primary" />

// Sai
<div className="flex size-10 rounded-xl bg-primary/10 text-primary">
  <Icon className="size-5" />
</div>
```

**Ngoai le duoc phep:** Avatar, button icon-only, chip/badge semantic that su.

**Rule 0.2 -- Hub card top-level dung `border bg-card`.**
Card dieu huong lon o hub page dung `rounded-2xl border bg-card p-6 shadow-sm`.
KHONG dung `bg-muted/50` (gay cam giac duc).

**Rule 0.3 -- Hover khong doi mau border.**
Hover cua card chi nang nhẹ (`hover:-translate-y-0.5`) va tang shadow (`hover:shadow-md`).
KHONG dung `hover:border-primary/30`. Giu border trung tinh.

**Rule 0.4 -- Container width cho page noi dung.**
KHONG dung full width sat mep. Luon dung:

```tsx
// Dung
<div className="mx-auto w-full max-w-5xl space-y-6">

// Sai
<div className="w-full space-y-6">
```

Default: `max-w-5xl`. Form/page hep: `max-w-4xl` hoac `max-w-3xl`.
Chi dung full width khi that su can split layout rong.

**Rule 0.5 -- Can chinh inline: icon / text / icon phai cung tam ngang.**
Khi co nhieu phan tu khac loai (coin icon PNG, text, lucide icon) dat ben nhau
tren cung 1 dong, KHONG dua vao `items-center` mac dinh — font metrics + PNG
padding + SVG viewBox se lech tam.

Pattern bat buoc:
1. Bao moi phan tu trong wrapper **cung height** voi `flex items-center justify-center`.
2. Text dung `leading-none` + boc them 1 span `translate-y-[1px]` neu glyph
   ngoi lech len top (xay ra voi font `din-round`).
3. PNG coin (lech do padding asymmetric) dung `-translate-y-px` de keo len.

```tsx
// Dung
<div className="flex h-5 items-center gap-1">
  <span className="flex size-5 items-center justify-center">
    <CoinIcon size={20} className="-translate-y-px" />
  </span>
  <span className="flex h-5 items-center text-sm leading-none tabular-nums">
    <span className="translate-y-[1px]">{value}</span>
  </span>
  <span className="flex size-5 items-center justify-center">
    <Plus className="size-3" />
  </span>
</div>

// Sai (dua vao items-center, khong bu glyph offset)
<div className="flex items-center gap-1">
  <CoinIcon size={20} />
  <span className="text-sm">{value}</span>
  <Plus className="size-3" />
</div>
```

Kiem chung bang DevTools: chon span chua glyph, xem box hinh chu nhat. Neu glyph
khong nam chinh giua hop thi phai bu `translate-y`.

**Card style patterns:**

| Pattern | Class | Dung khi |
|---------|-------|---------|
| Card noi dung chinh | `rounded-2xl bg-muted/50 p-5 shadow-sm` | StatCard, SpiderCard, GoalCard |
| Card item trong list | `rounded-xl border bg-background p-4` | Weekly score cards, exam items |
| Card hub top-level | `rounded-2xl border bg-card p-6 shadow-sm` | ModeCard, SkillCard |
| Heatmap wrapper | `border-0 bg-muted/30` | ActivityHeatmap |

**Icon library:** Dung `lucide-react` (khong dung `@hugeicons/react` nhu frontend cu).

**Spacing pattern:**
- Page section: `space-y-6`
- Card content: `p-5`, Stat card: `p-4`, Mini box: `p-3`
- Gap stat cards: `gap-4`, Gap charts: `gap-6`
