# [Mobile] Placement test flow (SRS FE-02)

**Labels:** `app:backend`, `app:mobile`, `type:feature`, `priority:high`

---

## Mô tả

SRS FE-02 (§3.3) yêu cầu **bài kiểm tra đầu vào** (placement test) cho người học mới để xác định trình độ ban đầu. Hiện tại backend **không có** bất kỳ endpoint hay module nào liên quan đến placement test.

### SRS yêu cầu (§3.3.1–3.3.2)

**Start Placement Test:**
- Chọn câu hỏi cân bằng across skills và difficulty levels
- Tạo placement session

**Submit Placement Test:**
- Auto-grade Listening/Reading via answer key
- Tạo Writing/Speaking submissions cho AI grading
- Tính initial per-skill bands (A1–C1)
- Khởi tạo `user_progress` records
- Khởi tạo Spider Chart data

### Hiện trạng

- Grep toàn bộ backend: zero references đến "placement"
- Không có module, route, hay service function nào
- Mobile onboarding hiện chỉ hỏi self-assessment (chọn band mong muốn) — không có test thực tế
- Hệ thống adaptive **không có dữ liệu ban đầu** để hoạt động chính xác

### Đề xuất

```
POST /api/placement/start     🔒 Auth required
POST /api/placement/submit    🔒 Auth required
```

**Phương án đơn giản hơn:** Sử dụng exam flow hiện có, đánh dấu 1 exam là "placement exam" → sau submit, tính initial levels thay vì chỉ ghi scores.

### Ảnh hưởng
- Mobile: thêm placement flow sau onboarding hoặc thay thế onboarding
- Frontend: tương tự
- Grading: cần handle placement submissions cho W/S

### Tham chiếu SRS
- FE-02 §3.3.1–3.3.2
