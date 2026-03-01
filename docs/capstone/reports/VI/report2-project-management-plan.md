# Báo Cáo Đồ Án Capstone

## Report 2 — Kế Hoạch Quản Lý Dự Án

**Tên dự án**: Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa

**Mã dự án**: SP26SE145 · Nhóm: GSP26SE63

**Thời gian**: 01/01/2026 – 30/04/2026

— Hà Nội, tháng 03/2026 —

---

# I. Lịch Sử Thay Đổi

\*A — Thêm mới · M — Chỉnh sửa · D — Xóa

| Ngày | A/M/D | Người phụ trách | Mô tả thay đổi |
|------|-------|-----------------|-----------------|
| 01/01/2026 | A | Nghĩa (Leader) | Kế hoạch dự án ban đầu, WBS, sổ đăng ký rủi ro |
| 15/01/2026 | A | Nghĩa | Thêm ma trận trách nhiệm và kế hoạch truyền thông |
| 01/02/2026 | M | Nghĩa | Cập nhật ước lượng sau khi có baseline velocity Sprint 1 |
| 15/02/2026 | M | Khôi | Điều chỉnh các phase backend — loại bỏ Rate Limiting, Circuit Breaker, Admin/Observability, Data Retention (ngoài phạm vi capstone) |
| 01/03/2026 | M | Nghĩa | Cập nhật lịch bàn giao sau khi hoàn thành Phase 1–3 |

---

# II. Kế Hoạch Quản Lý Dự Án

## 1. Tổng Quan

### 1.1 Phạm vi & Ước lượng

| # | Hạng mục WBS | Độ phức tạp | Effort ước lượng (man-day) |
|---|-------------|-------------|---------------------------|
| **1** | **Xác thực & Phân quyền** | | **18** |
| 1.1 | Đăng ký & đăng nhập (email/password) | Trung bình | 4 |
| 1.2 | Vòng đời JWT access/refresh token (rotation, phát hiện tái sử dụng, tối đa 3 thiết bị) | Phức tạp | 7 |
| 1.3 | Middleware RBAC (learner/instructor/admin) | Trung bình | 4 |
| 1.4 | Quản lý hồ sơ (GET /auth/me, cập nhật profile) | Đơn giản | 3 |
| **2** | **Ngân hàng câu hỏi** | | **14** |
| 2.1 | CRUD câu hỏi (4 kỹ năng × nhiều định dạng, nội dung JSONB) | Trung bình | 5 |
| 2.2 | Validation nội dung câu hỏi (Zod schema theo từng kỹ năng) | Trung bình | 4 |
| 2.3 | Pipeline nạp dữ liệu mẫu (JSON → DB với schema validation) | Đơn giản | 3 |
| 2.4 | Quản lý phiên bản câu hỏi | Đơn giản | 2 |
| **3** | **Nộp bài & Chấm tự động** | | **22** |
| 3.1 | CRUD submission với máy trạng thái 5 trạng thái (pending/processing/completed/review_pending/failed) | Phức tạp | 7 |
| 3.2 | Chấm tự động Nghe/Đọc (so sánh answer key, tính điểm) | Trung bình | 5 |
| 3.3 | Tích hợp Redis queue — LPUSH grading tasks cho Viết/Nói | Trung bình | 5 |
| 3.4 | Chi tiết submission (lưu trữ answer/result dạng JSONB) | Đơn giản | 3 |
| 3.5 | Endpoint polling fallback (GET /submissions/:id/status) | Đơn giản | 2 |
| **4** | **Dịch vụ chấm điểm AI (Python)** | | **25** |
| 4.1 | Pipeline chấm Viết (LLM rubric prompt → điểm 4 tiêu chí + nhận xét) | Phức tạp | 8 |
| 4.2 | Pipeline chấm Nói (Whisper STT → LLM đánh giá → điểm 4 tiêu chí) | Phức tạp | 8 |
| 4.3 | Vòng lặp worker Redis BRPOP với retry (tối đa 3 lần) và dead letter queue | Trung bình | 5 |
| 4.4 | Định tuyến theo confidence (high → completed, medium/low → review_pending) | Đơn giản | 2 |
| 4.5 | Quy đổi điểm → band và lưu kết quả vào PostgreSQL | Đơn giản | 2 |
| **5** | **Quy trình chấm thủ công** | | **12** |
| 5.1 | Endpoint hàng đợi review (sắp xếp theo priority, FIFO) | Trung bình | 3 |
| 5.2 | Cơ chế claim/release (Redis distributed lock, TTL 15 phút) | Trung bình | 4 |
| 5.3 | Gửi kết quả review với merge rules (điểm instructor là cuối cùng, audit flag) | Trung bình | 3 |
| 5.4 | Audit trail (lưu giữ kết quả AI + kết quả instructor) | Đơn giản | 2 |
| **6** | **Thi thử giả lập** | | **18** |
| 6.1 | CRUD exam blueprint (cấu trúc 4 phần, chọn câu hỏi) | Trung bình | 4 |
| 6.2 | Vòng đời exam session (bắt đầu → tự lưu → nộp bài → hoàn thành) | Phức tạp | 6 |
| 6.3 | Nộp bài thi: chấm tự động Nghe/Đọc, tạo submission cho Viết/Nói, tổng hợp điểm | Phức tạp | 6 |
| 6.4 | Endpoint chi tiết đề thi và kết quả session | Đơn giản | 2 |
| **7** | **Theo dõi tiến độ & Trực quan hóa** | | **16** |
| 7.1 | Tính toán sliding window (N=10, theo từng kỹ năng, avg/stddev) | Trung bình | 4 |
| 7.2 | Phân loại xu hướng (improving/stable/declining/inconsistent) | Trung bình | 3 |
| 7.3 | Endpoint dữ liệu spider chart (current/trend/confidence theo kỹ năng) | Trung bình | 3 |
| 7.4 | Xác định overall band (min của 4 kỹ năng) | Đơn giản | 2 |
| 7.5 | Heuristic ước lượng ETA (linear regression, theo kỹ năng và tổng thể) | Trung bình | 4 |
| **8** | **Adaptive Scaffolding** | | **10** |
| 8.1 | Engine chuyển đổi stage (Viết: Template→Keywords→Free, Nghe: FullText→Highlights→PureAudio) | Trung bình | 4 |
| 8.2 | Gán stage ban đầu dựa trên trình độ | Đơn giản | 2 |
| 8.3 | Theo dõi micro-hints và rule chặn level-up | Đơn giản | 2 |
| 8.4 | Tích hợp trigger khi submission hoàn thành | Đơn giản | 2 |
| **9** | **Thiết lập mục tiêu** | | **6** |
| 9.1 | CRUD goal (target band, deadline, thời gian học hàng ngày) | Đơn giản | 3 |
| 9.2 | Tính toán trạng thái goal (achieved, onTrack, daysRemaining) | Đơn giản | 3 |
| **10** | **Quản lý lớp học** | | **10** |
| 10.1 | CRUD lớp học với mã mời | Trung bình | 3 |
| 10.2 | Quản lý thành viên lớp (tham gia/rời/xóa) | Đơn giản | 3 |
| 10.3 | Dashboard giảng viên và phản hồi | Trung bình | 4 |
| **11** | **Frontend (Ứng dụng Web)** | | **30** |
| 11.1 | Trang xác thực (đăng nhập, đăng ký, hồ sơ) | Trung bình | 4 |
| 11.2 | Giao diện chế độ luyện tập (4 kỹ năng với scaffolding) | Phức tạp | 8 |
| 11.3 | Giao diện thi thử (đề thi có giới hạn thời gian, tự lưu) | Phức tạp | 6 |
| 11.4 | Dashboard tiến độ (spider chart, xu hướng, ETA) | Trung bình | 5 |
| 11.5 | Giao diện review cho giảng viên | Trung bình | 4 |
| 11.6 | Đồng bộ type từ backend và tích hợp API | Đơn giản | 3 |
| **12** | **Hạ tầng & DevOps** | | **8** |
| 12.1 | Docker Compose (PostgreSQL + Redis) | Đơn giản | 2 |
| 12.2 | Pipeline nạp dữ liệu mẫu vào database | Đơn giản | 3 |
| 12.3 | Thiết lập CI và triển khai | Đơn giản | 3 |
| **13** | **Kiểm thử & QA** | | **15** |
| 13.1 | Integration tests backend (auth, submissions, exams, progress, classes, review) | Trung bình | 6 |
| 13.2 | Unit tests backend (scoring, state machine, scaffolding) | Đơn giản | 3 |
| 13.3 | Tests dịch vụ chấm điểm (scoring, model validation) | Đơn giản | 3 |
| 13.4 | Kiểm thử hệ thống và UAT | Trung bình | 3 |
| | **Tổng Effort Ước Lượng (man-day)** | | **204** |

### 1.2 Mục tiêu dự án

**Mục tiêu tổng quát**: Xây dựng nền tảng ôn luyện VSTEP thích ứng, kết hợp chấm điểm AI, duyệt bài thủ công và học tập cá nhân hóa nhằm giúp người học Việt Nam nâng cao hiệu quả cả 4 kỹ năng tiếng Anh (Nghe, Đọc, Viết, Nói).

**Chỉ tiêu chất lượng**:

| Chỉ tiêu | Mục tiêu |
|----------|----------|
| Tỷ lệ milestone đúng hạn | >= 90% milestone bàn giao đúng tiến độ |
| Tỷ lệ lỗi thoát ra production | < 5% tổng số lỗi phát hiện sau triển khai |
| Độ chính xác chấm AI (so với giám khảo) | >= 85% tương đồng (trong biên độ 0.5 điểm) |
| Độ phủ kiểm thử (backend integration) | >= 80% API endpoints được kiểm thử |
| Chất lượng mã nguồn | Toàn bộ mã nguồn pass `bun run check` (Biome lint/format, không lỗi) |

**Phân bổ effort theo hoạt động**:

| Hoạt động | Man-day | % |
|-----------|---------|---|
| Phân tích yêu cầu & Thiết kế | 20 | 9,8% |
| Lập trình (Backend + Frontend + Grading) | 110 | 53,9% |
| Kiểm thử & QA | 30 | 14,7% |
| Quản lý dự án & Tài liệu | 24 | 11,8% |
| Triển khai & Hạ tầng | 10 | 4,9% |
| Dự phòng (Buffer) | 10 | 4,9% |
| **Tổng** | **204** | **100%** |

### 1.3 Rủi ro dự án

| # | Mô tả rủi ro | Tác động | Khả năng xảy ra | Kế hoạch ứng phó |
|---|--------------|----------|-----------------|------------------|
| 1 | Nhà cung cấp LLM/STT (Groq, OpenAI) bị rate limit hoặc downtime gây trễ chấm điểm | Cao | Trung bình | Sử dụng LiteLLM router với hỗ trợ fallback model. Worker retry (tối đa 3 lần, exponential backoff). Dead letter queue cho các lỗi liên tục. |
| 2 | Chất lượng chấm AI không đủ tốt cho kỹ năng Viết/Nói | Cao | Trung bình | Định tuyến theo confidence: low/medium → hàng đợi review giảng viên. Audit flag theo dõi chênh lệch điểm AI vs. giảng viên để cải thiện mô hình. |
| 3 | Thành viên thiếu kinh nghiệm với Bun/Elysia/Drizzle | Trung bình | Cao | Kế hoạch đào tạo (Tuần 1-2). Leader review code và pair programming. Technical specs viết trước khi code. |
| 4 | Độ phức tạp schema JSONB gây không nhất quán dữ liệu | Trung bình | Trung bình | Zod validation tại API boundary. Seed data được validate theo schema. Schema nội dung câu hỏi được tài liệu hóa trong specs. |
| 5 | Phình phạm vi — tính năng Phase 2 lấn vào thời gian phát triển lõi | Cao | Trung bình | Phân tách phase nghiêm ngặt (Phase 1: MVP tuần 1-10/Sprint 1-5, Phase 2: nâng cao tuần 11-14/Sprint 6-7). Tính năng FE-12 đến FE-16 hoãn rõ ràng. Các phase Rate Limiting, Circuit Breaker, Observability, Data Retention bị loại khỏi phạm vi capstone. |
| 6 | Vấn đề tích hợp giữa Bun Main App và Python Grading Worker | Trung bình | Trung bình | Kiến trúc Shared-DB (cả hai service ghi cùng PostgreSQL). Redis queue contract được định nghĩa trong specs. Integration test sớm từ Sprint 3. |
| 7 | Xử lý file âm thanh cho đánh giá Nói (upload, lưu trữ, phiên âm) | Trung bình | Thấp | Sử dụng pre-signed URL cho upload audio. Whisper transcription qua LiteLLM với Redis caching (tránh phiên âm lại). |

---

## 2. Phương Pháp Quản Lý

### 2.1 Quy trình dự án

Nhóm áp dụng quy trình **Agile dựa trên Scrum** với sprint 2 tuần, điều chỉnh cho timeline capstone:

```
Sprint Planning → Phát triển → Code Review → Kiểm thử → Sprint Review → Retrospective
    (Ngày 1)      (Ngày 2-9)    (liên tục)   (Ngày 8-10)   (Ngày 10)     (Ngày 10)
```

**Mô hình phát triển 2 giai đoạn** (tổng thời lượng: 4 tháng — 14 tuần — 7 sprint):

- **Phase 1 — MVP (Tuần 1-10, Sprint 1-5)**: 11 tính năng cốt lõi (FE-01 đến FE-11), tập trung vào trải nghiệm học tập và pipeline chấm điểm AI
- **Phase 2 — Nâng cao (Tuần 11-14, Sprint 6-7)**: 5 tính năng quản trị và hỗ trợ (FE-12 đến FE-16) sau khi tính năng cốt lõi ổn định

**Các phase triển khai Backend** (từ implementation roadmap):

```
Phase 1 (Củng cố nền tảng)
├── Phase 2 (Vòng đời Submission & Chấm tự động)
│   ├── Phase 4 (Engine tính toán tiến độ)
│   │   └── Phase 5 (Adaptive Scaffolding)
│   ├── Phase 6 (SSE thông báo realtime)
│   └── Phase 7 (Redis Queue + tích hợp Grading Worker)
│       ├── Phase 8 (Quy trình chấm thủ công)
│       └── Phase 9 (Chấm điểm & vòng đời Exam)
└── Phase 3 (Module mục tiêu) — có thể song song với Phase 2
```

Các tính năng Rate Limiting, Circuit Breaker, Admin & Observability, Data Retention **bị loại bỏ** — ngoài phạm vi capstone.

### 2.2 Quản lý chất lượng

**Phòng ngừa lỗi (Defect Prevention)**:
- Technical specs viết trước khi triển khai (20 file spec bao gồm domain rules, API contracts, data schemas, platform concerns)
- Code style được enforced bởi Biome linter (`bun run check`) với các rule nghiêm ngặt: `noConsole`, `noImportCycles`, `useNamingConvention`, `noNonNullAssertion`
- Zod schemas validate toàn bộ input tại API boundary — nguyên tắc "Parse, Don't Validate"

**Review mã nguồn (Code Review)**:
- Mọi thay đổi mã nguồn phải qua pull request review trước khi merge vào main
- Reviewer kiểm tra: tuân thủ CODE_STYLE.md (5 luật), chuyển trạng thái đúng, xử lý lỗi đúng cách (throw, không return)
- Cấu trúc hàm được enforced: guard → compute → write (không xen kẽ)

**Kiểm thử đơn vị (Unit Testing)**:
- Unit test backend nằm cạnh file source (ví dụ: `scoring.test.ts`, `state-machine.test.ts`, `helpers.test.ts`)
- Test dịch vụ chấm điểm (`test_scoring.py`, `test_models.py`)
- Chạy: `bun test src/` (backend), `pytest` (grading)

**Kiểm thử tích hợp (Integration Testing)**:
- Integration test backend trong thư mục `tests/` gọi app trực tiếp qua `app.handle()`
- Test factory: `createTestUser`, `createTestQuestion`, `createTestExam`, `createTestClass`
- Phạm vi: auth flows, vòng đời submissions, exam sessions, theo dõi tiến độ, quản lý lớp, review workflow
- Chạy: `bun test tests/`

**Kiểm thử hệ thống (System Testing)**:
- Kiểm thử end-to-end toàn bộ pipeline chấm điểm: submission → Redis queue → AI grading → lưu kết quả → SSE notification
- Tích hợp cross-service: Backend ↔ Grading Worker ↔ PostgreSQL

| # | Giai đoạn kiểm thử | Phạm vi | Số lỗi | % Lỗi | Ghi chú |
|---|-------------------|---------|--------|--------|---------|
| 1 | Code Review | Tất cả PR | — | — | Biome lint + review thủ công |
| 2 | Unit Test | Scoring, state machine, scaffolding, auth helpers | — | — | `bun test src/`, `pytest` |
| 3 | Integration Test | 8 bộ test (auth, users, questions, submissions, exams, progress, classes, review) | — | — | `bun test tests/` |
| 4 | System Test | Toàn bộ pipeline chấm điểm, luồng cross-service | — | — | Thủ công + tự động |
| 5 | Acceptance Test | Kiểm thử chấp nhận theo tiêu chí specs | — | — | Theo tiêu chí chấp nhận từng phase |

*Ghi chú: Số lỗi sẽ được cập nhật trong quá trình thực hiện.*

### 2.3 Kế hoạch đào tạo

| Lĩnh vực đào tạo | Người tham gia | Thời gian, Thời lượng | Điều kiện miễn |
|------------------|----------------|----------------------|----------------|
| Bun runtime + Elysia framework | Khôi, Phát (NN), Phát (NTT) | Tuần 1-2, 3 ngày | Có kinh nghiệm Elysia trước đó |
| Drizzle ORM + PostgreSQL | Khôi, Phát (NN), Phát (NTT) | Tuần 1-2, 2 ngày | Bắt buộc |
| TypeBox schema validation | Khôi | Tuần 2, 1 ngày | Bắt buộc |
| Python FastAPI + LiteLLM | Phát (NTT) | Tuần 1-2, 3 ngày | Có kinh nghiệm FastAPI trước đó |
| React 19 + Vite 7 | Phát (NN) | Tuần 1, 2 ngày | Có kinh nghiệm React trước đó |
| Luồng xác thực JWT | Tất cả developers | Tuần 2, 1 ngày | Bắt buộc |
| Git workflow (branching, PR review) | Tất cả thành viên | Tuần 1, 0,5 ngày | Bắt buộc |

---

## 3. Sản Phẩm Bàn Giao

| # | Sản phẩm bàn giao | Ngày hạn | Ghi chú |
|---|-------------------|----------|---------|
| 1 | Report 1 — Giới thiệu dự án | 15/01/2026 | Đã nộp |
| 2 | Report 2 — Kế hoạch quản lý dự án | 01/02/2026 | Tài liệu này |
| 3 | Technical Specifications (20 file spec) | 15/01/2026 | Domain, contracts, data, platform, ops |
| 4 | Database Schema (Drizzle ORM + migrations) | 31/01/2026 | PostgreSQL tables, enums, indexes |
| 5 | Sprint 1-2: Nền tảng + Auth + Questions + Submissions | 28/02/2026 | Backend Phases 1-3 |
| 6 | Sprint 3-4: Dịch vụ chấm AI + Chấm tự động + Review | 15/03/2026 | Grading worker + quy trình chấm thủ công |
| 7 | Sprint 5: Theo dõi tiến độ + Scaffolding + Exams + Frontend MVP | 31/03/2026 | Backend Phases 4-5, 9 + Frontend cốt lõi |
| 8 | Report 3 — Tài liệu SRS | 15/03/2026 | Đặc tả yêu cầu phần mềm |
| 9 | Sprint 6-7: Tính năng nâng cao + Kiểm thử hệ thống | 15/04/2026 | Tính năng Phase 2 (FE-12 đến FE-16) |
| 10 | Báo cáo cuối + Demo | 30/04/2026 | Thuyết trình cuối và triển khai |

---

## 4. Phân Công Trách Nhiệm

D — Thực hiện · R — Review · S — Hỗ trợ · I — Được thông báo · (trống) — Không liên quan

| Trách nhiệm | Nghĩa (Leader) | Khôi (Dev 1) | Phát NN (Dev 2) | Phát NTT (Dev 3) |
|-------------|:---:|:---:|:---:|:---:|
| Lập kế hoạch & Theo dõi dự án | D | S | I | I |
| Technical Specifications (specs/) | R | D | S | S |
| Report 1 — Giới thiệu dự án | D | S | S | S |
| Report 2 — Kế hoạch quản lý dự án | D | R | I | I |
| Report 3 — Tài liệu SRS | D | S | S | R |
| Backend: Module Auth | S | D | | |
| Backend: Module Questions | S | D | | |
| Backend: Module Submissions & State machine | R | D | | |
| Backend: Module Exams | S | D | | |
| Backend: Module Progress & Scaffolding | R | D | | |
| Backend: Quy trình chấm thủ công | S | D | | |
| Backend: Module Goals & Classes | S | D | | |
| Backend: Integration Tests | R | D | S | |
| Frontend: Trang xác thực & Hồ sơ | | S | D | |
| Frontend: Giao diện chế độ luyện tập | | S | D | |
| Frontend: Giao diện thi thử | | S | D | |
| Frontend: Dashboard tiến độ | | S | D | |
| Frontend: Giao diện review giảng viên | | S | D | |
| Grading: Pipeline chấm Viết | | S | | D |
| Grading: Pipeline chấm Nói (STT + LLM) | | S | | D |
| Grading: Redis worker + retry logic | | S | | D |
| Grading: Unit tests | | | | D |
| Database Schema & Migrations | R | D | I | I |
| Pipeline nạp dữ liệu mẫu | S | D | | |
| Docker Compose & Hạ tầng | S | D | | S |
| Kiểm thử hệ thống & QA | D | S | S | S |
| Báo cáo cuối & Demo | D | S | S | S |

---

## 5. Truyền Thông Dự Án

| Nội dung truyền thông | Đối tượng | Mục đích | Thời gian, Tần suất | Hình thức, Công cụ |
|-----------------------|-----------|----------|---------------------|-------------------|
| Sprint Planning | Toàn bộ thành viên | Xác định sprint backlog, phân công công việc | 2 tuần/lần (Thứ Hai) | Họp online, Google Meet |
| Daily Standup | Toàn bộ thành viên | Chia sẻ tiến độ, vấn đề gặp phải | Hàng ngày (15 phút, async trong tuần) | Cập nhật text, kênh Discord |
| Sprint Review & Retro | Toàn bộ thành viên + GVHD | Demo công việc đã hoàn thành, đánh giá quy trình | 2 tuần/lần (Thứ Sáu) | Họp online, Google Meet |
| Họp với GVHD | Leader + GVHD | Báo cáo tiến độ, nhận hướng dẫn | Hàng tuần hoặc 2 tuần/lần | Trực tiếp hoặc Google Meet |
| Code Review | Dev mở PR + Reviewer | Đảm bảo chất lượng và tuân thủ code style | Theo từng pull request | GitHub Pull Request review |
| Thảo luận kỹ thuật | Developers liên quan | Thảo luận thiết kế, debug vấn đề | Khi cần | Kênh voice Discord hoặc thread |
| Cập nhật tài liệu | Toàn bộ thành viên | Giữ specs, reports, diagrams cập nhật | Khi có thay đổi | Git commit vào `docs/` |

---

## 6. Quản Lý Cấu Hình

### 6.1 Quản lý tài liệu

- Toàn bộ tài liệu dự án được lưu trữ trong Git repository dưới `docs/capstone/`
  - `specs/` — Technical specifications (22 file, tổ chức theo 00-overview, 10-contracts, 20-domain, 30-data, 40-platform, 50-ops)
  - `reports/` — Báo cáo capstone (phiên bản ENG và VI)
  - `diagrams/` — Sơ đồ luồng và sơ đồ kiến trúc
- Quản lý phiên bản qua Git commit với semantic commit messages (prefix `docs:`)
- Phiên bản tài liệu được theo dõi ở footer mỗi file spec (ví dụ: "Document version: 2.0")
- Định dạng Markdown cho toàn bộ tài liệu (chuyển đổi sang DOCX qua `scripts/build.py` khi cần)
- Báo cáo được duy trì song ngữ Anh-Việt (`reports/ENG/`, `reports/VI/`)

### 6.2 Quản lý mã nguồn

- **Repository**: Monorepo duy nhất (`VSTEP/`) chứa cả ba ứng dụng
- **Chiến lược nhánh**: Feature branch từ `main`, merge qua pull request
  - Đặt tên nhánh: `feat/<feature>`, `fix/<bug>`, `refactor/<scope>`, `docs/<topic>`
  - Mọi merge yêu cầu PR review và pass `bun run check`
- **Cách ly ứng dụng**: Mỗi app trong `apps/<name>/` với `package.json` (backend, frontend) hoặc `requirements.txt` (grading) riêng
- **Quy ước commit**: Conventional commits có scope — `feat(backend):`, `fix(grading):`, `docs:`, `refactor(questions):`
- **Enforced code style**: Biome (TypeScript), CODE_STYLE.md (quy tắc toàn dự án)
- **Không có secret trong code**: File `.env` được git-ignore, validate lúc startup qua `t3-oss/env-core` (backend) và Pydantic Settings (grading)

### 6.3 Công cụ & Hạ tầng

| Danh mục | Công cụ / Hạ tầng |
|----------|-------------------|
| Công nghệ (Backend) | Bun + Elysia + Drizzle ORM + Zod + Jose (JWT) |
| Công nghệ (Frontend) | React 19 + Vite 7 + TypeScript |
| Công nghệ (Grading) | Python + FastAPI + LiteLLM + Redis BRPOP worker |
| Cơ sở dữ liệu | PostgreSQL 17 (dùng chung bởi Backend + Grading) |
| Queue / Cache | Redis 7 Alpine (grading queue + caching) |
| Nhà cung cấp AI | Groq (Llama 3.3 70B cho LLM, Whisper Large V3 Turbo cho STT) qua LiteLLM |
| IDE/Editor | Visual Studio Code, Cursor |
| Lint / Format | Biome (TypeScript) |
| Kiểm thử | bun:test (backend), pytest (grading) |
| Sơ đồ | Mermaid (trong Markdown), draw.io |
| Tài liệu | Markdown (quản lý bằng Git), python-docx (sinh DOCX qua `scripts/build.py`) |
| Quản lý phiên bản | Git + GitHub (monorepo) |
| Container hóa | Docker Compose (PostgreSQL, Redis cho local dev) |
| Quản lý dự án | GitHub Issues, GitHub Projects |
| Truyền thông | Discord (hàng ngày), Google Meet (sprint ceremonies) |
| Tài liệu API | OpenAPI (tự sinh từ Elysia route schemas) |
