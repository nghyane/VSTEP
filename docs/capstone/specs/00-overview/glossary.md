# Glossary — VSTEP Adaptive Platform

> Chuẩn hoá từ vựng dùng trong spec, code, và API.

## Entity Names

| Term | Meaning | Notes |
|------|---------|-------|
| **exam** | Bài thi thử (mock test) | URL: `/exams`, table: `exams` |
| **exam session** | Phiên làm bài thi | Table: `exam_sessions` |
| **submission** | Bài nộp (trả lời 1 câu hỏi) | Table: `submissions` |
| **question** | Câu hỏi | Table: `questions` |
| **progress** | Tiến trình học của user theo skill | Table: `user_progress` |

## Field Names

| Field | Meaning | Replaces |
|-------|---------|----------|
| `confidence` | Độ tin cậy AI grading (0–100) | ~~confidenceScore~~ |
| `overallScore` | Tổng điểm bài thi | ~~overallExamScore~~ |
| `skillScores` | Điểm từng kỹ năng trong exam | ~~sectionScores~~ |
| `scaffoldLevel` | Mức scaffold hiện tại | ~~scaffoldStage~~ |
| `deadline` | Hạn chót | ~~deadlineAt~~ |
| `occurredAt` | Thời điểm sự kiện xảy ra | ~~eventAt~~ |
| `reviewPending` | Cần human review? | ~~reviewRequired~~ |

## Status Enums

### Submission Status (`submission_status`)

```
pending → queued → processing → completed
                             ↘ review_pending
                             ↘ error → retrying → (processing)
                             ↘ failed
```

| Value | Meaning |
|-------|---------|
| `pending` | Vừa tạo, chưa gửi vào queue |
| `queued` | Đã gửi vào queue, chờ xử lý |
| `processing` | Đang xử lý (AI analyze + grade) |
| `completed` | Hoàn thành |
| `review_pending` | AI xong nhưng cần human review |
| `error` | Lỗi tạm, sẽ retry |
| `retrying` | Đang retry sau lỗi |
| `failed` | Lỗi vĩnh viễn, không retry nữa |

### Exam Session Status (`exam_status`)

| Value | Meaning |
|-------|---------|
| `in_progress` | Đang làm bài |
| `submitted` | Đã nộp, chờ chấm writing/speaking |
| `completed` | Đã hoàn thành, đủ 4 skill scores |
| `abandoned` | Bỏ dở |

### Streak Direction (`streak_direction`)

| Value | Meaning |
|-------|---------|
| `up` | Đang tăng |
| `down` | Đang giảm |
| `neutral` | Không đổi |

## Enum Casing Convention

Tất cả enum values dùng **lowercase**: `pending`, `low`, `auto`, `up`.

| Enum | Values |
|------|--------|
| `review_priority` | `low`, `medium`, `high`, `critical` |
| `grading_mode` | `auto`, `human`, `hybrid` |
| `streak_direction` | `up`, `down`, `neutral` |
| `skill` | `listening`, `reading`, `writing`, `speaking` |
| `question_level` | `A1`, `A2`, `B1`, `B2`, `C1` |
| `vstep_band` | `A1`, `A2`, `B1`, `B2`, `C1` |
| `outbox_status` | `pending`, `processing`, `published`, `failed` |
| `exam_status` | `in_progress`, `submitted`, `completed`, `abandoned` |

## API Verbs

| Action | Verb | HTTP | Notes |
|--------|------|------|-------|
| Đăng nhập | login | POST | Không dùng "sign-in" |
| Đăng ký | register | POST | Không dùng "sign-up" |
| Xoá mềm | remove | DELETE | API trả `{ id }`, DB set `deletedAt` |
| Chấm điểm | grade | POST | Verb, không dùng làm noun cho số |

## Response Wrapper

```json
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

- `data` (không dùng `items`)
- `meta` (không dùng `pagination`)
