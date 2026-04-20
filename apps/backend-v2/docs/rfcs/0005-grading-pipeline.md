---
RFC: 0005
Title: Grading Pipeline (AI + Teacher Review)
Status: Draft
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0005 — Grading Pipeline

## Summary

Thiết kế pipeline chấm bài: async AI grading cho writing/speaking (cả practice và exam), + teacher review flow cho slot 1-1.

AI là grader duy nhất, free, theo rubric Bộ Giáo dục. Teacher KHÔNG sinh score, chỉ bổ sung review/annotation.

## Motivation

4 submission types × 2 tier (practice + exam) = 4 grading channels:
- practice_writing
- practice_speaking
- exam_writing
- exam_speaking

Cần 1 pipeline unified nhưng respect skill-specific shape (writing có annotations, speaking có pronunciation).

MCQ không qua pipeline — chấm sync tại submit.

## Design

### Submission → Job

Khi user submit writing/speaking (practice hoặc exam):

```
1. Lưu submission record (practice_writing_submissions etc.)
2. Create grading_job (status=pending, submission_type, submission_id)
3. Dispatch queue job GradeWritingJob / GradeSpeakingJob
4. Return { submission_id, grading_job_id } cho FE
5. FE poll GET /grading/jobs/{id} hoặc subscribe SSE sau
```

### GradeWritingJob (Laravel Queue)

```
handle():
  1. Mark job status=processing, started_at=now
  2. Load submission + prompt/task context
  3. Build prompt cho AI:
     - system: rubric Bộ Giáo dục (stored)
     - user: prompt + user text + word count + required points
  4. Call laravel/ai SDK với tool-calling
     - Tools: return_rubric_scores(task_achievement, coherence, lexical, grammar, overall_band)
              return_feedback(strengths[], improvements[], rewrites[])
              return_annotations([{start, end, severity, category, message, suggestion?}])
              return_paragraph_feedback([...])
  5. Parse tool responses → writing_grading_results row
     - is_active=true
     - previous active cùng submission → set is_active=false
  6. Mark job status=ready, completed_at
  7. Dispatch GradingCompleted event → Notifications + Progress (nếu exam)
```

### GradeSpeakingJob

```
handle():
  1. Mark processing
  2. Load submission
  3. Step 1 — STT: Azure Speech API
     - Upload audio URL
     - Get transcript + pronunciation_report
     - Store transcript vào submission
  4. Step 2 — AI content grading:
     - Build prompt: task + transcript + pronunciation stats
     - Tools: return_rubric_scores(fluency, pronunciation, content, vocab, grammar, overall_band)
              return_feedback(strengths, improvements)
  5. Combine pronunciation_report (từ Azure) + AI scores
  6. Store speaking_grading_results
  7. Mark ready
  8. Dispatch events
```

### Retry policy

- Max attempts: 3 (config `grading.max_retries`)
- Exponential backoff: 1min, 5min, 15min
- Fail sau 3 → status=failed, `last_error` filled, Notification push
- User có thể `POST /grading/jobs/{id}/retry` thủ công (rate limit 1/10phút)
- Không refund xu (rule #13)

### Versioning

Khi user re-submit (regrade request hoặc re-upload):
- Tạo grading_job mới
- Kết quả: tạo writing_grading_result với `version = latest + 1`, `is_active = true`
- Result cũ: `is_active = false`

FE query `is_active = true` để show current. History query all versions.

### MCQ chấm sync (không qua pipeline)

Submit exam session:
```
POST /exam-sessions/{id}/submit
  → load answers
  → gọi correct_index từ exam_version_items
  → compute score per section
  → update exam_sessions.status='graded' ngay nếu chỉ MCQ
  → nếu có writing/speaking:
    - status='grading' (partial)
    - dispatch jobs
    - khi last job ready → status='graded'
```

### Teacher review flow

Độc lập pipeline AI. Chỉ trigger khi:
- Booking gắn submission
- Slot đã qua
- Teacher mở booking trong teacher panel → xem submission + AI grading result hiện có
- Teacher thêm `teacher_reviews` row với annotations + notes

```
POST /teacher/bookings/{id}/review
  { content: { corrections: [...], tips: [...], notes: "..." }, visible_to_student }
  → validate teacher owns booking
  → validate booking.status = 'completed' (teacher đã mark sau buổi)
  → create teacher_review
  → dispatch TeacherReviewSubmitted → Notification push user
```

User xem:
```
GET /practice/writing/submissions/{id}
  → returns:
    { submission, ai_grading: writing_grading_results (is_active), teacher_review? }
```

### AI model choice (phase 1)

- Primary: Google Gemma 3 (via Google AI API) hoặc Gemini 2.0 Flash for rubric adherence
- Fallback: GPT-4o-mini (OpenAI) nếu Gemma timeout
- STT: Azure Speech (F0 free tier)
- Laravel AI SDK abstract để swap model dễ

### Prompt engineering patterns

- Rubric stored as Markdown in `system_configs` key `grading.rubric_writing_markdown` etc.
- Ví dụ rubric section:
  ```
  ## Task Achievement (0-4 band)
  - 0: Lạc đề hoàn toàn
  - 1: Cover <50% points
  - 2: Cover 50-75% points
  - 3: Cover 75-100% points, thiếu depth
  - 4: Cover đầy đủ + phát triển ý
  ```
- Tool calling với schema strict để tránh hallucination format.
- Output order enforce: strengths → improvements → rewrites (rule #30).

### Storage & cost

- Audio: R2 với lifecycle 90 ngày auto-delete (user already có result).
- Transcript: lưu trong `speaking_grading_results.transcript`.
- Audio URL pre-signed chỉ cho user owner + admin.

### Event topology

```
practice_writing_submission.created
exam_session.submitted (writing subs)
  → enqueue GradeWritingJob

practice_speaking_submission.created
exam_session.submitted (speaking subs)
  → enqueue GradeSpeakingJob

GradeWritingJob.completed
GradeSpeakingJob.completed
  → emit grading.completed event
  → Notifications push
  → Progress recompute (if exam)

booking.completed (teacher marks)
  → UI enables teacher to submit review

teacher_review.submitted
  → Notifications push user
```

## Rate limits

- Grading retry manual: 1/10phút/submission (per user)
- AI API provider: rate limit từ SDK (Gemma quota)

## Alternatives considered

### Alt 1: Sync grading, không queue
Bỏ. AI call 30-60s không thể block request. Queue bắt buộc.

### Alt 2: Webhook thay polling từ FE
Phase 2. Phase 1 FE poll hoặc SSE subscribe.

### Alt 3: Teacher override AI score
Bỏ (rule #31). Teacher review không có score, annotation only.

### Alt 4: 1 job type cho cả writing + speaking
Bỏ. Job logic khác biệt (STT step cho speaking). 2 job class riêng.

## Implementation

- [ ] Create models: GradingJob, WritingGradingResult, SpeakingGradingResult, TeacherReview
- [ ] Migrations
- [ ] Jobs: GradeWritingJob, GradeSpeakingJob, ForceSubmitExpiredExam
- [ ] Services: WritingGrader, SpeakingGrader, RubricLoader
- [ ] Integration: laravel/ai SDK với Gemma, Azure Speech client
- [ ] Events + listeners
- [ ] Controllers + endpoints
- [ ] Notifications templates
- [ ] Seeds cho rubric markdown
- [ ] Tests: job success, retry, failure, versioning, teacher review

## Open questions

1. Gemma vs Gemini Flash 2.0 cho rubric adherence — cần benchmark trên 10 bài thật.
2. Azure Speech F0 tier có đủ cho demo/đồ án không (5 hours/month)?
3. Audio lifecycle 90 ngày có cần feedback từ user không? Phase 1 fix 90 days.
4. Teacher review notification template — cần localize không? Phase 1 hardcode Vietnamese.
5. Có cần `grading_result_diff` giữa version cũ và mới để FE highlight thay đổi? Phase 2.
