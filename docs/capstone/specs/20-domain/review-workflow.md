# Human Review Workflow

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt workflow khi AI không đủ confidence (`confidence < 85`) và cần instructor review để tạo final result.

## Scope

- Submission state `REVIEW_PENDING`.
- Review queue + submit review.
- Audit trail (AI result, human result, final result).

## Decisions

### 1) Khi nào vào review

- Writing/Speaking: nếu `confidence < 85` (xem `hybrid-grading.md`) → Main App set `REVIEW_PENDING`.

### 2) Review queue

- API (catalog): `GET /admin/submissions/pending-review` (xem `../10-contracts/api-endpoints.md`).
- Sorting: ưu tiên theo `reviewPriority`, sau đó FIFO theo thời gian vào queue.

### 2.1) Claim mechanism (Race Condition Prevention)

Trước khi instructor bắt đầu review, phải **claim** submission để tránh trùng lặp:

- API: `POST /admin/submissions/:id/claim`
- Cơ chế:
  - Sử dụng Redis Distributed Lock với TTL 15 phút (`lock:review:{submissionId}`).
  - Nếu submission đã được claim bởi instructor khác → trả về 409 CONFLICT với thông tin instructor đang claim.
  - Nếu claim thành công → trả về thông tin submission + bắt đầu timer.
- Timeout: Nếu instructor không submit review trong 15 phút, lock tự động expire và submission quay lại queue.

### 2.2) Release mechanism

- API: `POST /admin/submissions/:id/release` (hủy claim, không submit review).
- Dùng khi instructor mở nhầm bài hoặc cần chuyển cho người khác.

### 3) Submit review

- API (catalog): `PUT /admin/submissions/:id/review`.
- Payload tối thiểu:
  - `overallScore` (0-10)
  - `band` (A1/A2/B1/B2/C1)
  - `criteriaScores` + `feedback` (best-effort, có thể tối giản ở version đầu)
  - `reviewComment` (optional, dành cho audit)

### 4) Merge rule (AI vs Human)

- Quy tắc agree/override theo `hybrid-grading.md`.
- Final result phải ghi rõ `gradingMode` (auto/hybrid/human) và `reviewerId`.

## Contracts

- Khi `REVIEW_PENDING`, learner chỉ thấy trạng thái chờ review và ETA best-effort (không hiển thị điểm).
- Sau khi review xong, submission chuyển `COMPLETED` và learner thấy final result.

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Instructor review 2 lần cùng submission | Chỉ cho phép 1 finalization; lần sau phải là admin override (nếu support) |
| Review payload thiếu field | 400 VALIDATION_ERROR |
| Submission không ở REVIEW_PENDING | 409 CONFLICT |

## Acceptance criteria

- Review queue trả đúng các submission `REVIEW_PENDING`.
- Submit review tạo final result theo rule agree/override.
- Audit lưu được AI result + human inputs + final result.
