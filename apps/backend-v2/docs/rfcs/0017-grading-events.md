---
RFC: 0017
Title: Grading Event System — Architecture Fix
Status: Proposed
Created: 2026-04-23
Updated: 2026-04-23
Superseded by: —
---

# RFC 0017 — Grading Event System

## Summary

Sửa kiến trúc grading event system cho đúng Laravel convention: event dispatch trong `DB::afterCommit()`, event ownership rõ ràng, auto-discovery listener, cleanup hacky code.

## Problem

Kiến trúc hiện tại (từ PR grading notification lần trước) có các vấn đề:

### 1. Event dispatch sai vị trí
`GradingCompleted::dispatch()` nằm trong `GradingService::processWritingJob()` — sau DB transaction. Nếu queue job gọi service, event không fire. Nếu service gọi trực tiếp (sync test), event fire ngay → inconsistency.

### 2. Không dùng `DB::afterCommit()`
Event dispatch ngay sau `$job->update(['status' => 'ready'])` trong transaction. Nếu transaction rollback (sau khi dispatch), event vẫn đã fire → listener xử lý data không tồn tại.

### 3. Queue Jobs quá mỏng
`GradeWritingJob::handle()` chỉ gọi `$gradingService->processWritingJob($job)` — không làm gì khác. Job nên là owner của lifecycle event.

### 4. Listener duplication
`MarkExamSessionGraded` + `HandleFailedGradingJob` có cùng `resolveExamSession()` + `allJobsTerminal()` → extract qua trait nhưng vẫn 2 class cho cùng một purpose (update session status).

### 5. Không có listener cho `GradingFailed`
Exam session không bao giờ biết grading fail để cleanup.

### 6. `ExamService::submit()` không dispatch grading
Comment "Slice 8" vẫn còn. Exam writing/speaking submissions không được gửi đi chấm.

## Design

### Kiến trúc đúng (Laravel convention)

```
User submits → Service creates submission → Service dispatches Queue Job
     ↓
Queue Worker: GradeWritingJob / GradeSpeakingJob
     ↓
  Calls GradingService::processWritingJob()
     ↓
  DB::transaction { process grading, save results, update job status }
     ↓
  DB::afterCommit { GradingCompleted::dispatch() or GradingFailed::dispatch() }
     ↓
Listeners (auto-discovered):
  ├─ SendGradingNotification  → NotificationService::push()
  └─ UpdateExamSessionStatus  → exam_session.status = 'graded'
```

### Quyết định thiết kế

**Event ownership:** Queue Job là owner. Job biết context đầy đủ (success vs failure, attempt count). Service chỉ return result, job mới fire event.

**Why `DB::afterCommit()`:** Event dispatch sau khi DB transaction đã commit thành công. Nếu transaction rollback (DB error, constraint violation), event không fire → listener không xử lý stale data.

**Why 1 listener cho session update thay vì 2:** Cả completed và failed đều cần check "tất cả jobs đã done chưa?". Chỉ khác là log message. Gộp thành `UpdateExamSessionOnGradingEvent` handle cả `GradingCompleted` + `GradingFailed`.

**Laravel auto-discovery:** Laravel 11+ tự động map `EventClass` → `ListenerClass` nếu listener có `handle(EventClass $event)` method signature trong `app/Listeners/`. Không cần `EventServiceProvider`.

## Implementation Plan

### Step 1: Event dispatch trong Queue Job (sau afterCommit)

**File sửa:** `GradeWritingJob.php`, `GradeSpeakingJob.php`

- Trong `handle()`: gọi service → nếu thành công → `DB::afterCommit(fn () => GradingCompleted::dispatch($job))`
- Trong `failed()`: update job status → `DB::afterCommit(fn () => GradingFailed::dispatch($job, $error))`
- **File sửa:** `GradingService.php` — xóa `GradingCompleted::dispatch()` ra khỏi `processWritingJob()` / `processSpeakingJob()`

### Step 2: Gộp 2 listeners session update thành 1

**File mới:** `UpdateExamSessionOnGradingEvent.php`
**File xóa:** `MarkExamSessionGraded.php`, `HandleFailedGradingJob.php`, `ExamSessionGradingHelpers.php`

- Handle cả `GradingCompleted` + `GradingFailed` trong 1 class
- Logic deduplicated: `resolveExamSession()` + `allJobsTerminal()` trong cùng class

### Step 3: Cập nhật `ExamService::submit()` dispatch grading

**File sửa:** `ExamService.php`

- Sau khi MCQ chấm xong, tạo `ExamWritingSubmission` / `ExamSpeakingSubmission` từ request data (nếu có)
- Dispatch grading jobs cho từng submission
- Session status = 'submitted' → listener sẽ upgrade lên 'graded' khi tất cả jobs done

**File mới:** `ExamWritingSubmission.php`, `ExamSpeakingSubmission.php` (models — đã có từ trước)

### Step 4: Cập nhật tests

**File sửa:** `GradingPipelineTest.php`

- Test grading flow giờ chạy qua queue job (sync driver trong test)
- Test event dispatch đúng timing
- Test notification được tạo khi grading done
- Test exam session status chuyển 'graded'

## Files affected

| File | Action | Reason |
|---|---|---|
| `GradingService.php` | Sửa | Xóa event dispatch khỏi service |
| `GradeWritingJob.php` | Sửa | Thêm `DB::afterCommit` + event dispatch |
| `GradeSpeakingJob.php` | Sửa | Thêm `DB::afterCommit` + event dispatch |
| `SendGradingNotification.php` | Giữ nguyên | Listener đúng rồi |
| `MarkExamSessionGraded.php` | Xóa | Merge vào listener mới |
| `HandleFailedGradingJob.php` | Xóa | Merge vào listener mới |
| `ExamSessionGradingHelpers.php` | Xóa | Không cần trait |
| `UpdateExamSessionOnGradingEvent.php` | Mới | Gộp 2 listeners cũ |
| `ExamService.php` | Sửa | Dispatch grading cho exam submissions |
| `ExamWritingSubmission.php` | Giữ nguyên | Model đã tạo từ trước |
| `ExamSpeakingSubmission.php` | Giữ nguyên | Model đã tạo từ trước |
| `GradingPipelineTest.php` | Sửa | Test coverage cho event flow |

## Risks

- **Breaking existing tests:** Grading test giờ chạy qua queue job → cần config queue driver = `sync` trong test env (đã có).
- **Exam writing/speaking API endpoints:** Chưa tồn tại controller → `ExamService::submit()` nhận data từ request để tạo submissions. Đây là thay đổi contract API — cần cập nhật controller tương ứng.

## Alternaries considered

### Alt 1: Event dispatch trong GradingService

**Why rejected:** Service không biết context queue vs sync. Nếu ai đó refactor sau → event dispatch sai timing. Queue job mới là nơi biết lifecycle.

### Alt 2: Observer pattern trên GradingJob model

**Why rejected:** Model observer không phân biệt được context (queue job vs manual update). Event pattern rõ ràng hơn cho domain semantics.

### Alt 3: Laravel Model Events (saved, updated)

**Why rejected:** `GradingJob::saved` fires trong transaction → không safe cho external side effects (notification, session update). Cần `afterCommit` anyway.

## Rollback plan

Revert tất cả files trong PR. Event system mới là additive — nếu không dùng, hệ thống vẫn chạy như cũ (grading sync trong service).
