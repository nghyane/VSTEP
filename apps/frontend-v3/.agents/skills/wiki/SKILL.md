---
name: wiki
description: "Project knowledge base: past mistakes, architecture decisions, patterns learned. Search here BEFORE writing code to avoid repeating known issues."
---

# Wiki

Knowledge base tại `.agents/wiki/`. Mỗi file là 1 topic.

## Khi nào search

- Trước khi viết code mới cho feature đã có
- Khi gặp lỗi type, auth, API
- Khi không chắc pattern nào đúng

## Cách search

```
Grep { pattern: "keyword", path: ".agents/wiki", include: "*.md" }
```

## Khi nào ghi thêm

- Fix bug mà root cause không obvious
- Phát hiện anti-pattern mới
- Research được pattern/convention mới
- Quyết định architecture quan trọng

Ghi vào file `.agents/wiki/{topic}.md` phù hợp, hoặc tạo file mới nếu topic chưa có.
