---
RFC: 0018
Title: Exam Submission — Complete Scoring Flow (MCQ + Writing + Speaking)
Status: Draft
Created: 2026-04-23
Updated: 2026-04-23
Superseded by: —
---

# RFC 0018 — Exam Submission Complete Scoring Flow

## Summary

Bổ sung flow chấm điểm hoàn chỉnh cho exam (thi thử / phòng thi):
- **Listening/Reading:** Chấm MCQ sync → trả per-item result cho FE hiển thị chi tiết đúng/sai.
- **Writing/Speaking:** Tạo submission → dispatch grading job (tái dụng pipeline practice).

Hiện tại `ExamService::submit()` chỉ chấm MCQ, bỏ qua writing/speaking. Frontend 100% mock data, tự chấm bằng hash pseudorandom — sai đáp án thật.

## Motivation

### Vấn đề hiện tại

| Skill | Backend | Frontend |
|---|---|---|
| Listening | `ExamMcqAnswer` lưu `is_correct` ✅ | Response chỉ trả `mcq_score`, FE dùng `mockCorrectLetter()` ❌ |
| Reading | `ExamMcqAnswer` lưu `is_correct` ✅ | Response chỉ trả `mcq_score`, FE dùng `mockCorrectLetter()` ❌ |
| Writing | Model + migration có ✅, endpoint submit ❌ | Text lưu `Map<string, string>` local, không POST ❌ |
| Speaking | Model + migration có ✅, endpoint submit ❌ | Chỉ mark `Set<string>` local, không upload audio ❌ |

- `ExamService::submit()` có comment "Slice 8" từ lâu, chưa implement.
- `/phong-thi/$examId/ket-qua` đọc `sessionStorage` — kết quả mất khi đóng tab, không có lịch sử.
- `GradingService`, `GradeWritingJob`, `GradeSpeakingJob`, event listeners đều đã sẵn sàng — chỉ cần nối input.

## Design

### Kiến trúc tổng thể

```
┌─────────────┐                    ┌──────────────┐
│  Frontend   │                    │   Backend    │
│             │                    │              │
│  MCQ answer │── POST submit ────▶│ ExamService  │
│  Writing    │                    │              │
│  Speaking   │                    ├──────────────┤
│             │                    │ 1. Chấm MCQ  │──── sync, trong transaction
│  Recording  │── POST upload ────▶│ 2. Tạo sub   │──── writing/speaking submissions
│  Audio blob │                    │ 3. Dispatch  │──── queue jobs, afterCommit
│             │                    │              │
│             │◀── 201 Response ───│              │
│             │  { mcq_per_item,   │              │
│             │    grading_jobs }  │              │
│             │                    │              │
│             │── GET results ────▶│ Resources    │──── writing/speaking khi grading done
└─────────────┘                    └──────────────┘
```

### Decision 1: Audio upload riêng, URL truyền vào submit

Speaking audio upload qua presigned URL (đã có `AudioController::upload`). FE upload ngay sau khi record xong mỗi part, nhận `audio_url`, rồi truyền vào payload submit.

**Tại sao không gộp audio upload vào submit:**
- Audio là binary lớn (1-5MB/part), không nên nằm trong JSON body.
- Presigned URL pattern đã có, tái dụng được.
- Nếu upload fail, FE retry độc lập, không ảnh hưởng phần còn lại.

### Decision 2: Monolithic submit cho MCQ + Writing text + Speaking metadata

Một endpoint duy nhất nhận tất cả answer:

```
POST /api/v1/exams/{examId}/sessions/{sessionId}/submit
```

**Tại sao không tách per-skill submit:**
- Exam flow đã sequential: Listening → Reading → Writing → Speaking → Nộp bài. User không quay lại được.
- Mọi answer đều available tại thời điểm submit.
- Tách riêng → phải quản lý partial submission state (skill nào đã submit, chưa submit) — phức tạp không cần thiết.
- Queue jobs là async, không gây timeout. Submit endpoint chỉ tạo record + dispatch, return trong <100ms.

### Decision 3: MCQ per-item result trả trong submit response, không endpoint riêng

`ExamService::submit()` đã tính `is_correct` cho từng câu trong vòng lặp. Thay vì tạo thêm `GET /sessions/{id}/mcq-results`, đưa thẳng vào response.

**Tại sao:**
- FE trang kết quả load ngay sau submit → data đã có sẵn.
- Không cần poll hay thêm endpoint cho MCQ (đã chấm sync).
- FE cache vào sessionStorage như hiện tại — không breaking change về flow.
- Per-item data là deterministic, không thay đổi theo thời gian.

### Decision 4: DTO cho submit result, không trả array

Service method return typed object, Resource format thành JSON. Đúng Laravel convention — service không biết HTTP.

## API Contract

### Submit Exam

**Request:**
```
POST /api/v1/exams/{examId}/sessions/{sessionId}/submit
Authorization: Bearer <jwt>
```

```json
{
  "mcq_answers": [
    { "item_ref_type": "listening", "item_ref_id": "uuid", "selected_index": 1 }
  ],
  "writing_answers": [
    { "task_id": "uuid", "text": "Dear Sir,...", "word_count": 120 }
  ],
  "speaking_answers": [
    { "part_id": "uuid", "audio_url": "https://r2.url/...", "duration_seconds": 45 }
  ]
}
```

**FormRequest:** `SubmitExamRequest`
- `mcq_answers`: array, each item has `item_ref_type` (listening|reading), `item_ref_id` (uuid), `selected_index` (0-3).
- `writing_answers`: optional array, each item has `task_id` (uuid), `text` (string, min 1 char), `word_count` (integer >= 0).
- `speaking_answers`: optional array, each item has `part_id` (uuid), `audio_url` (url), `duration_seconds` (integer >= 1).
- Custom rule: `task_id` / `part_id` phải thuộc exam version của session.

**Response (201):**
```json
{
  "data": {
    "session_id": "uuid",
    "status": "submitted",
    "submitted_at": "2026-04-23T10:00:00Z",
    "mcq": {
      "score": 35,
      "total": 40,
      "items": [
        {
          "item_ref_type": "listening",
          "item_ref_id": "uuid",
          "selected_index": 1,
          "correct_index": 2,
          "is_correct": false
        }
      ]
    },
    "writing_jobs": [
      { "submission_id": "uuid", "job_id": "uuid", "status": "pending" }
    ],
    "speaking_jobs": [
      { "submission_id": "uuid", "job_id": "uuid", "status": "pending" }
    ]
  }
}
```

### Get Writing Results

```
GET /api/v1/exams/sessions/{sessionId}/writing-results
```

```json
{
  "data": [
    {
      "submission_id": "uuid",
      "task_id": "uuid",
      "text": "...",
      "word_count": 120,
      "grading_status": "ready",
      "result": {
        "rubric_scores": { "task_achievement": 2.5, "coherence": 3.0, "lexical": 2.0, "grammar": 2.5 },
        "overall_band": 6.5,
        "strengths": ["Good paragraph structure"],
        "improvements": [{"message": "...", "explanation": "..."}],
        "rewrites": [{"original": "...", "improved": "...", "reason": "..."}],
        "annotations": [{"start": 0, "end": 10, "severity": "error", "category": "grammar", "message": "..."}]
      }
    }
  ]
}
```

`grading_status` = `pending` | `ready` | `failed`. Khi `pending` → `result: null`.

### Get Speaking Results

```
GET /api/v1/exams/sessions/{sessionId}/speaking-results
```

```json
{
  "data": [
    {
      "submission_id": "uuid",
      "part_id": "uuid",
      "audio_url": "https://...",
      "duration_seconds": 45,
      "grading_status": "ready",
      "result": {
        "rubric_scores": { "fluency": 2.5, "pronunciation": 3.0, "content": 2.0, "vocab": 2.5, "grammar": 2.0 },
        "overall_band": 6.0,
        "strengths": ["..."],
        "improvements": [...],
        "pronunciation_report": { "accuracy_score": 78 },
        "transcript": "I think that..."
      }
    }
  ]
}
```

### Session Status Flow

```
active ──submit──▶ submitted ──all jobs done──▶ graded
                                  │
                                  └── any job failed ──▶ partial
```

- `submitted` → MCQ đã chấm xong, writing/speaking đang chờ grading.
- `graded` → tất cả writing + speaking jobs completed.
- `partial` → có job failed (FE hiển thị warning, user có thể retry).

Transition `submitted → graded/partial` do `UpdateExamSessionOnGradingEvent` listener xử lý (RFC 0017).

## Implementation

### Phase 1: Backend (Laravel)

#### 1.1 FormRequest: `SubmitExamRequest`

```php
#[Validate('mcq_answers', ['required', 'array'])]
#[Validate('mcq_answers.*.item_ref_type', ['required', Rule::in(['listening', 'reading'])])]
#[Validate('mcq_answers.*.item_ref_id', ['required', 'uuid'])]
#[Validate('mcq_answers.*.selected_index', ['required', 'integer', 'min:0', 'max:3'])]
#[Validate('writing_answers', ['nullable', 'array'])]
#[Validate('writing_answers.*.task_id', ['required_with:writing_answers', 'uuid'])]
#[Validate('writing_answers.*.text', ['required_with:writing_answers', 'string', 'min:1'])]
#[Validate('writing_answers.*.word_count', ['required_with:writing_answers', 'integer', 'min:0'])]
#[Validate('speaking_answers', ['nullable', 'array'])]
#[Validate('speaking_answers.*.part_id', ['required_with:speaking_answers', 'uuid'])]
#[Validate('speaking_answers.*.audio_url', ['required_with:speaking_answers', 'url'])]
#[Validate('speaking_answers.*.duration_seconds', ['required_with:speaking_answers', 'integer', 'min:1'])]
class SubmitExamRequest extends FormRequest {}
```

Custom rule: validate `task_id` / `part_id` thuộc exam version của session trong `after()` hook.

#### 1.2 DTO: `ExamSubmitResult`

```php
class ExamSubmitResult
{
    public function __construct(
        public ExamSession $session,
        public int $mcqScore,
        public int $mcqTotal,
        public array $mcqPerItemResults,  // array{item_ref_type, item_ref_id, selected_index, correct_index, is_correct}
        public array $writingJobs,        // array{submission_id, job_id, status}
        public array $speakingJobs,       // array{submission_id, job_id, status}
    ) {}
}
```

#### 1.3 Sửa `ExamService::submit()`

```php
public function submit(
    Profile $profile,
    ExamSession $session,
    array $mcqAnswers,
    array $writingAnswers = [],
    array $speakingAnswers = [],
): ExamSubmitResult {
    // Validate ownership + status (giữ nguyên)

    return DB::transaction(function () use ($session, $mcqAnswers, $writingAnswers, $speakingAnswers) {
        // 1. MCQ grading (giữ nguyên logic hiện tại, thu thập per-item result)
        $mcqPerItemResults = [];
        $mcqScore = 0;
        $mcqTotal = 0;
        $itemMap = $this->loadMcqItemMap($session);

        foreach ($mcqAnswers as $answer) {
            // ... existing logic ...
            $mcqPerItemResults[] = [
                'item_ref_type' => $refType,
                'item_ref_id' => $refId,
                'selected_index' => $selected,
                'correct_index' => $correctIndex,
                'is_correct' => $isCorrect,
            ];
        }

        $session->update(['status' => 'submitted', 'submitted_at' => now()]);

        // 2. Writing submissions + grading jobs
        $writingJobs = [];
        foreach ($writingAnswers as $w) {
            $submission = ExamWritingSubmission::create([
                'session_id' => $session->id,
                'profile_id' => $session->profile_id,
                'task_id' => $w['task_id'],
                'text' => $w['text'],
                'word_count' => $w['word_count'],
                'submitted_at' => now(),
            ]);
            $job = $this->gradingService->enqueueWritingGrading('exam_writing', $submission->id);
            $writingJobs[] = [
                'submission_id' => $submission->id,
                'job_id' => $job->id,
                'status' => $job->status,
            ];
        }

        // 3. Speaking submissions + grading jobs
        $speakingJobs = [];
        foreach ($speakingAnswers as $s) {
            $submission = ExamSpeakingSubmission::create([
                'session_id' => $session->id,
                'profile_id' => $session->profile_id,
                'part_id' => $s['part_id'],
                'audio_url' => $s['audio_url'],
                'duration_seconds' => $s['duration_seconds'],
                'submitted_at' => now(),
            ]);
            $job = $this->gradingService->enqueueSpeakingGrading('exam_speaking', $submission->id);
            $speakingJobs[] = [
                'submission_id' => $submission->id,
                'job_id' => $job->id,
                'status' => $job->status,
            ];
        }

        return new ExamSubmitResult(
            $session->refresh(), $mcqScore, $mcqTotal,
            $mcqPerItemResults, $writingJobs, $speakingJobs,
        );
    });
}
```

#### 1.4 Controller: `ExamController::submit()`

```php
public function submit(SubmitExamRequest $request, string $examId, string $sessionId): JsonResponse
{
    /** @var ExamSession $session */
    $session = ExamSession::query()->findOrFail($sessionId);

    $result = $this->examService->submit(
        $this->profile($request),
        $session,
        $request->validated('mcq_answers'),
        $request->validated('writing_answers') ?? [],
        $request->validated('speaking_answers') ?? [],
    );

    return response()->json([
        'data' => ExamSubmitResultResource::make($result)->toArray($request),
    ], 201);
}
```

#### 1.5 Resource: `ExamSubmitResultResource`

```php
class ExamSubmitResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'session_id' => $this->resource->session->id,
            'status' => $this->resource->session->status,
            'submitted_at' => $this->resource->session->submitted_at,
            'mcq' => [
                'score' => $this->resource->mcqScore,
                'total' => $this->resource->mcqTotal,
                'items' => $this->resource->mcqPerItemResults,
            ],
            'writing_jobs' => $this->resource->writingJobs,
            'speaking_jobs' => $this->resource->speakingJobs,
        ];
    }
}
```

#### 1.6 Resource: `ExamWritingResultResource` / `ExamSpeakingResultResource`

```php
class ExamWritingResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $submission = $this->resource; // ExamWritingSubmission
        $result = $submission->gradingResults()->where('is_active', true)->first(); // WritingGradingResult

        return [
            'submission_id' => $submission->id,
            'task_id' => $submission->task_id,
            'text' => $submission->text,
            'word_count' => $submission->word_count,
            'grading_status' => $submission->gradingJob?->status ?? 'failed',
            'result' => $result ? [
                'rubric_scores' => $result->rubric_scores,
                'overall_band' => $result->overall_band,
                'strengths' => $result->strengths,
                'improvements' => $result->improvements,
                'rewrites' => $result->rewrites,
                'annotations' => $result->annotations,
            ] : null,
        ];
    }
}
```

Tương tự cho speaking.

#### 1.7 ExamSession relationship

Thêm vào `ExamSession` model:
```php
public function writingSubmissions(): HasMany
{
    return $this->hasMany(ExamWritingSubmission::class);
}

public function speakingSubmissions(): HasMany
{
    return $this->hasMany(ExamSpeakingSubmission::class);
}
```

Thêm vào `ExamWritingSubmission`:
```php
public function gradingJob(): HasOne
{
    return $this->hasOne(GradingJob::class, 'submission_id')
        ->where('submission_type', 'exam_writing')
        ->latestOfMany();
}

public function gradingResults(): HasMany
{
    return $this->hasMany(WritingGradingResult::class, 'submission_id')
        ->where('submission_type', 'exam_writing');
}
```

Tương tự cho `ExamSpeakingSubmission`.

### Phase 2: Frontend

1. **Writing panel:** POST text trong submit payload (thay vì chỉ lưu Map local).
2. **Speaking panel:** Upload audio qua `POST /api/v1/audio/upload` → nhận URL → truyền vào submit payload.
3. **Kết quả page:** Thay thế `sessionStorage` bằng API calls:
   - Lấy MCQ per-item từ submit response (cache vào sessionStorage).
   - GET `writing-results` / `speaking-results` với polling 5s khi `grading_status = pending`.
4. **Loại bỏ `mockCorrectLetter()`** — dùng đáp án thật từ backend.

## Files affected

| File | Action | Reason |
|---|---|---|
| `app/Http/Requests/SubmitExamRequest.php` | Mới | Validate submit payload |
| `app/DTOs/ExamSubmitResult.php` | Mới | Typed return cho service |
| `app/Services/ExamService.php` | Sửa | Thêm writing/speaking submission + dispatch grading |
| `app/Http/Controllers/Api/V1/ExamController.php` | Sửa | Nhận FormRequest, return Resource |
| `app/Http/Resources/ExamSubmitResultResource.php` | Mới | Format submit response |
| `app/Http/Resources/ExamWritingResultResource.php` | Mới | Format writing result |
| `app/Http/Resources/ExamSpeakingResultResource.php` | Mới | Format speaking result |
| `app/Models/ExamSession.php` | Sửa | Thêm relationships |
| `app/Models/ExamWritingSubmission.php` | Sửa | Thêm gradingJob + gradingResults relationships |
| `app/Models/ExamSpeakingSubmission.php` | Sửa | Thêm gradingJob + gradingResults relationships |
| `routes/api.php` | Sửa | Thêm route writing-results, speaking-results |
| `tests/Feature/ExamSubmitTest.php` | Mới | Test submit flow |

## Dependencies

- **RFC 0017 (Grading Events)** — `UpdateExamSessionOnGradingEvent` listener chuyển session từ `submitted` → `graded`/`partial`.
- **RFC 0005/0007 (Grading Pipeline)** — pipeline đã sẵn sàng, chỉ cần input từ exam submissions.
- **Audio upload** — `POST /api/v1/audio/upload` đã có presigned URL flow.

## Alternatives considered

### Alt 1: Tách per-skill submit endpoint

```
POST /sessions/{id}/mcq-submit
POST /sessions/{id}/writing-submit
POST /sessions/{id}/speaking-submit
POST /sessions/{id}/finalize
```

**Why rejected:** Exam flow đã sequential + one-way navigation. Mọi answer available khi user nhấn "Nộp bài". Tách riêng tạo partial state phức tạp (user submit MCQ rồi disconnect → writing/speaking chưa submit → session treo ở trạng thái half-submitted). Monolithic submit đảm bảo atomic: session hoặc submitted hoàn toàn, hoặc không.

### Alt 2: Gộp audio upload vào submit payload (base64)

FE encode audio thành base64, gửi cùng JSON body.

**Why rejected:** Audio 1-5MB/part → JSON body >10MB. Timeout risk. Presigned URL pattern đã có, binary nên upload trực tiếp lên storage.

### Alt 3: Endpoint riêng cho MCQ results (`GET /sessions/{id}/mcq-results`)

**Why rejected:** MCQ grading là sync trong `submit()`. Data đã có sẵn trong response. FE page kết quả load ngay sau submit → không cần poll hay thêm endpoint. Giữ nguyên flow cache vào sessionStorage của FE, chỉ thay data source từ mock → real.

## Risks

- **Queue overload:** Nhiều user submit cùng lúc → grading job backlog. Mitigation: priority queue (exam job cao hơn practice).
- **LLM unavailable:** Fallback `defaultWritingResult()` đã có → trả band 5.0 + message "AI grading unavailable".
- **Transaction rollback sau dispatch:** Queue job dispatch trong `DB::afterCommit()` (RFC 0017) → nếu transaction rollback, job không dispatch. An toàn.
- **Speaking audio_url invalid:** Grading job kiểm tra `audio_url` trước khi gọi STT. Nếu URL hỏng → skip audio, chỉ chấm transcript rỗng → LLM vẫn trả kết quả (dựa trên empty input → low score, hợp lý).
