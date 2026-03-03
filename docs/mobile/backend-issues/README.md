# Backend Issues — Mobile App Gaps

Danh sách API/tính năng backend **chưa có** mà mobile app cần, đã đối chiếu với SRS, OpenAPI spec, và code backend hiện tại.

> **Lưu ý:** Issues #18 và #19 trên GitHub đã track các gaps chung cho cả frontend và mobile (exam session questions, session answers, activity streak, avatar, notifications). Danh sách dưới đây chỉ liệt kê các gaps **mới phát hiện** từ mobile.

## Tổng hợp

| # | File | Tiêu đề | Mức độ | Effort |
|---|------|---------|--------|--------|
| 1 | [001](./001-practice-adaptive-question-selection.md) | Practice: adaptive question selection + scaffolding | 🔴 Cao | L |
| 2 | [002](./002-placement-test-flow.md) | Placement test flow (bài kiểm tra đầu vào) | 🔴 Cao | XL |
| 3 | [003](./003-learning-path-endpoint.md) | Learning path — lộ trình học cá nhân | 🟡 TB | M |
| 4 | [004](./004-goal-computed-fields.md) | Goal: thiếu achieved/onTrack/daysRemaining | 🟡 TB | S |
| 5 | [005](./005-exam-title-field.md) | Exams: thêm field `title` | 🟢 Thấp | S |

## Đã loại bỏ (không tạo issue)

| Gap | Lý do |
|-----|-------|
| SSE cho submission grading | Phase 2 — polling đủ cho MVP, SSE thêm complexity lớn |
| Bulk questions endpoint | Đã có trong issue #19 |
| Exam session list/questions/answers | Đã có trong issues #18, #19 |
| Activity streak, avatar, notifications | Đã có trong issue #18 |

## Cách tạo issues trên GitHub

```bash
# Cài gh CLI
winget install GitHub.cli
gh auth login

# Tạo issues
for f in docs/mobile/backend-issues/0*.md; do
  title=$(head -1 "$f" | sed 's/^# //')
  gh issue create --title "$title" --body-file "$f" --label "app:backend,app:mobile"
done
```
