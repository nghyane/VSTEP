# Handoff — Assessment scoring, diagnostics, and writing realtime

## Mục tiêu của handoff này

Giúp session mới tiếp tục phần backend/FE liên quan chấm Writing/Speaking mà không cần rà lại toàn bộ lịch sử thay đổi.

## Trạng thái hiện tại

### Đã commit + push

Commit đã lên `main`:

- `feat(assessment): expose scoring display diagnostics`

Nội dung chính đã ship:

1. Siết scoring Writing để bài quá ngắn / nhập bừa không bị điểm cao.
2. Đưa short-response policy vào rubric thay vì hard-code.
3. Thêm `result.display` cho FE.
4. Thêm `result.diagnostics` cho FE.
5. Expose diagnostics cho cả Writing và Speaking.

### Đã pull code mới nhất từ remote

Đã chạy:

- `git pull --no-rebase origin main`

Remote mới có thêm thay đổi ở:

- `apps/backend-v2/app/Services/AssessmentViewService.php`
- `apps/backend-v2/app/Services/PracticeFeedbackService.php`
- `apps/backend-v2/tests/Feature/Practice/WritingPracticeTest.php`
- `apps/frontend-v3/src/features/grading/types.ts`
- `apps/frontend-v3/src/features/grading/use-writing-assessment.ts`

và một số thay đổi FE/mobile không thuộc scope realtime writing.

## Worktree hiện tại

Đang có WIP local, chưa commit/push, tập trung vào realtime diagnostics cho Writing.

### File đang thay đổi

Modified:

- `apps/backend-v2/app/Assessment/Strategies/WritingAssessmentStrategy.php`
- `apps/backend-v2/app/Http/Controllers/Api/V1/WritingPracticeController.php`
- `apps/backend-v2/app/Services/Ai/LlmTaskFulfillmentAssessor.php`
- `apps/backend-v2/app/Services/AssessmentDiagnosticsService.php`
- `apps/backend-v2/routes/api.php`
- `apps/backend-v2/tests/Feature/Practice/WritingPracticeTest.php`
- `apps/backend-v2/tests/Support/FakeTaskFulfillmentAssessor.php`
- `apps/frontend-v3/src/features/grading/types.ts`
- `apps/frontend-v3/src/features/practice/actions.ts`
- `apps/frontend-v3/src/features/practice/components/WritingInProgress.tsx`
- `apps/frontend-v3/src/features/practice/types.ts`

Untracked:

- `apps/backend-v2/app/Http/Requests/Practice/WritingDiagnosticsRequest.php`
- `apps/backend-v2/app/Services/WritingRealtimeDiagnosticsService.php`

## WIP đang làm là gì?

### Backend

Đang thêm endpoint realtime nhẹ cho Writing:

- `POST /api/v1/practice/writing/diagnostics`

Mục tiêu endpoint:

- không dùng full assessment pipeline
- không queue job
- không gọi LLM để chấm điểm cuối
- trả về readiness + diagnostics nhẹ khi user đang gõ

Shape dự kiến:

```json
{
  "data": {
    "text_hash": "sha1...",
    "language": {
      "is_english": true,
      "confidence": 0.98,
      "non_ascii_letter_ratio": 0
    },
    "diagnostics": {
      "summary": {},
      "word_requirement": {},
      "task_coverage": {},
      "format": {},
      "cohesion": {},
      "vocabulary_profile": {},
      "annotations": [],
      "by_type": {},
      "counts_by_category": {}
    },
    "readiness": {
      "status": "ready | needs_work",
      "label": "...",
      "reasons": []
    }
  }
}
```

### FE

Đang bắt đầu gọi endpoint này từ editor Writing bằng debounce để show:

- số từ realtime
- thiếu bao nhiêu từ
- lỗi ngôn ngữ cơ bản
- Task 1 có lời chào/lời kết chưa
- checklist yêu cầu đề bài dạng heuristic
- readiness trước khi submit

## Những gì đã verify trong WIP

### Đã pass

Backend test liên quan đã từng pass ở trạng thái WIP hiện tại:

- `cd apps/backend-v2 && php artisan test tests/Feature/Practice/WritingPracticeTest.php`

Frontend lint cho `WritingInProgress.tsx` đã được format và pass ở thời điểm trước khi user yêu cầu tóm tắt/docs.

### Chưa làm sau lần pull mới nhất

Sau khi pull remote mới nhất và apply lại WIP, chưa chạy lại bộ check tổng cho toàn bộ WIP theo yêu cầu mới nhất của user.

User đã đổi ưu tiên sang:

1. pull latest trước khi động FE
2. chạy API/e2e checks trước
3. tạo handoff file cho session mới

Hiện mới xong bước sync + handoff.

## Điều quan trọng về scope

User muốn tập trung vào:

- phần luyện viết
- phần luyện nói
- FE layout/UX để show diagnostics hợp lý
- realtime support nên là readiness + diagnostics, không phải realtime final score

Không nên làm ở session tiếp theo:

- realtime AI scoring đầy đủ
- expose raw prompt nội bộ
- expose raw provider payload quá sâu
- đổi lớn unrelated mobile/admin scope

## Next steps khuyến nghị cho session mới

### Bước 1 — Ổn định backend WIP trước

1. Xem lại worktree hiện tại:

```bash
git status --short
```

2. Chạy check backend/API trước khi sửa tiếp:

```bash
cd apps/backend-v2
php artisan route:list --path=api/v1
php artisan test tests/Feature/Practice/WritingPracticeTest.php tests/Feature/Assessment/AssessmentProcessingTest.php tests/Feature/Grading/GradingRubricSeederTest.php tests/Unit/Grading/WritingScoringFormulaTest.php
php artisan validate:assessment-engine --suite=all --technical
```

3. Nếu WIP realtime endpoint còn lỗi, fix backend trước khi polish FE.

### Bước 2 — Viết docs backend trước khi đụng FE sâu hơn

Tạo 2 file docs sau:

1. `apps/backend-v2/docs/assessment-result-contract.md`
   - giải thích `result.display`
   - giải thích `result.diagnostics`
   - field nào FE nên dùng
   - ví dụ JSON cho passed / below_b1 / not_assessable

2. `apps/backend-v2/docs/realtime-writing-diagnostics.md`
   - endpoint `POST /practice/writing/diagnostics`
   - request/response
   - debounce recommendation
   - `text_hash` để tránh stale response
   - heuristic vs final grading

### Bước 3 — Hoàn thiện FE Writing realtime

Tập trung ở:

- `apps/frontend-v3/src/features/practice/components/WritingInProgress.tsx`

UX cần có:

1. realtime sidebar/panel
2. word requirement progress
3. Task 1 format checks
4. task checklist heuristic
5. language error counts
6. readiness messages

Chưa cần làm ngay:

- inline highlight annotations trong editor
- manual AI preview button

### Bước 4 — Sau khi Writing ổn mới quay sang Speaking

Speaking nên ưu tiên diagnostics display, chưa cần realtime score:

- transcript
- speaking rate
- pause count
- pronunciation overall
- content factor

## Ghi chú kỹ thuật quan trọng

### 1. Realtime diagnostics != final grading

Realtime endpoint chỉ để hint, không được reuse làm final score.

### 2. Heuristic task coverage chỉ là tạm thời

Ở realtime endpoint, `task_coverage.source` hiện để là `heuristic`.

FE nên show nhẹ kiểu:

- “có vẻ đã nhắc đến...”

không được hiển thị như kết luận chấm cuối.

### 3. Assessment pipeline chính đã có requirement details thật

`LlmTaskFulfillmentAssessor` đã được mở rộng để trả thêm:

- `requirements_met`

Diagnostics final result có thể show checklist thật từ submission đã chấm.

### 4. Nếu cần stash lại WIP trước thao tác lớn

Có thể dùng:

```bash
git stash push -u -m "wip writing realtime diagnostics"
```

## Nếu muốn chốt WIP thành commit riêng

Gợi ý commit message khi backend realtime endpoint + FE editor realtime hoàn tất:

```text
feat(writing): add realtime diagnostics for practice editor
```

## Source of truth nên đọc trước khi tiếp tục

Ưu tiên đọc:

- `apps/backend-v2/app/Services/AssessmentResultDisplayService.php`
- `apps/backend-v2/app/Services/AssessmentDiagnosticsService.php`
- `apps/backend-v2/app/Services/WritingRealtimeDiagnosticsService.php` (WIP)
- `apps/backend-v2/tests/Feature/Practice/WritingPracticeTest.php`
- `apps/frontend-v3/src/features/grading/types.ts`
- `apps/frontend-v3/src/features/practice/components/WritingInProgress.tsx`

