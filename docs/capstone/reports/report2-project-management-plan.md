# I. Record of Changes

| Date | A/M/D | In charge | Change Description |
|------|-------|-----------|-------------------|
| 10/03/2026 | A | Hoàng Văn Anh Nghĩa | Initial version — WBS, project objectives, risk register, management approach |
| 29/05/2026 | M | Hoàng Văn Anh Nghĩa | Updated WBS to match actual 13-feature scope from Report 1; balanced responsibility assignments across team; added risk for cross-stack coding pattern consistency |
| 29/05/2026 | M | Hoàng Văn Anh Nghĩa | Updated tools & infrastructure to reflect actual stack: Laravel 13, React 19/TanStack, Expo, PostgreSQL, Redis, Docker |

*A - Added   M - Modified   D - Deleted

# II. Project Management Plan

## 1. Overview

### 1.1 Scope & Estimation

| # | WBS Item | Complexity | Est. Effort (man-days) |
|---|----------|------------|------------------------|
| **1** | **FE-01: User Authentication** | | **24** |
| 1.1 | Backend: JWT Auth + Google OAuth + Multi-role + Multi-profile | Medium | 9 |
| 1.2 | Frontend-v3: Login, Register, Onboarding UI | Medium | 8 |
| 1.3 | Mobile-v2: Auth screens | Medium | 7 |
| **2** | **FE-02: Practice — Listening** | | **22** |
| 2.1 | Backend: MCQ practice API, audio presigned URLs (R2) | Medium | 7 |
| 2.2 | Frontend-v3: Listening exercise UI + audio player | Medium | 8 |
| 2.3 | Mobile-v2: Listening screens | Medium | 7 |
| **3** | **FE-03: Practice — Reading** | | **22** |
| 3.1 | Backend: MCQ practice API | Medium | 7 |
| 3.2 | Frontend-v3: Reading UI + passage highlighting + translation | Medium | 8 |
| 3.3 | Mobile-v2: Reading screens | Medium | 7 |
| **4** | **FE-04: Practice — Writing** | | **38** |
| 4.1 | Backend: Writing practice API + SSE streaming for real-time feedback | Complex | 14 |
| 4.2 | Frontend-v3: Writing editor + AI grading result display | Complex | 12 |
| 4.3 | Mobile-v2: Writing screens + grading result | Complex | 12 |
| **5** | **FE-05: Practice — Speaking** | | **46** |
| 5.1 | Backend: Speaking API + Azure Speech-to-Text + Conversation + Shadowing | Complex | 18 |
| 5.2 | Frontend-v3: Drill, VSTEP Task, AI Conversation, Shadowing UIs | Complex | 14 |
| 5.3 | Mobile-v2: Speaking screens | Complex | 14 |
| **6** | **FE-06: Mock Test Mode** | | **48** |
| 6.1 | Backend: Exam session engine + auto-save + composite scoring | Complex | 18 |
| 6.2 | Frontend-v3: Exam Room (4-skill panels, countdown timer, device check) | Complex | 16 |
| 6.3 | Mobile-v2: Exam screens | Complex | 14 |
| **7** | **FE-07: AI Grading Engine** | | **52** |
| 7.1 | VSTEP rubric seeding + deterministic scoring formulas (Writing + Speaking) | Complex | 12 |
| 7.2 | LLM Agent framework (4 AI providers, 6 models, tool calling via laravel/ai SDK) | Complex | 14 |
| 7.3 | External tool integration: LanguageTool (grammar) + SyntaxAnalyzer + CEFR vocabulary | Complex | 10 |
| 7.4 | Queue Jobs + SSE streaming for real-time grading feedback | Complex | 10 |
| 7.5 | Writing/Speaking feedback generation (7 Bladed prompt templates) | Medium | 6 |
| **8** | **FE-08: Progress Tracking** | | **30** |
| 8.1 | Backend: Statistics, streak, milestones, activity heatmap, level projection | Complex | 12 |
| 8.2 | Frontend-v3: Dashboard (spider chart, score trend, heatmap, streak dialog) | Complex | 10 |
| 8.3 | Mobile-v2: Dashboard + progress screens | Medium | 8 |
| **9** | **FE-09: Learning Path** | | **20** |
| 9.1 | Backend: Skill gap analysis + threshold-based recommendations (band < 5.0) | Medium | 8 |
| 9.2 | Frontend-v3: Learning path UI | Medium | 6 |
| 9.3 | Mobile-v2: Learning path integration | Medium | 6 |
| **10** | **FE-10: Course Management** | | **42** |
| 10.1 | Backend: Course CRUD + schedule + enrollment + 1-on-1 session booking | Complex | 16 |
| 10.2 | Frontend-v3: Course listing, enrollment dialog, booking UI | Complex | 14 |
| 10.3 | Mobile-v2: Course + booking screens | Complex | 12 |
| **11** | **FE-11: Content Management** | | **46** |
| 11.1 | Admin Backend: CRUD APIs for exams, vocabulary, grammar, all 4 skills | Complex | 16 |
| 11.2 | Admin Frontend: Dashboard, analytics, content editors (~130+ components) | Complex | 18 |
| 11.3 | Exam import + blueprint validation (ExamVersionValidator) | Complex | 8 |
| 11.4 | Publish/unpublish workflow + content versioning | Medium | 4 |
| **12** | **FE-12: Notification System** | | **20** |
| 12.1 | Backend: In-app notifications + scheduled daily study reminders (vstep:study-reminder) | Medium | 8 |
| 12.2 | Frontend-v3: Notification bell + list integration | Medium | 6 |
| 12.3 | Mobile-v2: Notification screens | Medium | 6 |
| **13** | **FE-13: Exercise Feedback** | | **12** |
| 13.1 | Backend: Rating + comment API | Simple | 4 |
| 13.2 | Frontend-v3: Feedback UI | Simple | 4 |
| 13.3 | Mobile-v2: Feedback UI | Simple | 4 |
| **14** | **Infrastructure & DevOps** | | **28** |
| 14.1 | Docker Compose (8 services: PostgreSQL, Redis, Backend, Frontend, Admin, Horizon, LanguageTool, Traefik) | Medium | 8 |
| 14.2 | CI/CD pipelines (GitHub Actions: deploy, build-images, opencode review) | Medium | 8 |
| 14.3 | Payment gateway integration (PayOS live + VNPay stub) | Complex | 8 |
| 14.4 | Wallet system (top-up, promo codes, transaction history) | Medium | 4 |
| **15** | **Documentation & Testing** | | **42** |
| 15.1 | Unit tests + Feature tests + Test fakes for external services | Complex | 16 |
| 15.2 | URS + SRS documents | Medium | 8 |
| 15.3 | Architecture & Design documents (UML: use case, sequence, class, component) | Medium | 8 |
| 15.4 | Testing report + test cases | Medium | 6 |
| 15.5 | Installation guide + User guide | Simple | 4 |
| | **Total Estimated Effort (man-days)** | | **492** |

> **Estimation basis:** 4 team members × 17 weeks × ~7.5 working days/week ≈ 510 man-days available. Estimated coding effort is 492 man-days; the remaining 18 man-days cover project management overhead, sprint ceremonies, and buffer. Complexity classification follows FPT University guidelines: Simple (well-understood, repetitive), Medium (requires design decisions), Complex (novel domain, multi-system integration).

### 1.2 Project Objectives

**Overall Objective:** Build an adaptive VSTEP preparation platform that combines AI-powered 4-skill assessment (Listening, Reading, Writing, Speaking), personalized learning path recommendations, and visual progress tracking to help Vietnamese learners prepare efficiently for the VSTEP examination.

**Quality Targets:**

| # | Testing Stage | Test Coverage | Est. Defects | % of Defect | Notes |
|---|--------------|---------------|-------------|-------------|-------|
| 1 | Reviewing | 100% code reviewed via Pull Request | ~15 | 10% | Biome (TypeScript) + Laravel Pint (PHP) auto-enforced |
| 2 | Unit Test | ≥ 70% on critical services (AI grading, FSRS, scoring) | ~30 | 21% | PHPUnit, 59 test files; Fakes isolate external APIs |
| 3 | Integration Test | All API endpoints (44 feature tests) | ~45 | 31% | Auth, Wallet, Practice, Exams, Learning Path, Admin |
| 4 | System Test | All 13 features (FE-01 through FE-13) | ~35 | 24% | Full VSTEP exam flow; cross-skill scenarios |
| 5 | Acceptance Test | Verified against SRS and URS by academic supervisor | ~20 | 14% | Lâm Hữu Khánh Phương + Trần Trọng Huỳnh sign-off |

**Milestone Timeliness:** 100% — all features delivered before the 30/04/2026 deadline.

**Allocated Effort Distribution:**

| Activity | Man-days | % |
|----------|----------|---|
| Requirements Analysis (URS, SRS) | 50 | 10% |
| System Design (Architecture, UML, DDD) | 75 | 15% |
| Implementation (Backend + Frontend + Mobile + Admin) | 250 | 50% |
| Testing (Unit + Integration + System + Acceptance) | 75 | 15% |
| Project Management & Communication | 25 | 5% |
| Documentation & Deployment | 25 | 5% |
| **Total** | **500** | **100%** |

### 1.3 Project Risks

| # | Risk Description | Impact | Possibility | Response Plans |
|---|-----------------|--------|-------------|----------------|
| 1 | External LLM API instability or rate limiting (Packy, Groq, OpenRouter) disrupts AI grading pipeline | High | Medium | Multi-provider fallback with automatic routing; rule-based scoring fallback (LanguageTool + SyntaxAnalyzer); exponential backoff retry; cache grading results |
| 2 | Azure Speech API rate limits or service downtime blocks Speaking practice feature | High | Medium | Queue-based processing with retry; user-facing "Đang xử lý..." status; WebM→WAV conversion in-browser before upload to ensure format compatibility |
| 3 | Limited team experience with AI/LLM integration and prompt engineering slows AI Grading Engine progress | Medium | High | Dedicated research spike in Weeks 3-4; use laravel/ai SDK abstraction layer; pair programming with team lead on AI components; study official LLM provider documentation |
| 4 | Scope creep — unplanned features or Phase 2 scope leaking into MVP timeline | High | Medium | Strict MVP scope enforcement; features LI-08 (adaptive difficulty), LI-09 (instructor assignment), LI-10 (ML predictive analytics) explicitly excluded per Report 1; weekly backlog grooming and scope review with supervisor |
| 5 | Payment gateway integration complexity (PayOS, VNPay) delays Wallet and Course enrollment features | Medium | Medium | Implement PayOS live integration first; VNPay as stub only (LI-04 in Report 1); abstract both behind PaymentGatewayRegistry for future substitution |
| 6 | Team members work across different technology stacks (PHP/Laravel, React/TanStack, Expo/React Native) leading to inconsistent coding patterns across modules | Medium | Medium | Team lead reviews all Pull Requests for pattern consistency; shared coding conventions documented in AGENTS.md; periodic refactoring sprints to align cross-module patterns; Design System documented in `apps/mockup/` |
| 7 | FPT University class schedule conflicts cause uneven workload distribution across team members | Medium | Medium | Daily async standups (Discord text); flexible pair programming when schedules align; buffer capacity in sprint planning; transparent task board (GitHub Projects) for visibility |
| 8 | Database schema changes mid-development cause migration conflicts across team members | Low | Medium | All schema changes through Laravel migrations only; seeders provide reproducible test data; CI pipeline runs migrations on each push; database schema reviewed before implementation |

## 2. Management Approach

### 2.1 Project Process

The team applies a **Scrum-based Agile process** with 2-week sprints across a 17-week development period (01/01/2026 – 30/04/2026).

**Sprint Cadence:**

```
Sprint Planning → Development → Code Review → Testing → Sprint Review → Retrospective
   (Mon Wk 1)     (Days 2–9)    (Continuous)   (Days 8–10)  (Fri Wk 2)    (Fri Wk 2)
```

**Ceremonies:**

- **Daily Standup:** 15 minutes, async via Discord text. Each member reports: what was done yesterday, what is planned today, any blockers.
- **Sprint Planning:** Monday of Week 1, 1 hour. Team selects backlog items, decomposes into tasks, and commits to sprint scope.
- **Sprint Review + Retrospective:** Friday of Week 2, 1 hour. Demo completed work to supervisor; discuss what went well, what to improve.

**Sprint Schedule:**

| Sprint | Weeks | Focus Area | Key Deliverables |
|--------|-------|-----------|-----------------|
| Sprint 1 | 1–2 (Jan) | Training + Foundation | Docker infrastructure, DB schema, tech stack training, URS draft |
| Sprint 2 | 3–4 (Jan) | FE-01 Auth + FE-11 Base | JWT auth, Google OAuth, multi-profile, content management skeleton, SRS draft |
| Sprint 3 | 5–6 (Feb) | FE-02/03 Listening/Reading + FE-07 Start | MCQ practice APIs, audio pipeline, VSTEP rubric seeding |
| Sprint 4 | 7–8 (Feb) | FE-04 Writing + FE-07 Continue | Writing practice API, AI grading agents, SSE streaming, Architecture & DDD docs |
| Sprint 5 | 9–10 (Mar) | FE-05 Speaking + FE-06 Mock Test | Azure STT integration, exam session engine, conversation AI |
| Sprint 6 | 11–12 (Mar) | FE-08/09 Progress/Learning Path + FE-12 | Dashboard, spider chart, learning recommendations, notifications |
| Sprint 7 | 13–14 (Apr) | FE-10 Courses + Wallet + FE-13 | Course enrollment, booking, payment, exercise feedback |
| Sprint 8 | 15–16 (Apr) | FE-11 Content Mgmt + Admin Panel | Full admin CRUD, analytics, content workflow, testing & bug fixing |
| Buffer | 17 (Apr) | Acceptance + Documentation | Final testing, supervisor review, user guide, deployment finalization |

### 2.2 Quality Management

**Defect Prevention:**

- **Coding standards enforced automatically:** Laravel Pint (PHP) ensures zero style violations in backend; Biome (TypeScript) enforces consistent formatting and catches unused variables, missing dependencies, and type issues in frontend.
- **Type safety:** All PHP files use `declare(strict_types=1)`. All fixed values are represented as Enums (18 enum classes: Role, VstepLevel, ExamSessionStatus, GradingJobStatus, etc.). Frontend TypeScript uses strict mode with zero `any` types in the main web app.
- **Input validation:** All API endpoints validate input at the boundary using Laravel Form Requests; Zod schemas ensure data integrity at the application layer.
- **Architecture patterns:** Thin controllers (average < 150 lines), business logic in Service layer (54 service classes), Strategy pattern for grading (WritingGradingStrategy, SpeakingGradingStrategy), Contract/Interface pattern for AI components (7 AI contracts).

**Code Review:**

- Every code change must be submitted via Pull Request on GitHub.
- At least one reviewer approves before merge to `main` branch.
- Reviewer checklist: coding standards compliance, correct error handling, business logic accuracy, security considerations, test coverage.
- Team lead reviews all Pull Requests to ensure pattern consistency across backend, frontend, and mobile modules.
- AI-assisted review via GitHub Actions (opencode workflow) for critical paths.

**Testing Strategy:**

| # | Testing Stage | Scope | Tools | Responsibility |
|---|--------------|-------|-------|---------------|
| 1 | Code Review | All Pull Requests | GitHub PR + Biome/Pint | All team members |
| 2 | Unit Test | Scoring formulas, FSRS scheduler, enums, AI wire formats, auth logic | PHPUnit (59 test files, 4,472 assertions) | Backend developers |
| 3 | Integration Test | All API endpoints (44 feature tests): Auth, Wallet, Practice, Exams, Progress, Admin | PHPUnit + Fakes (6 fake services) | Backend + QA |
| 4 | System Test | Full VSTEP exam flow: Listening→Reading→Writing→Speaking; payment→enrollment→booking | Manual + automated scripts | All team members |
| 5 | Acceptance Test | Verify against SRS functional requirements and URS user stories | Manual verification | Academic supervisor |

**Fakes for Test Isolation:** The following external services are replaced with in-memory fakes during testing to ensure reproducibility and speed:

- `FakeAiClient` — replaces Packy/Groq/OpenRouter LLM calls
- `FakeSpeechToText` — replaces Azure Speech API
- `FakeWritingFeedback/TaskFulfillment/ContentRelevance/PronunciationAnalyzer` — replaces AI assessment components
- `FakeConversationTurnHandler` — replaces AI conversation turn generation

### 2.3 Training Plan

| Training Area | Participants | When, Duration | Waiver Criteria |
|--------------|-------------|----------------|-----------------|
| PHP 8.4 + Laravel 13 + Eloquent ORM | All 4 members | Week 1, 3 days | Mandatory — backend foundation for all members |
| React 19 + TanStack Router + TanStack Query v5 + Tailwind v4 | All 4 members | Week 1–2, 4 days | Mandatory — frontend framework for web + admin |
| AI/LLM Integration (laravel/ai SDK, tool calling, prompt engineering) | Nghĩa, Nhật Phát | Week 3–4, 3 days | Mandatory — core technology for AI grading engine |
| Docker + GitHub Actions CI/CD | Nghĩa, Khôi | Week 3–4, 2 days | Mandatory — infrastructure and deployment pipeline |
| Azure Speech API — STT + Pronunciation Assessment | Nghĩa, Nhật Phát | Week 5, 2 days | Mandatory — core dependency for Speaking module |
| Expo + React Native (Mobile-v2) | Khôi, Tấn Phát | Week 2, 3 days | Mandatory — mobile application development |
| Git Workflow + Code Review Practice | All 4 members | Week 1, 1 day | Mandatory — team collaboration foundation |

## 3. Project Deliverables

| # | Deliverable | Due Date | Owner | Notes |
|---|------------|----------|-------|-------|
| 1 | User Requirement Specification (URS) | 15/01/2026 | Khôi | Functional + non-functional requirements; use case diagrams |
| 2 | Software Requirement Specification (SRS) | 31/01/2026 | Khôi | Detailed system specification; API contracts; data schemas |
| 3 | System Architecture & Design Document | 15/02/2026 | Nghĩa | UML diagrams: use case, sequence, class, component, deployment |
| 4 | Detailed Design Document (DDD) | 28/02/2026 | Nghĩa | Database schema (105 migrations, 82 models), component design, API route design |
| 5 | Backend API v1 (MVP Core) | 15/03/2026 | Nghĩa | Auth, Practice APIs (4 skills), Exam engine, AI grading pipeline |
| 6 | Frontend-v3 Web Application (MVP) | 31/03/2026 | Tấn Phát, Nhật Phát | All learner-facing features: auth, practice, mock test, dashboard |
| 7 | Mobile-v2 Application (MVP) | 31/03/2026 | Khôi | All learner-facing features: practice, mock test, vocab, courses |
| 8 | Admin Panel (MVP) | 07/04/2026 | Nghĩa | Content management, user management, analytics, course management |
| 9 | AI Grading Engine | 07/04/2026 | Nghĩa | Writing (4 criteria) + Speaking (5 criteria) grading against VSTEP rubric |
| 10 | Testing Report + Test Cases | 15/04/2026 | Nhật Phát | Unit + integration + system test results; defect tracking |
| 11 | Installation Guide + Deployment Package | 22/04/2026 | Khôi | Docker Compose deployment; CI/CD configuration; environment setup |
| 12 | User Guide / Tutorial | 25/04/2026 | Tấn Phát | Learner manual; instructor manual; admin guide |
| 13 | Final Implementation Report + Source Code | 30/04/2026 | All members | Complete submission package; demo presentation |

## 4. Responsibility Assignments

**D — Do · R — Review · S — Support · I — Informed · blank — Omitted**

| Responsibility | Nghĩa (Leader) | Khôi (Mobile) | Nhật Phát (Practice) | Tấn Phát (Exam/Course) |
|---------------|:---:|:---:|:---:|:---:|
| **Project Planning & Tracking** | D | S | S | S |
| Prepare URS Document | R | D | S | S |
| Prepare SRS Document | R | D | S | S |
| Prepare Architecture & Design Document | D | S | R | S |
| Prepare Detailed Design Document | D | I | I | S |
| **Phase 1: Foundation (Sprint 1–2)** | | | | |
| Docker + CI/CD + Deployment | D | R | I | S |
| Database Schema & Migrations | D | I | S | S |
| Design System & Shared Components | D | S | R | R |
| **Phase 2: Backend (Sprint 2–7)** | | | | |
| Auth + User Management (FE-01) | R | S | D | S |
| Practice APIs — Listening/Reading (FE-02,03) | R | I | D | S |
| Practice APIs — Writing/Speaking (FE-04,05) | D | I | R | S |
| Mock Test Engine + Scoring (FE-06) | D | I | S | R |
| AI Grading Engine (FE-07) | D | I | S | I |
| Progress + Learning Path (FE-08,09) | D | S | R | S |
| Course + Booking + Wallet (FE-10) | R | S | S | D |
| Notifications + Feedback (FE-12,13) | S | S | R | D |
| Content Management APIs (FE-11) | D | I | S | S |
| **Phase 3: Frontend (Sprint 3–7)** | | | | |
| Landing Page + Auth UI | R | S | D | S |
| Dashboard + Profile + Progress (FE-08) | D | S | S | R |
| Practice UIs — 4 Skills (FE-02,03,04,05) | R | S | D | S |
| Mock Test UI — Exam Room (FE-06) | R | I | S | D |
| Course + Wallet UI (FE-10) | R | I | S | D |
| Admin Panel (FE-11) | D | I | S | S |
| **Phase 4: Mobile (Sprint 3–8)** | | | | |
| Mobile Architecture + Setup | S | D | I | S |
| Mobile: Auth + Dashboard (FE-01,08) | I | D | S | S |
| Mobile: Practice (4 skills) (FE-02,03,04,05) | S | D | R | S |
| Mobile: Mock Test (FE-06) | S | D | S | R |
| Mobile: Course + Booking (FE-10) | S | D | S | R |
| Mobile: Notifications + Wallet (FE-12) | S | D | S | S |
| **Phase 5: Testing & Documentation (Sprint 7–8)** | | | | |
| Unit + Integration Testing | D | S | R | S |
| System Testing | R | S | D | R |
| Testing Report | S | S | D | R |
| Installation Guide + Deployment | R | D | I | S |
| User Guide | S | R | S | D |
| Final Report & Demo | D | S | S | S |
| Supervisor Communication | D | I | I | I |

## 5. Project Communications

| Communication Item | Who / Target | Purpose | When, Frequency | Type, Tool, Method |
|-------------------|-------------|---------|----------------|-------------------|
| Daily Standup | All team members | Sync progress, identify blockers, coordinate tasks | Daily, 15 minutes | Async, Discord text channel |
| Sprint Planning | All team members | Select sprint backlog, decompose tasks, commit to scope | Bi-weekly (Monday Week 1), 1 hour | Online, Google Meet |
| Sprint Review + Retrospective | All team members + academic supervisor (review only) | Demo completed work; reflect on process and identify improvements | Bi-weekly (Friday Week 2), 1 hour | Online, Google Meet |
| Supervisor Meeting (Academic) | Nghĩa + Lâm Hữu Khánh Phương | Progress reporting, academic guidance, milestone approval | Weekly, 30 minutes | In-person / Google Meet |
| Supervisor Meeting (Industry) | Nghĩa + Trần Trọng Huỳnh | Technical review, industry best practice feedback | Bi-weekly, 30 minutes | Online, Email / Phone |
| Code Review | Developer + Reviewer(s) | Ensure code quality, consistency, and correctness | Per Pull Request, asynchronous | GitHub Pull Request review |
| Technical Discussion | Developers involved in specific module | Architecture decisions, debugging, design discussions | As needed | Discord voice / thread |
| Task Tracking | All team members | Backlog management, issue tracking, progress visibility | Continuous | GitHub Issues + GitHub Projects |
| File Sharing | All team members | Document collaboration, diagram sharing | Continuous | Google Drive (Docs, Sheets, Slides) |

## 6. Configuration Management

### 6.1 Document Management

All project documents are stored in the monorepo under `docs/capstone/`, organized by type:

- `reports/` — Capstone reports (Markdown source, exported to DOCX/PDF for submission)
- `specs/` — Technical specifications and RFCs
- `diagrams/` — UML diagrams (Draw.io source files + rendered PNG/SVG)

Documents use semantic versioning via Git commit history. Naming convention: `[Report#]-[Name]-v[X].[Y].pdf`. Final submission versions are exported as PDF from Markdown source. Google Drive is used for collaborative editing of reports before finalizing in the repository.

### 6.2 Source Code Management

- **Repository:** Monorepo at `github.com/nghyane/VSTEP`, containing all applications: `apps/backend-v2/`, `apps/frontend-v3/`, `apps/admin/`, `apps/mobile-v2/`, `apps/mockup/`.
- **Branch strategy:** `main` (production-ready), feature/fix/docs branches created from `main`. Branch naming: `feat/<feature-name>`, `fix/<bug-description>`, `docs/<topic>`, `refactor/<scope>`.
- **Merge policy:** All changes require a Pull Request with at least one approving review before merge to `main`.
- **Commit convention:** [Conventional Commits](https://www.conventionalcommits.org/) with scope — `feat(auth):`, `fix(grading):`, `refactor(backend):`, `docs(srs):`, `test(exam):`, `chore(ci):`.
- **Code style enforcement:** Laravel Pint (PHP) and Biome (TypeScript) run automatically; all code must pass lint before merge.
- **Policies:** No rebase of shared branches. No force push to `main`. Secrets managed via `.env` files (git-ignored), validated at application startup.

### 6.3 Tools & Infrastructures

| Category | Tools / Infrastructure |
|----------|----------------------|
| Technology — Backend | PHP 8.4, Laravel 13, Laravel Octane (FrankenPHP), Laravel AI SDK |
| Technology — Frontend Web | React 19, Vite 8, TanStack Router + Query v5, Tailwind v4, Biome, ky, Recharts |
| Technology — Frontend Admin | React 19, Vite, TanStack Router, Tailwind, Biome |
| Technology — Mobile | Expo SDK, React Native, TypeScript |
| Database | PostgreSQL 17 (primary), Redis 7 (cache + queue) |
| Queue & Jobs | Laravel Horizon (Redis-backed queue manager for AI grading jobs) |
| IDEs / Editors | Visual Studio Code, Cursor |
| Diagramming | Draw.io (primary), StarUML (UML 2.0), Mermaid (Markdown-embedded) |
| Documentation | Microsoft Office (DOCX export), Google Docs/Sheets/Slides (collaboration), Markdown (source) |
| Version Control | GitHub — monorepo (Source Code), Google Drive (Document drafts) |
| CI/CD | GitHub Actions (3 workflows: deploy backend, build + push Docker images, AI code review) |
| Deployment | Docker Compose (8 services), Traefik v2.11 (reverse proxy + Let's Encrypt TLS), VPS (Ubuntu) |
| AI / LLM Providers | Packy API (DeepSeek V4, Claude Haiku, Qwen), Groq (Qwen 32B), OpenRouter, Ollama (local dev) |
| External APIs | Azure Speech Services (STT + Pronunciation Assessment), LanguageTool (self-hosted Docker), PayOS (payment), Google OAuth (login) |
| File Storage | Cloudflare R2 (audio files, presigned URL upload/download) |
| Testing | PHPUnit (Backend), Biome lint (Frontend), Fakes for external service isolation |
| Project Management | GitHub Issues (task tracking), GitHub Projects (Kanban board) |
| Communication | Discord (daily chat, async standup), Google Meet (sprint ceremonies), FPT Email (supervisor) |
| API Documentation | REST API (JSON:API-inspired), route definitions in `routes/api.php` |
