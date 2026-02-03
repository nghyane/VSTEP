# API Endpoint Catalog

> **Phiên bản**: 1.0 · SP26SE145

## 1. Tổng quan

Tất cả API endpoints của Bun Main Application (Elysia framework). Giao tiếp theo kiểu REST, resource-oriented. Response body dạng JSON.

Quy ước path:
- Tất cả paths trong bảng là **relative** tới base `/api`.
- Exception: health check là `GET /health` (không nằm dưới `/api`).

**Quy ước chung**:
- Xác thực qua JWT Bearer token trong header `Authorization`, trừ các endpoint public
- Rate limiting áp dụng theo tier (xem `../40-platform/rate-limiting.md`)
- Quy ước API chung: xem `api-conventions.md`
- Tất cả error responses theo format chuẩn (xem `errors.md`)
- Tất cả list endpoints hỗ trợ offset pagination với `page`, `limit`, trả về `pagination.total` và `pagination.totalPages`

---

## 2. Resources

### 2.1 Authentication

Quản lý đăng ký, đăng nhập, token lifecycle. Chi tiết flow: xem `../40-platform/authentication.md`.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /auth/register | Không | Tạo tài khoản mới với email, password, tên hiển thị. Trả về thông tin user (không trả token — user phải login sau). |
| POST | /auth/login | Không | Xác thực email/password. Trả về cặp access token + refresh token, thông tin user cơ bản. |
| POST | /auth/refresh | Refresh token | Rotate refresh token: thu hồi token cũ, cấp cặp token mới. Gửi refresh token trong body. |
| POST | /auth/logout | Có | Thu hồi refresh token hiện tại. Client gửi refresh token cần revoke. |
| GET | /auth/me | Có | Trả về thông tin user từ access token claims (id, email, role, displayName). |

### 2.2 Submissions

Nộp bài và theo dõi kết quả. Chi tiết lifecycle: xem `../20-domain/submission-lifecycle.md`.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /submissions | Learner+ | Nộp bài writing/speaking. Tạo submission và enqueue grading async. Trả về submission ID, status PENDING, SLA deadline, SSE URL. |
| GET | /submissions | Learner+ | Danh sách submissions của user hiện tại. Filter theo skill, status. Sắp xếp theo ngày tạo giảm dần. |
| GET | /submissions/:id | Owner | Chi tiết submission: status, result (nếu COMPLETED), error (nếu FAILED). Chỉ owner mới xem được. |
| GET | /submissions/:id/status | Owner | Polling fallback khi SSE không khả dụng. Trả về status hiện tại và progress (nếu đang xử lý). |

**Lưu ý**: Listening/Reading submissions được auto-grade ngay (so sánh answer_key) — không đi qua grading queue. Writing/Speaking submissions đi qua outbox → RabbitMQ → Grading Service.

### 2.3 Questions

Ngân hàng câu hỏi. Admin/Instructor quản lý nội dung.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /questions | Có | Danh sách câu hỏi. Filter theo skill, level (A1-C1), type (essay, email, mcq, v.v.). |
| GET | /questions/:id | Có | Chi tiết một câu hỏi: nội dung, rubric (nếu writing/speaking), answer_key (chỉ khi đã submit). |
| POST | /questions | Admin/Instructor | Tạo câu hỏi mới. Bao gồm skill, level, type, nội dung, rubric hoặc answer_key. |
| PUT | /questions/:id | Admin/Instructor | Cập nhật câu hỏi. |
| DELETE | /questions/:id | Admin | Soft delete (đánh dấu is_active = false). |

### 2.4 Progress

Tiến độ học tập. Dữ liệu được tính từ submission history.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /progress | Learner+ | Tổng quan progress 4 skills: level hiện tại, target level, scaffold stage, điểm trung bình, tổng attempts. |
| GET | /progress/:skill | Learner+ | Chi tiết progress một skill: sliding window scores, trend (improving/stable/declining), scaffold stage. |
| GET | /progress/spider-chart | Learner+ | Data cho spider chart: normalized scores 4 skills, historical comparison. |

### 2.5 Goals

Mục tiêu học tập của learner.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /goals | Learner+ | Goal hiện tại của user (target level, target date, trạng thái đạt/chưa). |
| POST | /goals | Learner+ | Thiết lập goal mới (target level, target date tùy chọn). |
| PUT | /goals/:id | Owner | Cập nhật goal (thay đổi target hoặc deadline). |

### 2.6 Mock Tests

Thi thử giả lập full 4 skills.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /mock-tests | Có | Danh sách mock tests khả dụng. Filter theo level. |
| GET | /mock-tests/:id | Có | Chi tiết mock test: 4 sections, thời gian, số câu hỏi. |
| POST | /mock-tests/:id/start | Learner+ | Bắt đầu session thi thử. Tạo mock_test_session, trả về session ID. |
| PUT | /mock-tests/sessions/:id | Owner | Cập nhật answers (auto-save mỗi 30 giây từ client). |
| POST | /mock-tests/sessions/:id/submit | Owner | Nộp bài thi. Auto-grade listening/reading ngay, tạo submissions cho writing/speaking. |
| GET | /mock-tests/sessions/:id | Owner | Trạng thái session: IN_PROGRESS, SUBMITTED, SCORED. Kết quả per skill khi SCORED. |
| POST | /mock-tests | Admin | Tạo mock test mới (cấu hình sections, questions, time limits). |

### 2.7 SSE

Real-time status updates. Chi tiết: xem `sse.md`.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /sse/submissions/:id | Query param token | SSE stream cho submission status. Events: progress, completed, failed, ping. |

### 2.8 Admin

Quản trị hệ thống. Instructor có quyền human review. Admin có full access.

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /admin/users | Admin | Danh sách users. Filter theo role, search theo email/name. |
| PUT | /admin/users/:id/role | Admin | Thay đổi role user (learner ↔ instructor ↔ admin). |
| GET | /admin/submissions/pending-review | Instructor+ | Danh sách submissions cần human review (confidence < 85%). Sắp xếp theo priority. |
| PUT | /admin/submissions/:id/review | Instructor+ | Gửi kết quả human review. Rule override: scoreDiff > 0.5 hoặc bandStepDiff > 1 (xem `../20-domain/hybrid-grading.md`). |

### 2.9 Health

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /health | Không | Health check: kết nối DB, Redis, RabbitMQ. Exempt khỏi rate limiting. |

---

## 3. Error Codes

Tất cả error responses sử dụng bộ mã lỗi thống nhất:

| HTTP Status | Code | Mô tả |
|-------------|------|-------|
| 400 | VALIDATION_ERROR | Input không hợp lệ (thiếu field, sai format, giá trị ngoài range) |
| 401 | UNAUTHORIZED | Thiếu token hoặc token không hợp lệ |
| 401 | TOKEN_EXPIRED | Access token hết hạn, cần refresh |
| 403 | FORBIDDEN | Không đủ quyền (role không phù hợp hoặc không phải owner) |
| 404 | NOT_FOUND | Resource không tồn tại |
| 409 | CONFLICT | Xung đột dữ liệu (email đã tồn tại, duplicate submission) |
| 429 | RATE_LIMITED | Vượt quá rate limit. Response kèm header Retry-After |
| 500 | INTERNAL_ERROR | Lỗi server không mong đợi |

---

## 4. Cross-references

| Chủ đề | Tài liệu |
|--------|-----------|
| API conventions | `api-conventions.md` |
| Error format & codes | `errors.md` |
| Authentication flow | `../40-platform/authentication.md` |
| Rate limiting chi tiết | `../40-platform/rate-limiting.md` |
| SSE behavior | `sse.md` |
| Submission states | `../20-domain/submission-lifecycle.md` |
| Database entities | `../30-data/database-schema.md` |
| Queue contracts | `queue-contracts.md` |
