# SRS/FSRS Implementation Lessons

## Research trước, implement sau

Khi implement algorithm/protocol đã có reference (Anki, FSRS):
1. Đọc source code gốc — không đoán behavior
2. Hiểu architecture layers (Anki: learning steps = scheduling, FSRS = memory)
3. Implement matching gốc, không skip layers

**Sai:** Implement FSRS bỏ learning steps → user bấm Quên → đợi 1 ngày.
**Đúng:** Anki giữ learning steps (1min, 10min) + FSRS memory. Hai layers tách biệt.

## Fix root cause, không fix symptom

Khi UX bug:
1. Trace: user expectation → frontend → API → backend logic
2. Fix ở layer gốc, không patch client

**Sai:** Client polling + timer đợi learning card due.
**Đúng:** Server queue include learn-ahead cards (due within 20min). Client chỉ fetch + render.

## RFC cho thay đổi cross-cutting

Cần RFC khi thay đổi:
- Algorithm (SM-2 → FSRS)
- State model (thêm/bỏ fields)
- API contract (response shape)

Không cần RFC: bugfix, UI tweak, thêm page mới theo pattern có sẵn.

---
See also: [[fsrs-migration]] · [[api-conventions]] · [[anti-patterns]]
