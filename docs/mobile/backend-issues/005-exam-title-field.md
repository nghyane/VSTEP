# [Mobile] Thêm field `title` cho bảng exams

**Labels:** `app:backend`, `app:mobile`, `app:frontend`, `type:feature`, `priority:low`

---

## Mô tả

Bảng `exams` hiện chỉ có `level` (A2/B1/B2/C1) làm thông tin nhận dạng. Không có `title` hay `name` để hiển thị tên đề thi cho người dùng.

### Hiện trạng

Schema `exams` table:
```sql
id          UUID PRIMARY KEY
level       question_level NOT NULL  -- A2/B1/B2/C1
blueprint   JSONB NOT NULL
is_active   BOOLEAN DEFAULT true
created_by  UUID (FK → users)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

**Không có:** `title`, `name`, `description`

### Ảnh hưởng

- Mobile: `app/(app)/(tabs)/exams.tsx` và `app/(app)/exam/[id].tsx` chỉ hiển thị được "Đề thi B1", "Đề thi B2"
- Frontend: tương tự
- Admin: khi tạo đề thi, không có cách đặt tên cho đề

### Đề xuất

```sql
ALTER TABLE exams ADD COLUMN title VARCHAR(255);
ALTER TABLE exams ADD COLUMN description TEXT;
```

Cập nhật schemas:
- `ExamCreateBody`: thêm `title` (required), `description` (optional)
- `ExamUpdateBody`: thêm `title`, `description`
- `Exam` response: include 2 fields mới

### Effort: Nhỏ
Migration + update schema types. Không breaking change (nullable).
