---
RFC: 0020
Title: Exam and Grading Service Decomposition
Status: Implemented
Created: 2026-04-24
Updated: 2026-04-24
Superseded by: —
---

# RFC 0020 — Exam and Grading Service Decomposition

## Summary

`ExamService` và `GradingService` hiện đã đủ lớn để cần một kế hoạch tách service khi thêm behavior mới. RFC này chốt boundary mục tiêu, thứ tự tách, và nguyên tắc migration để giảm rủi ro mà không đổi API contract hiện tại.

## Motivation

Hiện trạng implementation:

- `app/Services/ExamService.php`: khoảng 449 dòng, đang xử lý import exam, start session, submit, MCQ scoring, tạo writing/speaking submissions, dispatch grading jobs, đọc kết quả.
- `app/Services/GradingService.php`: khoảng 462 dòng, đang xử lý enqueue job, process writing/speaking job, STT/audio, LanguageTool, rule-based scoring, LLM structured grading, persist result, error handling.

Hai service này vẫn chạy đúng, nhưng đang gom nhiều responsibility. Nếu tiếp tục thêm tính năng như admin edit exam, teacher review workflow, grading retry policy, provider fallback, hoặc analytics scoring, service sẽ khó review/test và dễ tạo dependency vòng.

Mục tiêu là tách theo capability khi có thay đổi mới, không refactor lớn chỉ để đổi tên.

## Design

### Target service boundaries

#### `ExamImportService`

Sở hữu luồng import exam version hoàn chỉnh.

Responsibilities:

- Validate payload import bằng `ExamVersionValidator`.
- Tạo `Exam` + `ExamVersion` + listening/reading/writing/speaking children trong một transaction.
- Không xử lý learner session hoặc scoring.

Entrypoints dự kiến:

- `import(array $examData, array $versionData): Exam`

Controller consumer:

- `Api\V1\Admin\ExamController::import()`

#### `ExamSessionService`

Sở hữu lifecycle của learner exam session.

Responsibilities:

- List/show published exams và active/my sessions nếu không cần scoring detail.
- Start session, compute cost, spend coins, set deadline.
- Submit orchestration ở mức high-level: lock/validate session, gọi scoring/submission services, update status.
- Không tự tính MCQ score chi tiết nếu đã có `ExamScoringService`.

Entrypoints dự kiến:

- `listPublished(): Collection`
- `showPublished(string $id): Exam`
- `start(Profile $profile, ExamVersion $version, string $mode, array $selectedSkills, float $timeExtensionFactor): ExamSession`
- `submit(Profile $profile, ExamSession $session, array $answers): ExamSubmitResult`

Controller consumer:

- `Api\V1\ExamController`

#### `ExamScoringService`

Sở hữu scoring deterministic cho exam.

Responsibilities:

- Load MCQ answer key map.
- Score listening/reading MCQ answers.
- Build per-item result payload.
- Tính aggregate score sync nếu có.
- Không tạo session, không spend coins, không dispatch grading jobs.

Entrypoints dự kiến:

- `scoreMcq(ExamSession $session, array $answers): ExamMcqScoreResult`

#### `WritingGradingService`

Sở hữu grading writing.

Responsibilities:

- Enqueue/process writing grading jobs.
- Load writing submission polymorphic types.
- Run LanguageTool + rule-based scoring + LLM agent for writing.
- Persist `WritingGradingResult`.
- Dispatch grading events.

Entrypoints dự kiến:

- `enqueue(string $submissionType, string $submissionId): GradingJob`
- `process(GradingJob $job): void`

#### `SpeakingGradingService`

Sở hữu grading speaking.

Responsibilities:

- Enqueue/process speaking grading jobs.
- Resolve audio URL/key.
- Run STT/pronunciation layer where available.
- Run LLM agent for speaking rubric.
- Persist `SpeakingGradingResult`.
- Dispatch grading events.

Entrypoints dự kiến:

- `enqueue(string $submissionType, string $submissionId): GradingJob`
- `process(GradingJob $job): void`

### Compatibility facade during migration

Để tránh đổi nhiều controller/job cùng lúc, có thể giữ `ExamService` và `GradingService` như facade tạm thời trong 1-2 PR:

- `ExamService` delegate sang `ExamImportService`, `ExamSessionService`, `ExamScoringService`.
- `GradingService` delegate sang `WritingGradingService`, `SpeakingGradingService`.

Sau khi controller/jobs đã inject service mới trực tiếp và tests pass, xoá facade methods không còn dùng.

### Dependency direction

Allowed:

```text
Controller/Job
  -> ExamSessionService
      -> ExamScoringService
      -> WalletService
      -> WritingGradingService / SpeakingGradingService enqueue only

Controller/Job
  -> WritingGradingService / SpeakingGradingService
      -> LanguageToolService / RuleBasedScoringService / STT / Audio / StructuredGradingAgent
```

Not allowed:

- `ExamScoringService` gọi `WalletService`.
- Grading service gọi `ExamSessionService`.
- Writing và speaking grading service gọi lẫn nhau.
- Service mới gọi controller/resource.

### API contract

Không đổi endpoint hoặc response shape trong refactor này. Tất cả thay đổi phải được cover bởi existing feature tests trước khi thêm behavior mới.

### Test strategy

- Giữ toàn bộ feature tests hiện tại xanh.
- Khi tách `ExamScoringService`, thêm unit/feature tests cho MCQ scoring behavior.
- Khi tách `WritingGradingService` và `SpeakingGradingService`, giữ queue tests hiện có và bổ sung tests cho event/result persistence nếu thiếu.
- Không mock `WalletService` trong feature tests start session; phải verify spend thật qua ledger.

## Alternatives considered

### Giữ nguyên service lớn

Đơn giản nhất và không tốn refactor ngay. Không chọn làm target dài hạn vì service đã gần 450 dòng mỗi file và đang sở hữu nhiều responsibility khác nhau.

### Tách ngay toàn bộ trong một PR

Có thể làm sạch nhanh, nhưng risk cao vì `ExamService` và `GradingService` chạm nhiều route/job/listener/test. Không chọn. RFC khuyến nghị tách dần theo behavior mới.

### Tách theo controller endpoint

Ví dụ `StartExamSessionService`, `SubmitExamSessionService`, `ImportExamService`. Cách này nhỏ hơn nhưng dễ tạo nhiều service quá mỏng. Không chọn làm boundary chính; chỉ cân nhắc nếu một action có complexity riêng đủ lớn.

## Implementation

- [x] `ExamImportService`
- [x] `ExamSessionService`
- [x] `ExamScoringService`
- [x] `WritingGradingService`
- [x] `SpeakingGradingService`
- [x] Update controllers/jobs to inject target services directly
- [x] Remove facade/delegation methods from old large services
- [x] Tests
