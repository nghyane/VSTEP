---
name: refactor
description: "Phân tích và refactor codebase. Load khi cần review code structure, tìm vấn đề thiết kế, tách component, dọn dead code."
---

# Refactor — frontend-v2

## Quy trình

1. **Đọc hiểu** — Đọc các file liên quan, hiểu flow, hiểu context. Không chỉ grep.
2. **Phân tích** — Tìm vấn đề thực sự: logic sai, flow đứt, component làm quá nhiều việc, pattern không nhất quán, code thừa.
3. **Báo cáo** — Trình bày cho user: vấn đề gì, ở đâu, tại sao nó là vấn đề, đề xuất sửa thế nào.
4. **Chờ user quyết định** — User chốt cái nào sửa, cái nào giữ, cái nào cần bàn thêm.
5. **Thực thi** — Sửa theo quyết định của user.
6. **Verify** — `tsc --noEmit` + `biome check` pass.

## Góc nhìn phân tích

### Flow & UX
- User đi từ đâu đến đâu? Có bị cụt không?
- Hoàn thành action xong → có gợi ý bước tiếp không?
- Các hệ thống (coin, streak, goal, notification) có kết nối logic với nhau không?
- Component đã code nhưng không render ở đâu?

### Component design
- Component có làm quá nhiều việc không? (hiển thị + logic + data fetching)
- Component có quá dài không? (>300 dòng → cần tách)
- Route page có chứa logic không nên có? (>80 dòng → logic nên ở -components/)
- Có pattern copy-paste giữa các file không? → extract shared component

### Consistency
- Cùng loại page mà style khác nhau?
- Cùng loại interaction mà behavior khác nhau?
- Cùng ý nghĩa mà dùng khác token/class?

### Dead code
- Export không ai import?
- File trùng lặp?
- Feature code xong nhưng không wire vào app?

## Hard limits (từ AGENTS.md)

- Route page ≤ 80 dòng
- Component file ≤ 300 dòng
- Function ≤ 50 dòng
- Function params ≤ 3
- `cn()` cho conditional classes, không `.join(" ")`
