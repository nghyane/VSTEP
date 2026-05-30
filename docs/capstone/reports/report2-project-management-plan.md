# I. Record of Changes

| Date | A/M/D | In charge | Change Description |
|------|-------|-----------|-------------------|
| 10/03/2026 | A | Hoàng Văn Anh Nghĩa | Initial version — WBS, project objectives, risk register, management approach |
| 29/05/2026 | M | Hoàng Văn Anh Nghĩa | Updated project scope, responsibility assignments, and risk management plan |
| 29/05/2026 | M | Hoàng Văn Anh Nghĩa | Updated tools, infrastructure, and configuration management sections |
| 30/05/2026 | M | Hoàng Văn Anh Nghĩa | Revised report content to align with Report 2 project management template |

*A - Added   M - Modified   D - Deleted

# II. Project Management Plan

## 1. Overview

### 1.1 Scope & Estimation

| # | WBS Item | Complexity | Est. Effort (man-days) |
|---|----------|------------|------------------------|
| **1** | **FE-01: User Authentication** | | **24** |
| 1.1 | Backend authentication and user profile management | Medium | 9 |
| 1.2 | Web login, registration, and onboarding screens | Medium | 8 |
| 1.3 | Mobile authentication screens | Medium | 7 |
| **2** | **FE-02: Practice — Listening** | | **22** |
| 2.1 | Listening practice backend functions | Medium | 7 |
| 2.2 | Web listening practice screens | Medium | 8 |
| 2.3 | Mobile listening practice screens | Medium | 7 |
| **3** | **FE-03: Practice — Reading** | | **22** |
| 3.1 | Reading practice backend functions | Medium | 7 |
| 3.2 | Web reading practice screens | Medium | 8 |
| 3.3 | Mobile reading practice screens | Medium | 7 |
| **4** | **FE-04: Practice — Writing** | | **38** |
| 4.1 | Writing practice backend functions, rubric-based scoring, and feedback processing | Complex | 14 |
| 4.2 | Web writing editor and grading result display | Complex | 12 |
| 4.3 | Mobile writing practice screens | Complex | 12 |
| **5** | **FE-05: Practice — Speaking** | | **46** |
| 5.1 | Speaking practice backend functions, speech processing, and rubric-based scoring | Complex | 18 |
| 5.2 | Web speaking practice screens | Complex | 14 |
| 5.3 | Mobile speaking practice screens | Complex | 14 |
| **6** | **FE-06: Mock Test Mode** | | **48** |
| 6.1 | Mock test session management and 4-skill scoring, including rubric-based formulas for Writing and Speaking | Complex | 18 |
| 6.2 | Web mock test room screens | Complex | 16 |
| 6.3 | Mobile mock test screens | Complex | 14 |
| **7** | **FE-07: AI-supported Scoring Engine** | | **52** |
| 7.1 | VSTEP rubric setup and scoring rules | Complex | 12 |
| 7.2 | AI evidence extraction and feedback workflow with retry and failure handling | Complex | 14 |
| 7.3 | External language support tools integration | Complex | 10 |
| 7.4 | Background processing for grading feedback | Complex | 10 |
| 7.5 | Writing and Speaking evidence-based feedback generation | Medium | 6 |
| **8** | **FE-08: Progress Tracking** | | **30** |
| 8.1 | Learner statistics and progress analysis | Complex | 12 |
| 8.2 | Web dashboard and progress visualization | Complex | 10 |
| 8.3 | Mobile dashboard and progress screens | Medium | 8 |
| **9** | **FE-09: Learning Path** | | **20** |
| 9.1 | Skill gap analysis, learning recommendations, and vocabulary review scheduling | Medium | 8 |
| 9.2 | Web learning path and vocabulary review screens | Medium | 6 |
| 9.3 | Mobile learning path and vocabulary review screens | Medium | 6 |
| **10** | **FE-10: Course Management** | | **42** |
| 10.1 | Course, schedule, enrollment, and booking backend functions | Complex | 16 |
| 10.2 | Web course enrollment and booking screens | Complex | 14 |
| 10.3 | Mobile course and booking screens | Complex | 12 |
| **11** | **FE-11: Content Management** | | **46** |
| 11.1 | Admin backend functions for learning content | Complex | 16 |
| 11.2 | Admin dashboard, analytics, and content management screens | Complex | 18 |
| 11.3 | Exam import and validation workflow | Complex | 8 |
| 11.4 | Content publishing and version management | Medium | 4 |
| **12** | **FE-12: Notification System** | | **20** |
| 12.1 | Notification backend functions and study reminders | Medium | 8 |
| 12.2 | Web notification screens | Medium | 6 |
| 12.3 | Mobile notification screens | Medium | 6 |
| **13** | **FE-13: Exercise Feedback** | | **12** |
| 13.1 | Feedback backend functions | Simple | 4 |
| 13.2 | Web feedback screens | Simple | 4 |
| 13.3 | Mobile feedback screens | Simple | 4 |
| **14** | **Infrastructure & DevOps** | | **28** |
| 14.1 | Deployment environment setup | Medium | 8 |
| 14.2 | CI/CD pipeline setup | Medium | 8 |
| 14.3 | Payment gateway integration | Complex | 8 |
| 14.4 | Wallet and transaction management | Medium | 4 |
| **15** | **Documentation & Testing** | | **42** |
| 15.1 | Unit tests, integration tests, and external service test isolation | Complex | 16 |
| 15.2 | URS + SRS documents | Medium | 8 |
| 15.3 | Architecture & Design documents (UML: use case, sequence, class, component) | Medium | 8 |
| 15.4 | Testing report + test cases | Medium | 6 |
| 15.5 | Installation guide + User guide | Simple | 4 |
| | **Total Estimated Effort (man-days)** | | **492** |

> **Estimation basis:** 4 team members × 17 weeks × ~7.5 working days/week ≈ 510 man-days available. Estimated coding effort is 492 man-days; the remaining 18 man-days cover project management overhead, sprint ceremonies, and buffer. Complexity classification follows FPT University guidelines: Simple (well-understood, repetitive), Medium (requires design decisions), Complex (novel domain, multi-system integration).

### 1.2 Project Objectives

**Overall Objective:** Build an adaptive VSTEP preparation platform that combines 4-skill assessment, rubric-based scoring, AI-supported evidence extraction for productive skills, adaptive learning support through skill-gap recommendations and vocabulary spaced repetition, and visual progress tracking to help Vietnamese learners prepare efficiently for the VSTEP examination.

**Quality Targets:**

| # | Testing Stage | Test Coverage | Est. Defects | % of Defect | Notes |
|---|--------------|---------------|-------------|-------------|-------|
| 1 | Reviewing | 100% code reviewed via Pull Request | ~15 | 10% | Automated style checks are enforced |
| 2 | Unit Test | ≥ 70% on critical services (scoring formulas, AI evidence extraction, learning scheduler) | ~30 | 21% | PHPUnit; external services isolated by test doubles |
| 3 | Integration Test | Main API endpoints and cross-module flows | ~45 | 31% | Auth, Wallet, Practice, Exams, Learning Path, Admin |
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
| 1 | External AI service instability or rate limiting delays task-evidence extraction and feedback generation for Writing/Speaking | High | Medium | Keep scoring formulas separated from AI calls; use centralized retry and circuit-breaker handling for temporary failures; persist completed results; mark failed jobs with visible error messages when the service remains unavailable |
| 2 | Speech-processing service errors or low-quality recordings affect Speaking transcription and pronunciation signals | High | Medium | Store speaking submissions as background grading jobs; validate submitted audio references; retry through the queue for temporary failures; show clear processing or failed status; require resubmission when transcription or pronunciation signals cannot be produced |
| 3 | Limited team experience with rubric-based scoring, AI evidence extraction, and prompt design slows assessment feature development | Medium | High | Allocate early research time; validate scoring formulas with sample answers; pair program on assessment components; review outputs with supervisors; document scoring assumptions and limitations |
| 4 | Scope creep causes Phase 2 or out-of-scope features to enter the current development timeline | High | Medium | Maintain the approved capstone scope; keep dynamic adaptive difficulty beyond current learning support, teacher-assigned modules, and machine-learning prediction outside the current scope; review backlog weekly with the supervisor before accepting new work |
| 5 | Payment integration complexity delays Wallet, course enrollment, and booking-related flows | Medium | Medium | Prioritize the selected wallet top-up payment flow for the current capstone scope; keep course enrollment confirmation independent for testing; make payment confirmation idempotent; keep additional gateways outside current scope |
| 6 | Different technology stacks across backend, web, admin, and mobile lead to inconsistent UI/API behavior or coding patterns | Medium | Medium | Use shared conventions for API contracts, naming, validation, and error handling; require Pull Request review; let the team lead review cross-module consistency; maintain design and workflow guidance |
| 7 | FPT University class schedule conflicts cause uneven workload distribution across team members | Medium | Medium | Use async daily standups; keep tasks visible on the project board; assign backup supporters for critical tasks; include buffer in sprint planning; redistribute work during sprint review if needed |
| 8 | Database schema changes during development cause integration conflicts or inconsistent test data | Medium | Medium | Review schema changes before implementation; version all schema changes; prepare reproducible seed/sample data; run migration and integration checks before merging; avoid changing shared data structures without team notice |

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
| Sprint 2 | 3–4 (Jan) | FE-01 Auth + FE-11 Base | Authentication, user profile management, content management foundation, SRS draft |
| Sprint 3 | 5–6 (Feb) | FE-02/03 Listening/Reading + FE-07 Start | MCQ practice APIs, audio pipeline, VSTEP rubric seeding |
| Sprint 4 | 7–8 (Feb) | FE-04 Writing + FE-07 Continue | Writing practice, scoring formulas, AI evidence extraction, feedback processing, Architecture & DDD docs |
| Sprint 5 | 9–10 (Mar) | FE-05 Speaking + FE-06 Mock Test | Speech processing, exam session management, conversation practice |
| Sprint 6 | 11–12 (Mar) | FE-08/09 Progress/Learning Path + FE-12 | Dashboard, progress visualization, learning recommendations, vocabulary review support, notifications |
| Sprint 7 | 13–14 (Apr) | FE-10 Courses + Wallet + FE-13 | Course enrollment, booking, payment, exercise feedback |
| Sprint 8 | 15–16 (Apr) | FE-11 Content Mgmt + Admin Panel | Full admin CRUD, analytics, content workflow, testing & bug fixing |
| Buffer | 17 (Apr) | Acceptance + Documentation | Final testing, supervisor review, user guide, deployment finalization |

### 2.2 Quality Management

**Defect Prevention:**

- **Coding standards:** Automated formatting and linting are applied across backend and frontend code to keep style consistent and prevent common mistakes.
- **Type safety:** Backend and frontend code use typed language features and strict data structures to reduce runtime errors.
- **Input validation:** User input and API requests are validated at system boundaries before business logic is executed.
- **Architecture patterns:** The team follows a layered design with clear separation between controllers, services, models, and external integrations.

**Code Review:**

- Every code change must be submitted via Pull Request on GitHub.
- At least one reviewer approves before merge to `main` branch.
- Reviewer checklist: coding standards compliance, correct error handling, business logic accuracy, security considerations, test coverage.
- Team lead reviews all Pull Requests to ensure pattern consistency across backend, frontend, and mobile modules.
- Automated review is used for critical paths when applicable.

**Testing Strategy:**

| # | Testing Stage | Scope | Tools | Responsibility |
|---|--------------|-------|-------|---------------|
| 1 | Code Review | All Pull Requests | GitHub Pull Request review + automated linting | All team members |
| 2 | Unit Test | Core business logic such as scoring formulas, scheduling, authentication, and evidence extraction support logic | PHPUnit | Backend developers |
| 3 | Integration Test | API flows across authentication, practice, exams, payment, progress, and administration modules | PHPUnit + test doubles for external services | Backend + QA |
| 4 | System Test | Full VSTEP exam flow: Listening→Reading→Writing→Speaking; payment→enrollment→booking | Manual + automated scripts | All team members |
| 5 | Acceptance Test | Verify against SRS functional requirements and URS user stories | Manual verification | Academic supervisor |

**Test Isolation:** External services are replaced with controlled test doubles during automated testing so test results remain reproducible and do not depend on third-party availability.

### 2.3 Training Plan

| Training Area | Participants | When, Duration | Waiver Criteria |
|--------------|-------------|----------------|-----------------|
| Laravel + Eloquent ORM | All 4 members | Week 1, 3 days | Mandatory — backend foundation for all members |
| React + TanStack | All 4 members | Week 1–2, 4 days | Mandatory — frontend framework for web + admin |
| AI Evidence Extraction, Feedback, and Recommendation Support | Nghĩa, Nhật Phát | Week 3–4, 3 days | Mandatory — core technology for Writing and Speaking assessment support and personalized learning support |
| Docker + GitHub Actions CI/CD | Nghĩa, Khôi | Week 3–4, 2 days | Mandatory — infrastructure and deployment pipeline |
| Speech-to-Text and Pronunciation Assessment | Nghĩa, Nhật Phát | Week 5, 2 days | Mandatory — core dependency for Speaking module |
| Expo + React Native | Khôi, Tấn Phát | Week 2, 3 days | Mandatory — mobile application development |
| Git Workflow + Code Review Practice | All 4 members | Week 1, 1 day | Mandatory — team collaboration foundation |

## 3. Project Deliverables

| # | Deliverable | Due Date | Notes |
|---|------------|----------|-------|
| 1 | User Requirement Specification (URS) | 15/01/2026 | User needs, functional requirements, non-functional requirements, and use case diagrams |
| 2 | Software Requirement Specification (SRS) | 31/01/2026 | Detailed system requirements and acceptance criteria |
| 3 | System Architecture & Design Document | 15/02/2026 | Overall architecture and main UML diagrams |
| 4 | Detailed Design Document (DDD) | 28/02/2026 | Database design, component design, and interface design |
| 5 | Backend Application | 15/03/2026 | Core server-side functions for authentication, practice, tests, grading, and management |
| 6 | Web Application | 31/03/2026 | Learner-facing web functions for practice, mock tests, dashboard, and courses |
| 7 | Mobile Application | 31/03/2026 | Learner-facing mobile functions for practice, mock tests, and learning support |
| 8 | Admin Application | 07/04/2026 | Administration functions for content, users, analytics, and courses |
| 9 | AI-supported Scoring Module | 07/04/2026 | Writing and Speaking assessment using rubric-based formulas with AI-extracted evidence and feedback support |
| 10 | Testing Report and Test Cases | 15/04/2026 | Test plan, test cases, test results, and defect summary |
| 11 | Installation Guide and Deployment Package | 22/04/2026 | Environment setup, deployment instruction, and release package |
| 12 | User Guide / Tutorial | 25/04/2026 | Instructions for learners, instructors, and administrators |
| 13 | Final Implementation Report and Source Code | 30/04/2026 | Final submission package and demo preparation |

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
| AI-supported Scoring Engine (FE-07) | D | I | S | I |
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

Documents are versioned by date and revision number. Draft documents are edited collaboratively on Google Drive, then finalized in the repository and exported to PDF for submission. Major changes are recorded in the Record of Changes table.

### 6.2 Source Code Management

- **Repository:** Source code is managed in a private GitHub repository.
- **Branch strategy:** The main branch stores stable code. New features and fixes are developed in separate branches and merged after review.
- **Merge policy:** All changes must be submitted through Pull Requests and approved by at least one reviewer before merging.
- **Commit convention:** Commit messages follow a consistent format so changes can be tracked clearly.
- **Code quality:** Formatting, linting, and automated tests are checked before merge.
- **Security policy:** Sensitive configuration is stored outside source control and managed through environment files or deployment secrets.

### 6.3 Tools & Infrastructures

| Category | Tools / Infrastructure |
|----------|----------------------|
| Technology | Laravel, React, TanStack, Expo, React Native |
| Database | PostgreSQL, Redis |
| IDEs / Editors | Visual Studio Code, Cursor |
| Diagramming | Draw.io, StarUML, Mermaid |
| Documentation | Microsoft Office, Google Docs/Sheets/Slides, Markdown |
| Version Control | GitHub for source code, Google Drive for document drafts |
| Deployment server | Docker, Traefik, Linux VPS |
| External Services | AI services, speech services, payment gateway, third-party login, object storage |
| Testing | PHPUnit, automated linting, manual testing |
| Project Management | GitHub Issues, GitHub Projects |
| Communication | Discord, Google Meet, FPT Email |
