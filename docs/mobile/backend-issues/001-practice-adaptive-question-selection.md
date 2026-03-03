# [Mobile] Practice endpoint: adaptive question selection + scaffolding (SRS FE-03~FE-06)

**Labels:** `app:backend`, `app:mobile`, `type:feature`, `priority:high`

---

## Mô tả

SRS (FE-03 → FE-06) yêu cầu hệ thống luyện tập **adaptive** — câu hỏi phải phù hợp trình độ và cấp độ scaffolding của người học. Hiện tại backend **tính và lưu** `scaffoldLevel` trong `user_progress` nhưng **không sử dụng** khi trả câu hỏi.

### Hiện trạng

- `GET /api/questions?skill=listening&limit=10` trả về câu hỏi ngẫu nhiên, không xét trình độ
- `questions/service.ts#list()` lọc theo: `skill`, `part`, `isActive`, `knowledgePointId`, `search` — **không có `level`/`difficulty`**
- `progress/service.ts` tính `scaffoldLevel` (1–5) và lưu vào DB nhưng **không ai đọc**
- Mobile gọi `GET /api/questions?skill=X&limit=10` rồi pick ngẫu nhiên — hoàn toàn không adaptive

### SRS yêu cầu

**Listening scaffolding (FE-03 §3.4.1):**
- Stage 1: Hiển thị transcript đầy đủ bên cạnh audio
- Stage 2: Chỉ highlight key phrases
- Stage 3: Chỉ audio, không transcript

**Writing scaffolding (FE-05 §3.6.1):**
- Stage 1: Template đầy đủ với sentence starters, connectors
- Stage 2: Key phrases, transitions
- Stage 3: Không scaffold

**Scaffold progression rules:**
- Level up: avg last 3 ≥ 80%
- Keep: avg ∈ [50%, 80%)
- Level down: avg < 50% for 2 consecutive

### Đề xuất

Tạo endpoint mới:

```
GET /api/practice/next?skill=listening    🔒 Auth required
```

Processing:
1. Đọc `user_progress` → lấy `currentLevel`, `scaffoldLevel`
2. Lọc câu hỏi phù hợp trình độ
3. Biến đổi content theo scaffoldLevel
4. Trả về câu hỏi đã scaffold

Hoặc đơn giản hơn: thêm `level` filter vào `GET /api/questions` + client scaffold.

### Ảnh hưởng
- Mobile: `app/(app)/practice/[skill].tsx`
- Frontend: practice flow tương tự

### Tham chiếu SRS
- FE-03 §3.4.1, FE-05 §3.6.1, FE-06 §3.7.1
