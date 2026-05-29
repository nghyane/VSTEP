# I. Record of Changes

| Date | A/M/D | In charge | Change Description |
|------|-------|-----------|-------------------|
| 29/05/2026 | A | Hoàng Văn Anh Nghĩa | Initial Project Management Plan for VSTEP based on the official Report 2 template and current backend-v2/frontend-v3 implementation |
| 29/05/2026 | M | Hoàng Văn Anh Nghĩa | Updated responsibility assignments using team roles and Git commit contributor evidence |

*A - Added   M - Modified   D - Deleted*

# II. Project Management Plan

## 1. Overview

### 1.1 Scope & Estimation

The project scope is estimated for the VSTEP preparation platform described in Report 1 and verified against the current `apps/backend-v2` and `apps/frontend-v3` codebase. The current implementation baseline includes Laravel API routes for authentication, profiles, wallet, vocabulary, grammar, practice, mock exams, grading, learning path, courses, notifications, feedback, and admin/teacher operations; the learner frontend contains 39 route files covering dashboard, practice, exam room, grading result, profile, course, wallet, vocabulary, grammar, listening, reading, writing, and speaking flows.

| # | WBS Item | Complexity | Est. Effort (man-days) |
|---|----------|------------|------------------------|
| 1 | Initiating |  | 10 |
| 1.1 | Collect product vision, stakeholders, and VSTEP preparation problems | Medium | 3 |
| 1.2 | Analyze existing systems and business opportunity | Medium | 3 |
| 1.3 | Define project scope, constraints, and delivery assumptions | Medium | 4 |
| 2 | Planning |  | 14 |
| 2.1 | Prepare Project Introduction document | Medium | 3 |
| 2.2 | Prepare Project Management Plan | Medium | 3 |
| 2.3 | Prepare high-level schedule, sprint goals, and responsibility matrix | Medium | 4 |
| 2.4 | Define quality targets, communication rules, and configuration management | Medium | 4 |
| 3 | Analysis |  | 28 |
| 3.1 | Analyze learner, teacher, staff, and admin roles | Medium | 4 |
| 3.2 | Analyze authentication, multi-profile, onboarding, and account management | Medium | 4 |
| 3.3 | Analyze VSTEP practice flows for Listening, Reading, Writing, and Speaking | Complex | 7 |
| 3.4 | Analyze mock exam, grading, scoring, and result feedback requirements | Complex | 6 |
| 3.5 | Analyze wallet, course enrollment, booking, notification, and feedback flows | Complex | 5 |
| 3.6 | Analyze progress tracking and learning path recommendation rules | Medium | 2 |
| 4 | Design |  | 32 |
| 4.1 | Design backend API structure using Laravel controller-request-service-resource pattern | Complex | 6 |
| 4.2 | Design PostgreSQL data model and migrations for auth, profiles, practice, exams, grading, commerce, and progress | Complex | 8 |
| 4.3 | Design learner frontend routing and focused practice/exam layouts | Complex | 5 |
| 4.4 | Design admin/staff/teacher management APIs and operational workflows | Complex | 5 |
| 4.5 | Design AI grading pipeline, queue processing, SSE progress stream, and external-service boundaries | Complex | 5 |
| 4.6 | Design deployment topology with Docker, PostgreSQL, Redis, Traefik, Horizon, and LanguageTool | Medium | 3 |
| 5 | Implementation |  | 104 |
| 5.1 | Authentication, Google login, JWT refresh tokens, roles, and profile switching | Complex | 8 |
| 5.2 | Learner profile, onboarding, avatar, password, and profile reset flows | Medium | 6 |
| 5.3 | Vocabulary topics, exercises, FSRS/SRS review, and CEFR vocabulary support | Complex | 9 |
| 5.4 | Grammar curriculum, grammar exercises, mastery tracking, and grammar practice UI | Medium | 7 |
| 5.5 | Listening and Reading MCQ practice sessions with progress tracking | Medium | 8 |
| 5.6 | Writing prompts, submissions, AI grading, rubric-based scoring, and feedback generation | Complex | 12 |
| 5.7 | Speaking drills, VSTEP speaking tasks, audio upload/download, STT, pronunciation review, and conversation roleplay | Complex | 14 |
| 5.8 | Mock exam sessions, draft autosave, submission, MCQ scoring, writing/speaking result retrieval, and exam result UI | Complex | 12 |
| 5.9 | Learning path, dashboard overview, streak, activity heatmap, and recommendation display | Complex | 8 |
| 5.10 | Wallet, top-up packages, promo code redemption, payment callback handling, and course enrollment order flow | Complex | 7 |
| 5.11 | Course catalog, learner booking, teacher dashboard, teacher schedule, bookings, and leave request flows | Complex | 6 |
| 5.12 | Notification, exercise feedback, and support interaction flows | Medium | 4 |
| 5.13 | Admin/staff content management APIs for exams, vocab, grammar, practice content, courses, users, rubrics, and system config | Complex | 3 |
| 6 | Testing & Quality Control |  | 34 |
| 6.1 | Unit tests for scoring formulas, syntax analysis, AI wire formats, FSRS, and enums | Medium | 7 |
| 6.2 | Feature tests for auth, wallet, practice, exam, grading, learning path, progress, admin content, and notification flows | Complex | 12 |
| 6.3 | Frontend lint/build validation for learner UI flows | Medium | 5 |
| 6.4 | API contract verification between backend responses and frontend query types | Medium | 4 |
| 6.5 | Manual end-to-end checks for practice, exam, grading, payment, and course booking flows | Complex | 6 |
| 7 | Deployment & Operations |  | 18 |
| 7.1 | Docker Compose setup for backend, frontend, database, cache, queue, proxy, and grammar checker services | Medium | 5 |
| 7.2 | Production environment configuration, secrets, CORS, domain routing, and storage setup | Complex | 5 |
| 7.3 | Queue worker/Horizon setup for grading and async feedback jobs | Medium | 3 |
| 7.4 | Database migration, seed data, backup, and restore planning | Medium | 3 |
| 7.5 | Release checklist and post-deployment smoke testing | Medium | 2 |
| 8 | Project Management & Closing |  | 20 |
| 8.1 | Sprint planning, issue tracking, and progress monitoring | Medium | 6 |
| 8.2 | Mentor review, team review, and document revision | Medium | 5 |
| 8.3 | Final test documentation and user guide preparation | Medium | 5 |
| 8.4 | Final report consolidation and presentation preparation | Medium | 4 |
|  | **Total Estimated Effort** |  | **260** |

### 1.2 Project Objectives

The objective of the project is to deliver an adaptive VSTEP preparation platform that allows learners to practice all four skills, take mock exams, receive AI-assisted writing and speaking feedback, track progress, and receive learning recommendations. The project also provides management functions for content, courses, teachers, wallet operations, notifications, and system configuration.

Quality objectives:

| # | Testing Stage | Target Coverage | Current/Expected Defects | % of Defect | Notes |
|---|---------------|-----------------|--------------------------|-------------|-------|
| 1 | Reviewing | 100% of documents, key flows, and code changes reviewed before final submission | 20 | 20% | Review includes Report 1-7 consistency, API contract checks, and mentor feedback |
| 2 | Unit Test | Core scoring, grammar/syntax, AI wire format, FSRS, and enum behavior covered | 8 | 10% | Current backend contains 57 test files including unit and feature tests |
| 3 | Integration Test | Major API flows covered: auth, practice, exam, grading, wallet, course, notification, learning path | 12 | 15% | Integration tests focus on Laravel feature tests and frontend API contract alignment |
| 4 | System Test | Main user journeys executed end-to-end on deployed or local Docker environment | 10 | 12% | Includes registration/login, profile setup, practice, mock exam, grading result, wallet, booking |
| 5 | Acceptance Test | Supervisor/team acceptance on final release scope | To be recorded | To be recorded | Acceptance result will be finalized near project closing |

Time objective:

- Planned duration: 01/01/2026 - 30/04/2026.
- Development model: iterative Scrum-style delivery with 2-week sprint checkpoints.
- Milestone timeliness target: at least 90% of sprint deliverables completed within planned sprint windows.

Cost and effort objective:

| Activity | Allocated Effort (man-days) | Percentage |
|----------|-----------------------------|------------|
| Requirement and analysis | 38 | 14.6% |
| Design | 32 | 12.3% |
| Implementation | 104 | 40.0% |
| Testing and quality control | 34 | 13.1% |
| Deployment and operations | 18 | 6.9% |
| Documentation and project management | 34 | 13.1% |
| **Total** | **260** | **100%** |

### 1.3 Project Risks

| # | Risk Description | Impact | Possibility | Response Plans |
|---|------------------|--------|-------------|----------------|
| 1 | AI grading quality is inconsistent or differs from expected VSTEP rubric interpretation | High | High | Use deterministic scoring formulas where possible, keep rubric criteria explicit, provide AI output as practice support, and document that official scores require instructor verification |
| 2 | External AI/STT services become unavailable, slow, or costly | High | Medium | Use queue jobs, retry/failure visibility, SSE progress tracking, wallet/credit constraints, and fallback operational procedures for manual review |
| 3 | Writing and Speaking grading pipeline is complex and may introduce hard-to-debug async failures | High | Medium | Separate grading strategies, fake AI services in tests, maintain grading job status, and monitor failed jobs through Laravel queue/Horizon |
| 4 | Requirements change during implementation due to mentor feedback or VSTEP rubric clarification | High | High | Keep sprint scope flexible, document changes in record of changes, prioritize core exam/practice flows before optional enhancements |
| 5 | Frontend and backend API contracts diverge | High | Medium | Keep backend response wrapper `{ data: T }`, centralize frontend API queries, verify changed endpoints with tests/manual checks |
| 6 | Database schema grows large and migration order may cause deployment issues | Medium | Medium | Use Laravel migrations consistently, run migration in staging/local Docker before deployment, avoid manual database changes |
| 7 | Team members lack experience with Laravel 13, React 19, TanStack Router, AI integration, or Docker deployment | Medium | Medium | Execute focused training plan in early sprints and assign research tasks to members with review by the team leader |
| 8 | Testing against the wrong Laravel database can wipe development data | Critical | Medium | Follow backend rule: do not run container tests against dev database; override `DB_DATABASE=vstep_test` or run tests outside container |
| 9 | Payment callback or wallet transaction errors may affect user balance | High | Medium | Keep transaction records, validate provider callbacks, test top-up and promo flows, and use idempotent order status checks |
| 10 | Schedule pressure near final report submission reduces quality | High | High | Freeze feature scope before final testing, reserve final sprint for bug fixing, documentation, and acceptance preparation |

## 2. Management Approach

The team applies an iterative Scrum-style approach. The project is divided into product modules and delivered through sprint increments. Each sprint includes planning, implementation, review, testing, and document updates. This approach is suitable because the project combines several uncertain areas: VSTEP scoring rules, AI-assisted feedback, async grading, learner analytics, and multiple user roles.

### 2.1 Project Process

The project process follows these phases:

| Phase | Main Activities | Outputs |
|-------|-----------------|---------|
| Initiation | Identify project problem, stakeholders, product vision, scope, and constraints | Project Introduction, initial scope, team roles |
| Planning | Estimate effort, define risks, prepare sprint schedule, define tools and communication channels | Project Management Plan, high-level schedule, responsibility matrix |
| Requirement Analysis | Analyze user roles, use cases, business rules, VSTEP format, scoring rules, API needs | SRS, use cases, requirement list |
| Design | Design architecture, database, routes, UI flow, deployment topology, grading pipeline | SDD, ERD, screen flow, API design, architecture diagrams |
| Implementation | Build backend services, APIs, frontend learner flows, grading pipeline, management flows | Working source code, migrations, seeders, UI pages |
| Testing | Execute unit, integration, system, and manual acceptance checks | Test cases, test results, bug fixes, Report 5 |
| Deployment & Closing | Prepare deployment, user guide, final report, presentation, and final acceptance | Deployed system, user guide, final report |

Sprint practice:

- Sprint planning defines backlog items by module and priority.
- Daily or near-daily team communication is used to unblock technical issues.
- Pull requests or code reviews are used before merging important changes.
- At the end of each sprint, the team reviews completed features against current source code and updates documentation.
- Final sprint focuses on stabilization, bug fixing, report consistency, and acceptance preparation.

### 2.2 Quality Management

Quality management is based on prevention, review, automated tests, and manual system validation.

Defect prevention:

- Backend follows controller-request-service-resource separation, strict typing, Laravel validation, Eloquent/Query Builder, and explicit exception handling.
- Frontend follows route-component-hook-lib flow, TanStack Query for server state, Zustand for auth/client state, TanStack Router for URL state, and shared loading/error patterns.
- Database changes are managed through Laravel migrations only.
- External AI/STT interactions are isolated behind services/contracts to make failures visible and testable.

Reviewing:

- Requirement and design documents are reviewed for consistency with Report 1 and current code.
- Feature implementation is reviewed against user flow, API contract, security, and data integrity.
- High-risk modules such as grading, wallet, payment callback, and profile/course ownership are reviewed more carefully.

Unit testing:

- Scoring formula behavior is tested through unit tests.
- Syntax analysis, FSRS scheduling, AI request/response wire formats, and enum/domain logic are tested where applicable.
- Fakes are used for AI-related services to avoid relying on external providers during tests.

Integration testing:

- Laravel feature tests cover authentication, profile, wallet, grammar, vocabulary, practice, exam, grading, notification, admin content, and learning path flows.
- API endpoints are checked against frontend expected response shape.

System testing:

- Main learner journeys are tested end-to-end: login/register, onboarding/profile, practice, mock exam, grading, result display, learning recommendation, wallet top-up, course enrollment, and booking.
- Deployment smoke checks include API health, frontend loading, database migration, queue worker, Redis, PostgreSQL, and LanguageTool availability.

### 2.3 Training Plan

| Training Area | Participants | When, Duration | Waiver Criteria |
|---------------|--------------|----------------|-----------------|
| VSTEP exam structure and scoring rubric | All members | Week 1, 2 days | Mandatory |
| Laravel 13 API, FormRequest, Service pattern, migrations, queue, Horizon | Backend developers | Week 1-2, 5 days | Mandatory for backend tasks |
| PostgreSQL schema design and Laravel Eloquent relationships | Backend developers | Week 2, 3 days | Mandatory for database-related tasks |
| React 19, Vite 8, TanStack Router, TanStack Query, Zustand | Frontend developers | Week 1-2, 5 days | Mandatory for frontend tasks |
| AI grading integration, prompt design, fake services for tests, async job handling | Backend developers and team leader | Week 3-4, 5 days | Mandatory for grading-related tasks |
| Speech-to-text and audio upload/download flow | Speaking feature owners | Week 4, 3 days | Mandatory for speaking tasks |
| Docker Compose, Traefik, Redis, PostgreSQL, deployment environment | Team leader and deployment owner | Week 5, 3 days | Mandatory for deployment owner |
| Git workflow, code review, issue tracking, and documentation versioning | All members | Week 1, 2 days | Mandatory |

## 3. Project Deliverables

| # | Deliverable | Due Date | Notes |
|---|-------------|----------|-------|
| 1 | Start Project | 01/01/2026 | Confirm team, topic, supervisors, project repository, and communication channels |
| 2 | Sprint 1 - Project foundation | 01/01/2026 - 14/01/2026 | Product vision, project scope, user roles, existing-system analysis, initial prototype, technology training, Report 1 |
| 3 | Sprint 2 - Planning and requirements | 15/01/2026 - 28/01/2026 | Project management plan, high-level schedule, risks, responsibility matrix, core requirements, Report 2 |
| 4 | Sprint 3 - Architecture and database design | 29/01/2026 - 11/02/2026 | Backend architecture, database schema, API grouping, frontend route plan, SRS/SDD draft |
| 5 | Sprint 4 - Authentication, profile, foundation learning | 12/02/2026 - 25/02/2026 | Auth, profile, onboarding, vocabulary, grammar, initial learner dashboard |
| 6 | Sprint 5 - Practice modules | 26/02/2026 - 11/03/2026 | Listening, reading, writing, speaking practice flows, practice sessions, progress updates |
| 7 | Sprint 6 - Mock exam and grading | 12/03/2026 - 25/03/2026 | Exam sessions, draft autosave, grading jobs, writing/speaking results, SSE progress stream |
| 8 | Sprint 7 - Commerce, course, teacher, notification | 26/03/2026 - 08/04/2026 | Wallet, top-up, promo, course enrollment, booking, teacher schedule, notifications |
| 9 | Sprint 8 - Admin operations and analytics | 09/04/2026 - 22/04/2026 | Content management APIs, system config, analytics endpoints, operational dashboard support |
| 10 | Sprint 9 - Testing, documentation, stabilization | 23/04/2026 - 30/04/2026 | Test documentation, user guide, final bug fixing, deployment smoke test, final report consolidation |

## 4. Responsibility Assignments

D - Do; R - Review; S - Support; I - Informed; blank - Omitted

Team role baseline:

| Member | Main Role | Git Commit Identity Evidence |
|--------|-----------|------------------------------|
| Hoàng Văn Anh Nghĩa | Backend Developer, Team Leader | `nghyane`, `Hoàng Văn Anh Nghĩa` |
| Nguyễn Trần Tấn Phát | Frontend Developer | `phatse` |
| Nguyễn Nhật Phát | Frontend Developer | `nhật phát`, `nhatphatt` |
| Nguyễn Minh Khôi | Mobile Developer | `NguyenMinhKhoiSE172625` |

| Responsibility | Hoàng Văn Anh Nghĩa (BE/Leader) | Nguyễn Trần Tấn Phát (FE) | Nguyễn Nhật Phát (FE) | Nguyễn Minh Khôi (Mobile) | Academic Supervisor | Industry Supervisor |
|----------------|-------------------------------|-----------------------------|-------------------------|---------------------------|---------------------|--------------------|
| Project Planning & Tracking | D | S | S | S | R | R |
| Project Introduction Document | D | S | S | S | R | I |
| Project Management Plan | D | S | S | S | R | I |
| SRS Document - Overview and Requirements | D | S | S | S | R | R |
| Software Design Document | D | S | S | S | R | R |
| Backend API architecture | D | I | I | S | I | R |
| Database design and migrations | D | I | I | S | I | R |
| AI grading, queue, SSE, and scoring pipeline | D | S | S | I | I | R |
| Frontend learner UI | R | D | D | I | I | R |
| Practice UI - Listening and Reading | S | D | D | I | I | R |
| Practice UI - Writing and Speaking | S | D | D | S | I | R |
| Mock exam and grading result UI | S | D | D | I | I | R |
| Wallet, course, notification, and feedback frontend flows | S | D | D | I | I | R |
| Admin/staff/teacher management frontend support | S | D | D | I | I | R |
| Mobile application and mobile speaking flow | S | I | I | D | I | R |
| API integration across web and mobile clients | D | D | D | D | I | R |
| Testing and defect fixing | D | D | D | D | R | R |
| Deployment and operation checklist | D | S | S | S | I | R |
| User Guide and Final Report | D | S | S | S | R | I |

## 5. Project Communications

| Communication Item | Who / Target | Purpose | When, Frequency | Type, Tool, Method(s) |
|--------------------|--------------|---------|-----------------|-----------------------|
| Project Kickoff Meeting | All team members, supervisors | Confirm objectives, scope, roles, and expected deliverables | At project start, one-time | In-person or online meeting |
| Sprint Planning | Development team | Select backlog items, assign responsibilities, confirm sprint output | Start of each sprint | Meeting, GitHub issues/board, shared schedule |
| Daily/Regular Standup | Development team | Share progress, blockers, and next tasks | 3-5 times per week depending on workload | Discord/Zalo meeting or chat |
| Technical Discussion | Feature owners, reviewer, team leader | Resolve implementation risks such as grading, API contract, payment, deployment | Whenever a technical decision is needed | Discord call, code review, repository discussion |
| Weekly Progress Report | Team leader, supervisors | Summarize completed work, blockers, risks, and next-week plan | Weekly | Meeting notes, Google Docs, email/message |
| Change Request Discussion | Team leader, affected members, supervisors | Review requirement changes and decide whether to include, defer, or reject | Whenever scope changes | Google Docs, issue tracker, meeting |
| Code Review | Developer and reviewer | Detect defects before merging and maintain architecture conventions | For important changes before merge | GitHub pull request or direct review |
| Document Review | Document owner, team, supervisor | Ensure report consistency and factual accuracy | Before each report submission | Google Docs/Markdown review |
| Final Acceptance Review | Team, supervisors | Confirm final delivery, test results, and presentation readiness | Final sprint | Demo, checklist, final report review |

## 6. Configuration Management

### 6.1 Document Management

Project documents are managed with version control and explicit record of changes.

- Approved report content is stored under `docs/capstone/reports/` in Markdown format when possible.
- Official templates and source `.docx` files are stored under `docs/capstone/Template/`.
- Each report contains a Record of Changes section with date, change type, owner, and change description.
- Document changes must preserve consistency between Report 1, Report 2, SRS, SDD, Test Documentation, User Guide, and Final Report.
- Current implementation and planned/deferred scope must be clearly distinguished.
- Shared working copies may be edited in Google Docs or Microsoft Word, but the repository version is treated as the baseline for traceability.
- Final submitted `.docx` or `.pdf` versions should be generated from the approved report content.

### 6.2 Source Code Management

Source code is managed in Git/GitHub with branch-based development.

- `main` contains stable integrated code.
- Feature branches are used for new functions, bug fixes, documentation, and report updates.
- Commits should be small, clear, and related to one purpose.
- Pull requests or review steps are required for important backend, frontend, database, payment, grading, and deployment changes.
- The team avoids directly editing generated or legacy apps unless explicitly required.
- Active application boundaries are kept separate: `apps/backend-v2`, `apps/frontend-v3`, `apps/admin`, and `apps/mobile-v2` are independent apps.
- Database changes are introduced through Laravel migrations; manual database-only changes are not accepted as source of truth.
- Secrets and environment-specific values are kept in environment files or deployment configuration, not committed as source code.
- Git commit history is also used as supporting evidence for actual contribution ownership. Current repository history shows commits from the four main team identities: `nghyane`/`Hoàng Văn Anh Nghĩa` for backend and leadership work, `phatse` for frontend work, `nhật phát`/`nhatphatt` for frontend work, and `NguyenMinhKhoiSE172625` for mobile work.

### 6.3 Tools & Infrastructures

| Category | Tools / Infrastructure |
|----------|------------------------|
| Backend Technology | PHP 8.4, Laravel 13, Laravel AI, jwt-auth, Laravel Octane with FrankenPHP, Laravel Horizon |
| Frontend Technology | React 19, Vite 8, TanStack Router, TanStack Query v5, Zustand, Tailwind CSS v4, ky, Recharts |
| Admin Technology | React 19, Vite 8, TanStack Router, TanStack Query v5, Ant Design v6, ky, Zustand |
| Mobile Technology | Expo, React Native |
| Database | PostgreSQL 17 |
| Cache and Queue | Redis 7, Laravel queue, Horizon |
| AI and Language Support | Laravel AI, LLM-backed assessment services, LanguageTool grammar checker, speech-to-text service integration |
| File Storage | S3-compatible object storage for audio upload/download through presigned URLs |
| Deployment | Docker Compose, Traefik, Nginx-based frontend/admin images, production containers |
| Testing | PHPUnit 12, Laravel feature/unit tests, frontend Biome lint/build checks, manual system test cases |
| Code Quality | Laravel Pint, Biome, TypeScript, code review checklist |
| Documentation | Markdown, Microsoft Word templates, Google Docs/Sheets/Slides, Draw.io |
| Version Control | Git, GitHub repository |
| Project Communication | Discord/Zalo, GitHub issues/PRs, supervisor meetings |
| Project Management | Sprint backlog, task board, report checklist, release checklist |
