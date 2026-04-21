---
name: wiki
description: "Project knowledge base: past mistakes, architecture decisions, patterns learned. Search here BEFORE writing code to avoid repeating known issues."
---

# Wiki

Knowledge base tại `.agents/wiki/`. Mỗi file là 1 topic chứa kiến thức đã học.

## Khi nào search

- Trước khi viết code mới cho feature đã có
- Khi gặp lỗi type, auth, API, layout
- Khi không chắc pattern nào đúng
- Khi refactor hoặc thêm convention mới

## Cách search

1. Grep keyword trong wiki:
   ```
   Grep { pattern: "keyword", path: ".agents/wiki", include: "*.md" }
   ```
2. Đọc file match
3. Follow `[[cross-references]]` trong file để đọc thêm context liên quan

## Cross-references

Wiki files link nhau bằng `[[filename]]` (không có .md). Khi đọc 1 file thấy `[[auth-architecture]]` → đọc thêm `.agents/wiki/auth-architecture.md`.

## Khi nào ghi thêm

- Fix bug mà root cause không obvious
- Phát hiện anti-pattern mới
- Research được pattern/convention mới
- Quyết định architecture quan trọng
- Học được cách dùng library/API mới

## Cách ghi

1. Tìm file wiki phù hợp, hoặc tạo mới nếu topic chưa có
2. Thêm entry theo format: `## Heading` → `**Sai:**` → `**Đúng:**`
3. Thêm `[[cross-references]]` đến wiki files liên quan
4. Append vào `.agents/wiki/LOG.md`: `- YYYY-MM-DD: mô tả ngắn thay đổi`
