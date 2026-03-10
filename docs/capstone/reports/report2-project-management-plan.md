# I. Record of Changes

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 01/01/2026 | Hoàng Văn Anh Nghĩa | Kế hoạch dự án ban đầu, WBS, sổ đăng ký rủi ro |
| 1.1 | 15/01/2026 | Hoàng Văn Anh Nghĩa | Thêm ma trận trách nhiệm và kế hoạch truyền thông |
| 1.2 | 01/02/2026 | Hoàng Văn Anh Nghĩa | Cập nhật ước lượng sau baseline velocity Sprint 1 |
| 1.3 | 15/02/2026 | Nguyễn Minh Khôi | Điều chỉnh phạm vi backend — loại bỏ các tính năng ngoài phạm vi capstone |
| 1.4 | 01/03/2026 | Hoàng Văn Anh Nghĩa | Cập nhật lịch bàn giao sau khi hoàn thành Phase 1–3 |

# II. Project Management Plan

## 1. Overview

### 1.1 Scope & Estimation

| # | Work Package | Complexity | Effort (man-day) |
|---|-------------|------------|------------------|
| **1** | **Authentication & Authorization** | | **18** |
| 1.1 | Đăng ký, đăng nhập (email/password) | Medium | 4 |
| 1.2 | JWT access/refresh token lifecycle | Complex | 7 |
| 1.3 | RBAC middleware (Learner/Instructor/Admin) | Medium | 4 |
| 1.4 | Quản lý hồ sơ người dùng | Simple | 3 |
| **2** | **Question Bank** | | **14** |
| 2.1 | CRUD câu hỏi (4 kỹ năng, nhiều định dạng) | Medium | 5 |
| 2.2 | Validation nội dung câu hỏi | Medium | 4 |
| 2.3 | Pipeline nạp dữ liệu mẫu | Simple | 3 |
| 2.4 | Quản lý phiên bản câu hỏi | Simple | 2 |
| **3** | **Submission & Auto-Grading** | | **22** |
| 3.1 | CRUD submission với state machine | Complex | 7 |
| 3.2 | Chấm tự động Listening/Reading | Medium | 5 |
| 3.3 | Tích hợp message queue cho Writing/Speaking | Medium | 5 |
| 3.4 | Chi tiết submission (lưu trữ answer/result) | Simple | 3 |
| 3.5 | Endpoint polling trạng thái | Simple | 2 |
| **4** | **AI Grading Service (Python)** | | **25** |
| 4.1 | Pipeline chấm Writing (LLM + rubric VSTEP) | Complex | 8 |
| 4.2 | Pipeline chấm Speaking (STT + LLM) | Complex | 8 |
| 4.3 | Worker consume queue với retry và dead letter queue | Medium | 5 |
| 4.4 | Định tuyến theo confidence score | Simple | 2 |
| 4.5 | Quy đổi điểm thành band và lưu kết quả | Simple | 2 |
| **5** | **Human Grading Workflow** | | **12** |
| 5.1 | Hàng đợi review cho Instructor | Medium | 3 |
| 5.2 | Cơ chế claim/release bài chấm | Medium | 4 |
| 5.3 | Gửi kết quả review (Instructor override AI) | Medium | 3 |
| 5.4 | Audit trail (lưu kết quả AI + Instructor) | Simple | 2 |
| **6** | **Mock Test** | | **18** |
| 6.1 | CRUD exam blueprint (cấu trúc 4 phần) | Medium | 4 |
| 6.2 | Vòng đời exam session (bắt đầu → nộp bài) | Complex | 6 |
| 6.3 | Tổng hợp điểm: chấm tự động + tạo submission cho AI | Complex | 6 |
| 6.4 | Endpoint chi tiết đề thi và kết quả | Simple | 2 |
| **7** | **Progress Tracking & Visualization** | | **16** |
| 7.1 | Tính toán Sliding Window theo kỹ năng | Medium | 4 |
| 7.2 | Phân loại xu hướng tiến bộ | Medium | 3 |
| 7.3 | Dữ liệu Spider Chart | Medium | 3 |
| 7.4 | Xác định overall band | Simple | 2 |
| 7.5 | Ước lượng thời gian đạt mục tiêu (ETA) | Medium | 4 |
| **8** | **Adaptive Scaffolding** | | **10** |
| 8.1 | Engine chuyển đổi stage theo trình độ | Medium | 4 |
| 8.2 | Gán stage ban đầu | Simple | 2 |
| 8.3 | Theo dõi và kiểm soát level-up | Simple | 2 |
| 8.4 | Tích hợp trigger khi submission hoàn thành | Simple | 2 |
| **9** | **Goal Setting** | | **6** |
| 9.1 | CRUD goal (target band, deadline) | Simple | 3 |
| 9.2 | Tính toán trạng thái goal | Simple | 3 |
| **10** | **Class Management** | | **10** |
| 10.1 | CRUD lớp học với mã mời | Medium | 3 |
| 10.2 | Quản lý thành viên lớp | Simple | 3 |
| 10.3 | Dashboard giảng viên | Medium | 4 |
| **11** | **Frontend (Web Application)** | | **30** |
| 11.1 | Trang xác thực (đăng nhập, đăng ký, hồ sơ) | Medium | 4 |
| 11.2 | Giao diện Practice Mode (4 kỹ năng) | Complex | 8 |
| 11.3 | Giao diện Mock Test (có giới hạn thời gian) | Complex | 6 |
| 11.4 | Dashboard tiến độ (Spider Chart, xu hướng) | Medium | 5 |
| 11.5 | Giao diện review cho Instructor | Medium | 4 |
| 11.6 | Tích hợp API | Simple | 3 |
| **12** | **Infrastructure & DevOps** | | **8** |
| 12.1 | Docker Compose (PostgreSQL + Redis) | Simple | 2 |
| 12.2 | Pipeline nạp dữ liệu mẫu | Simple | 3 |
| 12.3 | CI và triển khai | Simple | 3 |
| **13** | **Testing & QA** | | **15** |
| 13.1 | Integration tests backend | Medium | 6 |
| 13.2 | Unit tests backend | Simple | 3 |
| 13.3 | Tests grading service | Simple | 3 |
| 13.4 | System testing và UAT | Medium | 3 |
| | **Total Estimated Effort** | | **204** |

### 1.2 Project Objectives

**Mục tiêu tổng quát:** Xây dựng nền tảng ôn luyện VSTEP thích ứng, kết hợp chấm điểm AI, duyệt bài thủ công và học tập cá nhân hóa nhằm giúp người học Việt Nam nâng cao hiệu quả cả 4 kỹ năng tiếng Anh.

**Chỉ tiêu chất lượng:**

| Chỉ tiêu | Mục tiêu |
|----------|----------|
| Tỷ lệ milestone đúng hạn | ≥ 90% |
| Tỷ lệ lỗi thoát ra production | < 5% |
| Độ chính xác chấm AI (so với giám khảo) | ≥ 85% tương đồng (biên độ 0.5 điểm) |
| Độ phủ kiểm thử backend | ≥ 80% API endpoints |

**Phân bổ effort theo hoạt động:**

| Hoạt động | Man-day | % |
|-----------|---------|---|
| Phân tích yêu cầu & Thiết kế | 20 | 9,8% |
| Lập trình (Backend + Frontend + Grading) | 110 | 53,9% |
| Kiểm thử & QA | 30 | 14,7% |
| Quản lý dự án & Tài liệu | 24 | 11,8% |
| Triển khai & Hạ tầng | 10 | 4,9% |
| Dự phòng | 10 | 4,9% |
| **Tổng** | **204** | **100%** |

### 1.3 Project Risks

| # | Risk Description | Impact | Likelihood | Response Plan |
|---|-----------------|--------|------------|---------------|
| 1 | Nhà cung cấp LLM/STT bị rate limit hoặc downtime | High | Medium | Sử dụng router với fallback model; worker retry tối đa 3 lần; dead letter queue cho lỗi liên tục |
| 2 | Chất lượng chấm AI không đủ tốt cho Writing/Speaking | High | Medium | Định tuyến theo confidence: low/medium → hàng đợi review Instructor; audit flag theo dõi chênh lệch |
| 3 | Thành viên thiếu kinh nghiệm với tech stack mới | Medium | High | Kế hoạch đào tạo tuần 1-2; Leader review code và pair programming |
| 4 | Độ phức tạp schema gây không nhất quán dữ liệu | Medium | Medium | Validation tại API boundary; seed data được validate theo schema |
| 5 | Phình phạm vi — tính năng Phase 2 lấn vào thời gian Phase 1 | High | Medium | Phân tách phase nghiêm ngặt; tính năng FE-12 đến FE-16 hoãn rõ ràng |
| 6 | Vấn đề tích hợp giữa Backend và Grading Worker | Medium | Medium | Shared-DB architecture; queue contract định nghĩa trong specs; integration test sớm |

## 2. Management Approach

### 2.1 Project Process

Nhóm áp dụng quy trình **Agile dựa trên Scrum** với sprint 2 tuần, tổng thời lượng 4 tháng (14 tuần, 7 sprint):

```
Sprint Planning → Development → Code Review → Testing → Sprint Review → Retrospective
    (Day 1)        (Day 2-9)     (continuous)   (Day 8-10)   (Day 10)      (Day 10)
```

**Mô hình phát triển 2 giai đoạn:**

- **Phase 1 — MVP (Tuần 1-10, Sprint 1-5):** 11 tính năng cốt lõi (FE-01 đến FE-11), tập trung vào trải nghiệm học tập và pipeline chấm điểm AI.
- **Phase 2 — Enhancement (Tuần 11-14, Sprint 6-7):** 5 tính năng quản trị và hỗ trợ (FE-12 đến FE-16) sau khi tính năng cốt lõi ổn định.

### 2.2 Quality Management

**Defect Prevention:**

- Technical specifications viết trước khi triển khai cho từng module.
- Code style được enforced tự động bằng linter; mọi code phải pass trước khi merge.
- Input validation tại API boundary cho toàn bộ endpoints.

**Code Review:**

- Mọi thay đổi mã nguồn phải qua pull request review trước khi merge vào main.
- Reviewer kiểm tra: tuân thủ coding standards, xử lý lỗi đúng cách, logic nghiệp vụ chính xác.

**Testing Strategy:**

| # | Test Phase | Scope | Notes |
|---|-----------|-------|-------|
| 1 | Code Review | Tất cả PR | Linter tự động + review thủ công |
| 2 | Unit Test | Scoring, state machine, scaffolding, auth | Backend + Grading service |
| 3 | Integration Test | Auth, submissions, exams, progress, classes, review | Backend API endpoints |
| 4 | System Test | Toàn bộ pipeline chấm điểm, luồng cross-service | Thủ công + tự động |
| 5 | Acceptance Test | Kiểm thử chấp nhận theo tiêu chí specs | Theo tiêu chí từng phase |

### 2.3 Training Plan

| Training Area | Participants | Duration | Exemption |
|--------------|-------------|----------|-----------|
| Bun runtime + Elysia framework | Nghĩa | Tuần 1-2, 3 ngày | Có kinh nghiệm trước đó |
| Drizzle ORM + PostgreSQL | Nghĩa | Tuần 1-2, 2 ngày | Bắt buộc |
| Python FastAPI + LiteLLM | Nghĩa | Tuần 1-2, 3 ngày | Có kinh nghiệm trước đó |
| React 19 + Vite 7 | Phát (NTT), Phát (NN) | Tuần 1-2, 3 ngày | Có kinh nghiệm React trước đó |
| React Native (Mobile) | Khôi | Tuần 1-2, 3 ngày | Có kinh nghiệm trước đó |
| JWT authentication flow | Tất cả developers | Tuần 2, 1 ngày | Bắt buộc |
| Git workflow (branching, PR review) | Tất cả thành viên | Tuần 1, 0.5 ngày | Bắt buộc |

## 3. Project Deliverables

| # | Deliverable | Due Date | Owner | Notes |
|---|------------|----------|-------|-------|
| 1 | Report 1 — Project Introduction | 15/01/2026 | Nghĩa | Đã nộp |
| 2 | Report 2 — Project Management Plan | 01/02/2026 | Nghĩa | Tài liệu này |
| 3 | Technical Specifications | 15/01/2026 | Nghĩa | Domain rules, API contracts, data schemas |
| 4 | Database Schema & Migrations | 31/01/2026 | Nghĩa | PostgreSQL tables, enums, indexes |
| 5 | Sprint 1-2: Foundation + Auth + Questions + Submissions | 28/02/2026 | Nghĩa | Backend core modules |
| 6 | Sprint 3-4: AI Grading + Auto-grading + Review | 15/03/2026 | Nghĩa | Grading worker + human review workflow |
| 7 | Sprint 5: Progress + Scaffolding + Exams | 31/03/2026 | Nghĩa | Backend remaining modules |
| 8 | Frontend MVP (Web) | 31/03/2026 | Phát (NTT), Phát (NN) | Auth, practice, mock test, dashboard |
| 9 | Mobile Application | 15/04/2026 | Khôi | React Native Android |
| 10 | Report 3 — Software Requirement Specification | 15/03/2026 | Nghĩa | SRS |
| 11 | Sprint 6-7: Enhancement + System Testing | 15/04/2026 | Tất cả | Phase 2 features (FE-12 đến FE-16) |
| 12 | Final Report + Demo | 30/04/2026 | Tất cả | Thuyết trình cuối và triển khai |

## 4. Responsibility Assignments

D — Do · R — Review · S — Support · I — Informed

| Responsibility | Nghĩa (Leader) | Khôi (Mobile) | Phát NN (FE) | Phát NTT (FE) |
|---------------|:---:|:---:|:---:|:---:|
| Project Planning & Tracking | D | S | I | I |
| Technical Specifications | D | S | S | S |
| Report 1 — Project Introduction | D | S | S | S |
| Report 2 — Project Management Plan | D | R | I | I |
| Report 3 — SRS | D | S | S | R |
| Backend: Auth Module | D | | | |
| Backend: Questions Module | D | | | |
| Backend: Submissions & State Machine | D | | | |
| Backend: Exams Module | D | | | |
| Backend: Progress & Scaffolding | D | | | |
| Backend: Human Grading Workflow | D | | | |
| Backend: Goals & Classes | D | | | |
| Backend: Integration Tests | D | | S | S |
| Frontend: Auth & Profile Pages | | | D | S |
| Frontend: Practice Mode UI | | | S | D |
| Frontend: Mock Test UI | | | D | S |
| Frontend: Progress Dashboard | | | S | D |
| Frontend: Instructor Review UI | | | D | S |
| Frontend: API Integration | S | | D | D |
| Mobile: Learner UI (React Native) | | D | S | S |
| Mobile: API Integration | S | D | | |
| Mobile: Audio Recording (Speaking) | S | D | | |
| Grading: Writing Pipeline | D | | | |
| Grading: Speaking Pipeline (STT + LLM) | D | | | |
| Grading: Queue Worker | D | | | |
| Database Schema & Migrations | D | I | I | I |
| Docker Compose & Infrastructure | D | S | | |
| System Testing & QA | D | S | S | S |
| Final Report & Demo | D | S | S | S |

## 5. Project Communications

| Communication | Audience | Purpose | Frequency | Format |
|--------------|----------|---------|-----------|--------|
| Sprint Planning | Toàn bộ thành viên | Xác định sprint backlog, phân công | 2 tuần/lần (Thứ Hai) | Google Meet |
| Daily Standup | Toàn bộ thành viên | Chia sẻ tiến độ, vấn đề | Hàng ngày (15 phút, async) | Discord text |
| Sprint Review & Retro | Thành viên + GVHD | Demo, đánh giá quy trình | 2 tuần/lần (Thứ Sáu) | Google Meet |
| Supervisor Meeting | Leader + GVHD | Báo cáo tiến độ, nhận hướng dẫn | Hàng tuần hoặc 2 tuần/lần | Trực tiếp / Google Meet |
| Code Review | Developer + Reviewer | Đảm bảo chất lượng code | Theo từng PR | GitHub Pull Request |
| Technical Discussion | Developers liên quan | Thảo luận thiết kế, debug | Khi cần | Discord voice / thread |

## 6. Configuration Management

### 6.1 Document Management

- Toàn bộ tài liệu dự án lưu trữ trong Git repository dưới `docs/capstone/`.
- `specs/` — Technical specifications.
- `reports/` — Báo cáo capstone (Markdown, chuyển đổi sang DOCX khi cần).
- `diagrams/` — Sơ đồ (sources + rendered images).
- Quản lý phiên bản qua Git commit với semantic commit messages.

### 6.2 Source Code Management

- **Repository:** Monorepo duy nhất chứa cả ba ứng dụng (`apps/backend`, `apps/frontend`, `apps/grading`).
- **Branching strategy:** Feature branch từ `main`, merge qua pull request. Đặt tên: `feat/<feature>`, `fix/<bug>`, `docs/<topic>`.
- **Commit convention:** Conventional commits có scope — `feat(backend):`, `fix(grading):`, `docs:`.
- **Code style:** Enforced tự động bằng linter. Mọi code phải pass trước khi merge.
- **Secret management:** File `.env` được git-ignore, validate lúc startup.

### 6.3 Tools & Infrastructure

| Category | Tool |
|----------|------|
| Backend | Bun + Elysia + Drizzle ORM |
| Frontend | React 19 + Vite 7 + TypeScript |
| Grading | Python + FastAPI + Redis Streams worker |
| Database | PostgreSQL 17 |
| Queue / Cache | Redis 7 |
| AI Provider | OpenAI GPT-4o (primary), Cloudflare Workers AI Llama 3.3 70B (fallback), Cloudflare STT (Deepgram Nova-3) |
| IDE | Visual Studio Code, Cursor |
| Linter | Biome (TypeScript) |
| Testing | bun:test (backend), pytest (grading) |
| Diagrams | Draw.io, Mermaid |
| Version Control | Git + GitHub (monorepo) |
| Containers | Docker Compose (PostgreSQL, Redis) |
| Project Management | GitHub Issues, GitHub Projects |
| Communication | Discord (daily), Google Meet (sprint ceremonies) |
| API Documentation | OpenAPI (auto-generated from route schemas) |
