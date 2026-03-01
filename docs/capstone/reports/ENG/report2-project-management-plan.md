# Capstone Project Report

## Report 2 — Project Management Plan

**Project**: An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support

**Project Code**: SP26SE145 · Group: GSP26SE63

**Duration**: 01/01/2026 – 30/04/2026

— Hanoi, March 2026 —

---

# I. Record of Changes

\*A — Added · M — Modified · D — Deleted

| Date | A/M/D | In Charge | Change Description |
|------|-------|-----------|-------------------|
| 01/01/2026 | A | Nghĩa (Leader) | Initial project plan, WBS, risk register |
| 15/01/2026 | A | Nghĩa | Added responsibility matrix and communication plan |
| 01/02/2026 | M | Nghĩa | Updated estimation after Sprint 1 velocity baseline |
| 15/02/2026 | M | Khôi | Revised backend phases — dropped Rate Limiting, Circuit Breaker, Admin/Observability, and Data Retention phases (out of capstone scope) |
| 01/03/2026 | M | Nghĩa | Updated delivery schedule after Phase 1–3 completion |

---

# II. Project Management Plan

## 1. Overview

### 1.1 Scope & Estimation

| # | WBS Item | Complexity | Est. Effort (man-days) |
|---|----------|-----------|----------------------|
| **1** | **Authentication & Authorization** | | **18** |
| 1.1 | User registration & login (email/password) | Medium | 4 |
| 1.2 | JWT access/refresh token lifecycle (rotation, reuse detection, max 3 devices) | Complex | 7 |
| 1.3 | RBAC middleware (learner/instructor/admin) | Medium | 4 |
| 1.4 | Profile management (GET /auth/me, update profile) | Simple | 3 |
| **2** | **Question Bank** | | **14** |
| 2.1 | Question CRUD (4 skills × multiple formats, JSONB content) | Medium | 5 |
| 2.2 | Question content validation (skill-specific schemas) | Medium | 4 |
| 2.3 | Seed data pipeline (JSON → DB with schema validation) | Simple | 3 |
| 2.4 | Question versioning | Simple | 2 |
| **3** | **Submission & Auto-grading** | | **22** |
| 3.1 | Submission CRUD with 5-state machine (pending/processing/completed/review_pending/failed) | Complex | 7 |
| 3.2 | Listening/Reading auto-grading (answer key comparison, score calculation) | Medium | 5 |
| 3.3 | Redis queue integration — LPUSH grading tasks for writing/speaking | Medium | 5 |
| 3.4 | Submission details (answer/result JSONB storage) | Simple | 3 |
| 3.5 | Polling fallback endpoint (GET /submissions/:id/status) | Simple | 2 |
| **4** | **AI Grading Service (Python)** | | **25** |
| 4.1 | Writing grading pipeline (LLM rubric prompt → 4-criteria scores + feedback) | Complex | 8 |
| 4.2 | Speaking grading pipeline (Whisper STT → LLM assessment → 4-criteria scores) | Complex | 8 |
| 4.3 | Redis BRPOP worker loop with retry (max 3) and dead letter queue | Medium | 5 |
| 4.4 | Confidence routing (high → completed, medium/low → review_pending) | Simple | 2 |
| 4.5 | Score-to-band mapping and result persistence to PostgreSQL | Simple | 2 |
| **5** | **Human Review Workflow** | | **12** |
| 5.1 | Review queue endpoint (sorted by priority, FIFO) | Medium | 3 |
| 5.2 | Claim/release mechanism (Redis distributed lock, TTL 15 min) | Medium | 4 |
| 5.3 | Submit review with merge rules (instructor score is final, audit flag) | Medium | 3 |
| 5.4 | Audit trail (AI result + human result preservation) | Simple | 2 |
| **6** | **Exam Mock Test** | | **18** |
| 6.1 | Exam blueprint CRUD (4-section structure, question selection) | Medium | 4 |
| 6.2 | Exam session lifecycle (start → auto-save → submit → complete) | Complex | 6 |
| 6.3 | Submit exam: auto-grade L/R, create submissions for W/S, score aggregation | Complex | 6 |
| 6.4 | Exam detail and session result endpoints | Simple | 2 |
| **7** | **Progress Tracking & Visualization** | | **16** |
| 7.1 | Sliding window computation (N=10, per skill, avg/stddev) | Medium | 4 |
| 7.2 | Trend classification (improving/stable/declining/inconsistent) | Medium | 3 |
| 7.3 | Spider chart data endpoint (current/trend/confidence per skill) | Medium | 3 |
| 7.4 | Overall band derivation (min of 4 skills) | Simple | 2 |
| 7.5 | ETA heuristic (linear regression, per-skill and overall) | Medium | 4 |
| **8** | **Adaptive Scaffolding** | | **10** |
| 8.1 | Stage progression engine (writing: Template→Keywords→Free, listening: FullText→Highlights→PureAudio) | Medium | 4 |
| 8.2 | Initial stage assignment based on proficiency level | Simple | 2 |
| 8.3 | Micro-hints tracking and level-up blocking rule | Simple | 2 |
| 8.4 | Integration with submission completion trigger | Simple | 2 |
| **9** | **Goal Setting** | | **6** |
| 9.1 | Goal CRUD (target band, deadline, daily study time) | Simple | 3 |
| 9.2 | Goal status computation (achieved, onTrack, daysRemaining) | Simple | 3 |
| **10** | **Class Management** | | **10** |
| 10.1 | Class CRUD with invite code | Medium | 3 |
| 10.2 | Class membership (join/leave/remove) | Simple | 3 |
| 10.3 | Instructor dashboard and feedback | Medium | 4 |
| **11** | **Frontend (Web Application)** | | **30** |
| 11.1 | Authentication pages (login, register, profile) | Medium | 4 |
| 11.2 | Practice mode UI (4 skills with scaffolding support) | Complex | 8 |
| 11.3 | Mock test UI (timed exam with auto-save) | Complex | 6 |
| 11.4 | Progress dashboard (spider chart, trend, ETA) | Medium | 5 |
| 11.5 | Instructor review interface | Medium | 4 |
| 11.6 | Type sync from backend and API integration | Simple | 3 |
| **12** | **Infrastructure & DevOps** | | **8** |
| 12.1 | Docker Compose (PostgreSQL + Redis) | Simple | 2 |
| 12.2 | Database seeding pipeline | Simple | 3 |
| 12.3 | CI setup and deployment | Simple | 3 |
| **13** | **Testing & QA** | | **15** |
| 13.1 | Backend integration tests (auth, submissions, exams, progress, classes, review) | Medium | 6 |
| 13.2 | Backend unit tests (scoring, state machine, scaffolding) | Simple | 3 |
| 13.3 | Grading service tests (scoring, model validation) | Simple | 3 |
| 13.4 | System testing and UAT | Medium | 3 |
| | **Total Estimated Effort (man-days)** | | **204** |

### 1.2 Project Objectives

**Overall Objective**: Deliver an adaptive VSTEP preparation platform that combines AI grading, human review, and personalized learning to help Vietnamese learners efficiently improve across all four English skills (Listening, Reading, Writing, Speaking).

**Quality Targets**:

| Metric | Target |
|--------|--------|
| Milestone timeliness | >= 90% milestones delivered on time |
| Defect escape rate (post-release) | < 5% of total defects found in production |
| AI grading accuracy (vs. human raters) | >= 85% agreement (within 0.5 score band) |
| Test coverage (backend integration) | >= 80% of API endpoints covered |
| Code quality | All code passes `bun run check` (Biome lint/format, zero errors) |

**Allocated Effort Distribution**:

| Activity | Man-days | % |
|----------|----------|---|
| Requirements & Design | 20 | 9.8% |
| Coding (Backend + Frontend + Grading) | 110 | 53.9% |
| Testing & QA | 30 | 14.7% |
| Project Management & Documentation | 24 | 11.8% |
| Deployment & Infrastructure | 10 | 4.9% |
| Buffer/Contingency | 10 | 4.9% |
| **Total** | **204** | **100%** |

### 1.3 Project Risks

| # | Risk Description | Impact | Possibility | Response Plans |
|---|-----------------|--------|-------------|---------------|
| 1 | LLM/STT provider rate limits or downtime (Groq, OpenAI) causing grading delays | High | Medium | Implement LiteLLM router with fallback model support. Worker retries (max 3, exponential backoff). Dead letter queue for persistent failures. |
| 2 | AI grading quality insufficient for productive skills (Writing/Speaking) | High | Medium | Confidence-based routing: low/medium confidence → instructor review queue. Audit flag tracks AI vs. human score discrepancies for model improvement. |
| 3 | Team members lack experience with Bun/Elysia/Drizzle stack | Medium | High | Training plan (Week 1-2). Team lead provides code review and pair programming. Comprehensive technical specs pre-written. |
| 4 | JSONB schema complexity causes data inconsistency | Medium | Medium | TypeBox validation at API boundary. Seed data validated against schemas. Question content schemas documented in specs. |
| 5 | Scope creep — Phase 2 features expanding into core development time | High | Medium | Strict phase separation (Phase 1: MVP Months 1-3, Phase 2: Enhancement Month 4). Features FE-12 to FE-16 explicitly deferred. Rate Limiting, Circuit Breaker, Observability, Data Retention phases dropped from capstone scope. |
| 6 | Integration issues between Bun Main App and Python Grading Worker | Medium | Medium | Shared-DB architecture (both services write to same PostgreSQL). Redis queue contract defined in specs. Integration tested early in Sprint 3. |
| 7 | Audio file handling for Speaking assessment (upload, storage, transcription) | Medium | Low | Use pre-signed URLs for audio upload. Whisper transcription via LiteLLM with Redis caching (avoid re-transcription). |

---

## 2. Management Approach

### 2.1 Project Process

The team adopts a **Scrum-based Agile** process with 2-week sprints, adapted for the capstone timeline:

```
Sprint Planning → Development → Code Review → Testing → Sprint Review → Retrospective
     (Day 1)       (Day 2-9)     (ongoing)    (Day 8-10)   (Day 10)      (Day 10)
```

**Two-Phase Development Model**:

- **Phase 1 — MVP (Months 1-3, Sprints 1-6)**: 11 core features (FE-01 to FE-11) focusing on the learning experience and AI Grading pipeline
- **Phase 2 — Enhancement (Month 4, Sprints 7-8)**: 5 admin and support features (FE-12 to FE-16) after core features stabilize

**Backend Implementation Phases** (from implementation roadmap):

```
Phase 1 (Foundation Hardening)
├── Phase 2 (Submission Lifecycle & Auto-grading)
│   ├── Phase 4 (Progress Computation Engine)
│   │   └── Phase 5 (Adaptive Scaffolding)
│   ├── Phase 7 (SSE Real-time Notifications)
│   └── Phase 8 (Redis Queue + Grading Worker Integration)
│       ├── Phase 9 (Human Review Workflow)
│       └── Phase 11 (Exam Scoring & Session Flow)
└── Phase 3 (Goals Module) — parallelizable with Phase 2
```

Phases 6 (Rate Limiting), 10 (Circuit Breaker), 12 (Admin & Observability), 13 (Data Retention) are **dropped** — out of capstone scope.

### 2.2 Quality Management

**Defect Prevention**:
- Technical specifications written before implementation (22 spec files covering domain rules, API contracts, data schemas, platform concerns)
- Code style enforced by Biome linter (`bun run check`) with strict rules: `noConsole`, `noImportCycles`, `useNamingConvention`, `noNonNullAssertion`
- TypeBox schemas validate all inputs at API boundaries — "Parse, Don't Validate" principle

**Code Review**:
- All code changes go through pull request review before merge to main
- Reviewer checks: adherence to CODE_STYLE.md (5 rules), correct state transitions, proper error handling (throw, never return)
- Function structure enforced: guard → compute → write (no interleaving)

**Unit Testing**:
- Backend unit tests alongside source files (e.g., `scoring.test.ts`, `state-machine.test.ts`, `helpers.test.ts`)
- Grading service tests (`test_scoring.py`, `test_models.py`)
- Run: `bun test src/` (backend), `pytest` (grading)

**Integration Testing**:
- Backend integration tests in `tests/` directory calling the app via `app.handle()`
- Test factories: `createTestUser`, `createTestQuestion`, `createTestExam`, `createTestClass`
- Coverage: auth flows, submissions lifecycle, exam sessions, progress tracking, class management, review workflow
- Run: `bun test tests/`

**System Testing**:
- End-to-end testing of full grading pipeline: submission → Redis queue → AI grading → result persistence → SSE notification
- Cross-service integration: Backend ↔ Grading Worker ↔ PostgreSQL

| # | Testing Stage | Test Coverage | No. of Defects | % of Defect | Notes |
|---|--------------|--------------|----------------|-------------|-------|
| 1 | Code Review | All PRs | — | — | Biome lint + manual review |
| 2 | Unit Test | Scoring, state machine, scaffolding, auth helpers | — | — | `bun test src/`, `pytest` |
| 3 | Integration Test | 8 test suites (auth, users, questions, submissions, exams, progress, classes, review) | — | — | `bun test tests/` |
| 4 | System Test | Full grading pipeline, cross-service flows | — | — | Manual + automated |
| 5 | Acceptance Test | Feature acceptance against spec acceptance criteria | — | — | Per-phase acceptance criteria |

*Note: Defect counts to be filled during execution.*

### 2.3 Training Plan

| Training Area | Participants | When, Duration | Waiver Criteria |
|--------------|-------------|----------------|-----------------|
| Bun runtime + Elysia framework | Khôi, Phát (NN), Phát (NTT) | Week 1-2, 3 days | Prior experience with Elysia |
| Drizzle ORM + PostgreSQL | Khôi, Phát (NN), Phát (NTT) | Week 1-2, 2 days | Mandatory |
| TypeBox schema validation | Khôi | Week 2, 1 day | Mandatory |
| Python FastAPI + LiteLLM | Phát (NTT) | Week 1-2, 3 days | Prior FastAPI experience |
| React 19 + Vite 7 | Phát (NN) | Week 1, 2 days | Prior React experience |
| JWT authentication flow | All developers | Week 2, 1 day | Mandatory |
| Git workflow (branching, PR review) | All members | Week 1, 0.5 day | Mandatory |

---

## 3. Project Deliverables

| # | Deliverable | Due Date | Notes |
|---|------------|----------|-------|
| 1 | Report 1 — Project Introduction | 15/01/2026 | Submitted |
| 2 | Report 2 — Project Management Plan | 01/02/2026 | This document |
| 3 | Technical Specifications (22 spec files) | 15/01/2026 | Covers domain, contracts, data, platform, ops |
| 4 | Database Schema (Drizzle ORM + migrations) | 31/01/2026 | PostgreSQL tables, enums, indexes |
| 5 | Sprint 1-2: Foundation + Auth + Questions + Submissions | 28/02/2026 | Backend Phases 1-3 |
| 6 | Sprint 3-4: AI Grading Service + Auto-grading + Review | 15/03/2026 | Grading worker + human review workflow |
| 7 | Sprint 5-6: Progress Tracking + Scaffolding + Exams + Frontend MVP | 31/03/2026 | Backend Phases 4-5, 11 + Frontend core |
| 8 | Report 3 — SRS Document | 15/03/2026 | Software Requirements Specification |
| 9 | Sprint 7-8: Enhancement features + System testing | 15/04/2026 | Phase 2 features (FE-12 to FE-16) |
| 10 | Final Report + Demo | 30/04/2026 | Final presentation and deployment |

---

## 4. Responsibility Assignments

D — Do · R — Review · S — Support · I — Informed · (blank) — Omitted

| Responsibility | Nghĩa (Leader) | Khôi (Dev 1) | Phát NN (Dev 2) | Phát NTT (Dev 3) |
|---------------|:---:|:---:|:---:|:---:|
| Project Planning & Tracking | D | S | I | I |
| Technical Specifications (specs/) | R | D | S | S |
| Report 1 — Project Introduction | D | S | S | S |
| Report 2 — Project Management Plan | D | R | I | I |
| Report 3 — SRS Document | D | S | S | R |
| Backend: Auth module | S | D | | |
| Backend: Questions module | S | D | | |
| Backend: Submissions & State machine | R | D | | |
| Backend: Exams module | S | D | | |
| Backend: Progress & Scaffolding | R | D | | |
| Backend: Human Review Workflow | S | D | | |
| Backend: Goals & Classes | S | D | | |
| Backend: Integration Tests | R | D | S | |
| Frontend: Auth & Profile pages | | S | D | |
| Frontend: Practice mode UI | | S | D | |
| Frontend: Mock test UI | | S | D | |
| Frontend: Progress dashboard | | S | D | |
| Frontend: Instructor review UI | | S | D | |
| Grading: Writing pipeline | | S | | D |
| Grading: Speaking pipeline (STT + LLM) | | S | | D |
| Grading: Redis worker + retry logic | | S | | D |
| Grading: Unit tests | | | | D |
| Database Schema & Migrations | R | D | I | I |
| Seed Data Pipeline | S | D | | |
| Docker Compose & Infrastructure | S | D | | S |
| System Testing & QA | D | S | S | S |
| Final Report & Demo | D | S | S | S |

---

## 5. Project Communications

| Communication Item | Who/Target | Purpose | When, Frequency | Type, Tool, Method(s) |
|-------------------|-----------|---------|-----------------|----------------------|
| Sprint Planning | All members | Define sprint backlog, assign tasks | Every 2 weeks (Monday) | Online meeting, Google Meet |
| Daily Standup | All members | Share progress, blockers | Daily (15 min, async on weekdays) | Text update, Discord channel |
| Sprint Review & Retro | All members + Supervisor | Demo completed work, reflect on process | Every 2 weeks (Friday) | Online meeting, Google Meet |
| Supervisor Meeting | Leader + Supervisor | Report progress, get guidance | Weekly or bi-weekly | In-person or Google Meet |
| Code Review | Dev who opens PR + Reviewer | Ensure code quality and style compliance | Per pull request | GitHub Pull Request review |
| Technical Discussion | Relevant developers | Discuss design decisions, debug issues | Ad-hoc | Discord voice channel or thread |
| Documentation Updates | All members | Keep specs, reports, diagrams current | As changes occur | Git commit to `docs/` |

---

## 6. Configuration Management

### 6.1 Document Management

- All project documents stored in Git repository under `docs/capstone/`
  - `specs/` — Technical specifications (22 files organized into 00-overview, 10-contracts, 20-domain, 30-data, 40-platform, 50-ops)
  - `reports/` — Capstone reports (ENG and VI versions)
  - `diagrams/` — Flow diagrams and architecture diagrams
- Version control via Git commits with semantic commit messages (`docs:` prefix)
- Document versioning tracked in each spec file footer (e.g., "Document version: 2.0")
- Markdown format for all documentation (converted to DOCX via `scripts/build.py` when needed)
- Reports maintained in both English and Vietnamese (`reports/ENG/`, `reports/VI/`)

### 6.2 Source Code Management

- **Repository**: Single monorepo (`VSTEP/`) containing all three applications
- **Branching strategy**: Feature branches from `main`, merged via pull requests
  - Branch naming: `feat/<feature>`, `fix/<bug>`, `refactor/<scope>`, `docs/<topic>`
  - All merges require PR review and passing `bun run check`
- **Apps isolation**: Each app in `apps/<name>/` with independent `package.json` (backend, frontend) or `requirements.txt` (grading)
- **Commit convention**: Conventional commits with scope — `feat(backend):`, `fix(grading):`, `docs:`, `refactor(questions):`
- **Code style enforcement**: Biome (TypeScript), CODE_STYLE.md (project-wide rules)
- **No secrets in code**: `.env` files git-ignored, validated at startup via `t3-oss/env-core` (backend) and Pydantic Settings (grading)

### 6.3 Tools & Infrastructures

| Category | Tools / Infrastructure |
|----------|----------------------|
| Technology (Backend) | Bun + Elysia + Drizzle ORM + TypeBox + Jose (JWT) |
| Technology (Frontend) | React 19 + Vite 7 + TypeScript |
| Technology (Grading) | Python + FastAPI + LiteLLM + Redis BRPOP worker |
| Database | PostgreSQL 17 (shared by Backend + Grading) |
| Queue / Cache | Redis 7 Alpine (grading queue + caching) |
| AI Providers | Groq (Llama 3.3 70B for LLM, Whisper Large V3 Turbo for STT) via LiteLLM |
| IDEs/Editors | Visual Studio Code, Cursor |
| Linting / Formatting | Biome (TypeScript), Ruff (Python) |
| Testing | bun:test (backend), pytest (grading) |
| Diagramming | Mermaid (in Markdown), draw.io |
| Documentation | Markdown (Git-versioned), python-docx (DOCX generation via `scripts/build.py`) |
| Version Control | Git + GitHub (monorepo) |
| Containerization | Docker Compose (PostgreSQL, Redis for local dev) |
| Project Management | GitHub Issues, GitHub Projects |
| Communication | Discord (daily), Google Meet (sprint ceremonies) |
| API Documentation | OpenAPI (auto-generated from Elysia route schemas) |
