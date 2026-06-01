---
name: rfc
description: "Tạo, cập nhật, hoặc implement RFC cho frontend-v2. Use when user says 'tạo rfc', 'viết rfc', 'implement rfc', 'update rfc', 'rfc status', or when a cross-cutting UI/UX change needs formal spec before coding."
---

# RFC Workflow — frontend-v2

## Source of truth

- `docs/rfcs/README.md` — index với status hiện tại
- `docs/rfcs/0000-template.md` — template chuẩn

Luôn đọc 2 file này trước khi tạo hoặc cập nhật RFC.

## Khi nào cần RFC

**Cần RFC:**
- Thay đổi design token, color system, typography scale
- Thay đổi layout convention (max-width, spacing, radius)
- Thay đổi flow navigation giữa các trang
- Thêm/sửa hệ thống cross-cutting (coin, streak, notification)
- Breaking change UX pattern (card style, form pattern)

**Không cần RFC:**
- Sửa bug UI cục bộ
- Thêm component mới không ảnh hưởng convention
- Cập nhật mock data
- Sửa wording/copy

## Tạo RFC mới

1. Đọc `docs/rfcs/README.md` → tìm số tiếp theo.
2. Copy `docs/rfcs/0000-template.md` → `docs/rfcs/NNNN-short-name.md`.
3. Điền metadata: `Status: Draft`, ngày tạo.
4. Điền Summary, Motivation, chi tiết thay đổi.
5. **Liệt kê violations cụ thể** — file nào, dòng nào, hiện tại là gì, nên đổi thành gì.
6. Thêm Implementation status checklist.
7. Cập nhật table trong `docs/rfcs/README.md`.

## Cập nhật RFC

- Đổi `Updated` date.
- Đổi `Status` khi state thay đổi.
- Tick checkbox trong Implementation status khi code xong.

## Status values

| Status | Nghĩa |
|---|---|
| `Draft` | Đang thảo luận, chưa accept |
| `Accepted` | Đã duyệt, đang implement |
| `Implemented` | Đã ship hết |
| `Superseded` | Bị thay thế bởi RFC khác |
| `Withdrawn` | Không làm nữa |

## Implement RFC

1. Đọc RFC, hiểu scope.
2. Làm theo thứ tự priority trong checklist.
3. Mỗi file sửa xong → verify bằng `grep` không còn violation.
4. Tick checkbox trong RFC.
5. Khi tất cả checkbox done → đổi status sang `Implemented`.

## Convention

- RFC nên viết tiếng Việt (match codebase comments).
- Violation list phải có: file path, giá trị hiện tại, giá trị nên đổi.
- Không RFC cho brainstorming — phải có evidence từ code scan.
