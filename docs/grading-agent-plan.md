# Kế hoạch: Chuyển Grading Service sang Laravel AI Agent

## Bối cảnh

Hiện tại grading service là Python FastAPI microservice, gọi LLM qua HTTP, trả score. Flow:

```
Laravel → Queue Job → HTTP POST Python /grade → LLM → score JSON → Laravel update DB
```

Vấn đề:
- Python service chỉ wrap 1 LLM call — không đáng 1 service riêng
- Prompt đơn giản "grade this" → LLM hallucinate rubric, score không consistent
- Không trace knowledge gaps — chấm xong không biết student yếu gì
- 2 ngôn ngữ, 2 codebases, 2 deployments cho 1 việc

## Giải pháp: Laravel AI SDK Agent

Thay Python service bằng **AI Agent** (`laravel/ai`) chạy trong Laravel Queue Job. Agent có **tools** để tra cứu rubric, knowledge points từ DB. Agent reasoning → tool call → structured output.

## Decisions (đã thống nhất)

| # | Decision | Kết luận | Lý do |
|---|----------|----------|-------|
| 1 | Package | `laravel/ai` (không Prism) | First-party, Laravel 13 guaranteed, built-in testing, artisan generators |
| 2 | Rubric storage | DB tables (`grading_rubrics` + `grading_criteria`) | Admin editable, flexible per skill+level |
| 3 | Grammar tool | Bỏ — agent đánh giá inline | Grammar là 1 criterion trong rubric, không cần tool riêng, giảm latency |
| 4 | ScoreTable tool | Bỏ — code tính điểm | `VstepScoring::round()` + `VstepBand::fromScore()` là fixed national rules |
| 5 | Knowledge gap output | Lưu trong `submission.result` JSON | Chưa có consumer cần aggregate query, YAGNI |
| 6 | Speaking STT | Azure Speech F0 (free tier) | 5h/tháng free, bao gồm pronunciation assessment |
| 7 | Pronunciation | Azure Pronunciation Assessment | Accuracy + Fluency + Prosody scores từ audio thật, free trong F0 |
| 8 | CF Worker | Bỏ — không cần | Azure làm cả STT + pronunciation trong 1 call |
| 9 | Audio storage | R2 via S3 disk (đã có trong project) | Lưu cho re-grade, dispute, audit. Retention 90 ngày |
| 10 | Score calculation | Laravel code, không phải agent | Agent chỉ đánh giá criteria, code tính overall score |
| 11 | Rubric injection | Inject rubric vào system prompt, không dùng tool | Rubric predictable per skill+level, tool call = wasted round-trip |
| 12 | Speaking criteria | 5 criteria (VSTEP chính thức), không phải 4 | prompts.py thiếu Task Fulfillment — criterion quan trọng |
| 13 | Audio validation | Verify MIME type thật trong job + validate path ownership | Presigned URL chỉ check header, không check file content |
| 14 | Presign rate limit | 10 req/phút per user | Chống spam tạo presigned URL |

## Kiến trúc mới

### Writing Flow

```
FE submit {text} → Laravel API → dispatch GradeSubmission Job
                                        ↓
                                WritingGrader Agent
                                ├─ Tool: GetRubric(writing, B2)     → criteria + band descriptors từ DB
                                ├─ Tool: GetKnowledgePoints(qId)    → knowledge points từ pivot table
                                └─ Structured output: criteria_scores + feedback + knowledge_gaps
                                        ↓
                                VstepScoring::round(weighted_avg) → score
                                VstepBand::fromScore() → band
                                Update submission → ProgressService → NotificationService
```

### Speaking Flow

```
Step 0: Audio Upload (presigned URL — direct to R2, không qua backend)
  FE → Backend:  POST /v1/uploads/presign {content_type: "audio/webm", file_size: 2048000}
  Backend:       validate (auth, size ≤ 5MB, type ∈ [audio/webm, audio/mp3, audio/wav])
                 generate path: speaking/{userId}/{uuid}.webm
                 generate presigned PUT URL (expire 15 min)
  Backend → FE:  {upload_url: "https://r2.../speaking/...?X-Amz-Signature=...", audio_path: "speaking/..."}
  FE → R2:       PUT upload_url (binary audio, direct, progress bar)

Step 1: Submit
  FE → Backend:  POST /v1/submissions {question_id, answer: {audio_path, part_number}}
  Backend:       verify Storage::disk('s3')->exists(audio_path)
                 create submission (status: processing)
                 dispatch GradeSubmission job

Step 2: Grading (async queue job)
  Job → Azure Speech API (1 call, max 30s chunks)
      → transcript + accuracy_score + fluency_score + prosody_score + word_errors[]
  Job → SpeakingGrader Agent
      ├─ Tool: GetRubric(speaking, B2)
      ├─ Tool: GetKnowledgePoints(qId)
      ├─ Input: transcript + Azure scores (injected in prompt)
      └─ Structured output: criteria_scores + feedback + knowledge_gaps
  Job → VstepScoring::round(weighted_avg) → score → update submission
```

Agent tự đánh giá Grammar + Vocabulary + Content từ transcript.
Azure cung cấp Pronunciation + Fluency + Prosody scores từ audio thật.

### Audio Upload — Presigned URL Details

**Endpoint**: `POST /v1/uploads/presign` (auth required)

```json
// Request
{"content_type": "audio/webm", "file_size": 2048000}

// Response
{
  "data": {
    "upload_url": "https://<account>.r2.cloudflarestorage.com/vstep-audio/speaking/<userId>/<uuid>.webm?X-Amz-...",
    "audio_path": "speaking/<userId>/<uuid>.webm",
    "expires_in": 900
  }
}
```

**Validation rules**:
- `content_type`: `audio/webm`, `audio/mp3`, `audio/wav` only
- `file_size`: max 5MB (VSTEP speaking ~2 phút ≈ 1-3MB webm)
- Auth: user phải authenticated
- Path scoped per user: `speaking/{userId}/{uuid}.{ext}` — không upload vào path user khác

**R2 bucket CORS config**:
```json
[{
  "AllowedOrigins": ["https://vstep.app", "http://localhost:5173"],
  "AllowedMethods": ["PUT"],
  "AllowedHeaders": ["Content-Type"],
  "MaxAgeSeconds": 3600
}]
```

**Security**:
- Presigned URL expire 15 phút
- Backend verify file exists trên R2 trước khi dispatch grading job
- R2 bucket private — no public access
- Audio path trong submission.answer — không thể forge path sang user khác vì presign scoped per userId

**Retention**: Scheduled job xóa audio > 90 ngày (`Storage::disk('s3')->delete()`).

## Xóa gì

- `apps/grading/` — toàn bộ Python service (giữ `prompts.py` làm reference)
- Docker: grading container, grading env vars
- `config/services.php` → grading entry
- CF Worker plan (không cần nữa)

## Thêm gì

### 1. Package

```bash
composer require laravel/ai
```

### 2. DB Tables

```
grading_rubrics
├─ id (uuid PK)
├─ skill (enum: writing, speaking)
├─ level (enum: B1, B2, C1)
├─ is_active (bool, default true)
├─ timestamps
└─ unique: [skill, level]              # max 6 rows

grading_criteria
├─ id (uuid PK)
├─ rubric_id (FK → grading_rubrics, cascade delete)
├─ key (string)                         # 'task_fulfillment', 'grammar', etc
├─ name (string)                        # 'Task Fulfillment'
├─ description (text)                   # Chi tiết agent cần đọc để chấm
├─ weight (float, default 1.0)          # Trọng số khi tính overall
├─ sort_order (int)
├─ band_descriptors (jsonb)             # {"9-10": "Excellent...", "7-8": "Good..."}
├─ timestamps
└─ unique: [rubric_id, key]
```

Existing tables (không thay đổi):
- `knowledge_points` + `question_knowledge_point` — agent query qua relationship

### 3. File Structure

```
app/
  Ai/
    Agents/
      WritingGrader.php               # Agent + HasTools + HasStructuredOutput
      SpeakingGrader.php              # Agent + HasTools + HasStructuredOutput
    Tools/
      GetKnowledgePoints.php          # Query question->knowledgePoints() (only dynamic tool)
  Http/
    Controllers/Api/V1/
      UploadController.php            # presign endpoint
    Requests/
      PresignUploadRequest.php        # validate content_type, file_size
  Models/
    GradingRubric.php                 # Eloquent model
    GradingCriterion.php              # Eloquent model
  Services/
    UploadService.php                 # Presigned URL generation, file verification
    AzureSpeechService.php            # Azure REST API wrapper (pronunciation assessment)
database/
  migrations/
    xxxx_create_grading_tables.php    # rubrics + criteria
  seeders/
    GradingRubricSeeder.php           # VSTEP rubric data
```

### 4. Agent Classes

```php
// app/Ai/Agents/WritingGrader.php
#[Provider(Lab::OpenAI)]
#[Model('gpt-4o')]
#[MaxSteps(3)]
#[Timeout(90)]
class WritingGrader implements Agent, HasTools, HasStructuredOutput
{
    use Promptable;

    public function __construct(
        public Submission $submission,
        public GradingRubric $rubric,   // loaded with criteria
    ) {}

    public function instructions(): string
    {
        // Rubric injected directly in system prompt (not via tool)
        // Includes: criteria descriptions, band descriptors, level expectations
        // Includes: question content for task fulfillment evaluation
        return view('grading.writing-system', [
            'rubric' => $this->rubric,
            'question' => $this->submission->question,
        ])->render();
    }

    public function tools(): iterable
    {
        return [
            new GetKnowledgePoints,  // only dynamic tool — varies per question
        ];
    }

    public function schema(JsonSchema $schema): array
    {
        // Writing: 4 criteria (VSTEP official)
        return [
            'criteria_scores' => $schema->object([
                'task_fulfillment' => $schema->number()->min(0)->max(10)->required(),
                'organization' => $schema->number()->min(0)->max(10)->required(),
                'vocabulary' => $schema->number()->min(0)->max(10)->required(),
                'grammar' => $schema->number()->min(0)->max(10)->required(),
            ])->required(),
            'feedback' => $schema->string()->required(),
            'knowledge_gaps' => $schema->array($schema->string())->required(),
            'confidence' => $schema->string()->required(),
        ];
    }
}
```

```php
// app/Ai/Agents/SpeakingGrader.php
#[Provider(Lab::OpenAI)]
#[Model('gpt-4o')]
#[MaxSteps(3)]
#[Timeout(90)]
class SpeakingGrader implements Agent, HasTools, HasStructuredOutput
{
    use Promptable;

    public function __construct(
        public Submission $submission,
        public GradingRubric $rubric,
        public array $pronunciationData,  // Azure Speech results
    ) {}

    public function instructions(): string
    {
        // Includes: rubric, question content, part context, Azure scores
        // Agent uses Azure scores as EVIDENCE, not final scores
        // Agent adjusts interpretation based on level (B1 vs C1 expectations differ)
        return view('grading.speaking-system', [
            'rubric' => $this->rubric,
            'question' => $this->submission->question,
            'partNumber' => $this->submission->answer['part_number'],
            'pronunciation' => $this->pronunciationData,
        ])->render();
    }

    public function tools(): iterable
    {
        return [
            new GetKnowledgePoints,
        ];
    }

    public function schema(JsonSchema $schema): array
    {
        // Speaking: 5 criteria (VSTEP official — includes task_fulfillment)
        return [
            'criteria_scores' => $schema->object([
                'fluency_coherence' => $schema->number()->min(0)->max(10)->required(),
                'vocabulary' => $schema->number()->min(0)->max(10)->required(),
                'grammar' => $schema->number()->min(0)->max(10)->required(),
                'pronunciation' => $schema->number()->min(0)->max(10)->required(),
                'task_fulfillment' => $schema->number()->min(0)->max(10)->required(),
            ])->required(),
            'feedback' => $schema->string()->required(),
            'knowledge_gaps' => $schema->array($schema->string())->required(),
            'confidence' => $schema->string()->required(),
        ];
    }
}
```

### 5. Tools (1 tool only — rubric injected in prompt)

```php
// app/Ai/Tools/GetKnowledgePoints.php
class GetKnowledgePoints implements Tool
{
    public function description(): string
    {
        return 'Get knowledge points tested by a specific question. Returns the concepts/skills this question evaluates.';
    }

    public function handle(Request $request): string
    {
        $question = Question::with('knowledgePoints')->findOrFail($request['question_id']);

        return json_encode($question->knowledgePoints->map(fn ($kp) => [
            'name' => $kp->name,
            'category' => $kp->category->value,
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'question_id' => $schema->string()->required(),
        ];
    }
}
```

Note: `GetRubric` tool removed — rubric loaded once and injected into system prompt.
This saves 1 LLM round-trip per grading (~3-5s latency, ~500 tokens).

### 6. Azure Speech Service

```php
// app/Services/AzureSpeechService.php
class AzureSpeechService
{
    // REST API call to Azure Speech pronunciation assessment
    // Input: audio file path (from R2)
    // Output: transcript + accuracy_score + fluency_score + prosody_score + word_errors
    // Max 30s per request → chunk longer audio
    // Free tier: 5 hours/month
}
```

### 7. GradeSubmission Job (rewrite)

```php
class GradeSubmission implements ShouldQueue
{
    public function handle(
        ProgressService $progressService,
        NotificationService $notificationService,
        AzureSpeechService $azureSpeech,
    ): void {
        $submission = Submission::with('question.knowledgePoints')->findOrFail($this->submissionId);

        if ($submission->skill === Skill::Speaking) {
            // Step 1: Azure pronunciation assessment
            $pronunciation = $azureSpeech->assess($submission->answer['audio_path']);
            // pronunciation = {transcript, accuracy_score, fluency_score, prosody_score, word_errors}

            // Step 2: Speaking agent with Azure data
            $result = (new SpeakingGrader($submission))
                ->prompt($this->buildSpeakingPrompt($submission, $pronunciation));
        } else {
            // Writing agent
            $result = (new WritingGrader($submission))
                ->prompt($this->buildWritingPrompt($submission));
        }

        // Step 3: Calculate score (code, not agent)
        $criteriaScores = $result['criteria_scores'];
        $rubric = GradingRubric::with('criteria')
            ->where('skill', $submission->skill)
            ->where('level', $submission->question->level)
            ->firstOrFail();

        $weightedSum = 0;
        $totalWeight = 0;
        foreach ($rubric->criteria as $criterion) {
            $score = $criteriaScores[$criterion->key] ?? 0;
            $weightedSum += $score * $criterion->weight;
            $totalWeight += $criterion->weight;
        }
        $overall = VstepScoring::round($weightedSum / $totalWeight);

        // Step 4: Update submission
        $submission->update([
            'status' => $result['confidence'] === 'low'
                ? SubmissionStatus::ReviewPending
                : SubmissionStatus::Completed,
            'score' => $overall,
            'band' => VstepBand::fromScore($overall),
            'result' => [
                'type' => 'ai_agent',
                'criteria_scores' => $criteriaScores,
                'knowledge_gaps' => $result['knowledge_gaps'],
                'confidence' => $result['confidence'],
                'graded_at' => now()->toAtomString(),
            ],
            'feedback' => $result['feedback'],
            'completed_at' => now(),
        ]);

        // Step 5: Progress + notification
        if ($submission->status === SubmissionStatus::Completed) {
            $progressService->applySubmission($submission);
        }

        $notificationService->send(
            $submission->user_id,
            NotificationType::GradingComplete,
            'Bài làm đã được chấm điểm',
            "Bạn đạt {$overall}/10 cho bài {$submission->skill->value}.",
            ['submission_id' => $submission->id, 'score' => $overall],
        );
    }
}
```

### 8. Config

```env
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...          # fallback

AZURE_SPEECH_KEY=xxxxxxxx
AZURE_SPEECH_REGION=southeastasia

AWS_ENDPOINT=https://<account>.r2.cloudflarestorage.com
AWS_BUCKET=vstep-audio
```

### 9. Submission answer format

```jsonc
// Writing
{"text": "Social media has both positive and negative impacts..."}

// Speaking
{"audio_path": "speaking/uuid.webm", "part_number": 2, "duration_seconds": 45}
```

### 10. Docker Compose (simplified)

```yaml
services:
  postgres: ...
  redis: ...
  backend:
    build: ./apps/backend-v2
    command: php artisan serve
    ports: ["3000:8000"]
  horizon:
    build: ./apps/backend-v2
    command: php artisan horizon
```

Bỏ grading container. 4 → 4 containers (thực tế bớt 1 service).

## VSTEP Rubric Data (seed) — Theo chuẩn chính thức

Source: Trung tâm Khảo thí - ĐH Ngoại ngữ - ĐHQGHN (vstep.vnu.edu.vn)

### Writing: 4 criteria, equal weight, per-task scoring

**Scoring formula** (VSTEP chính thức cho full exam):
`Overall Writing = (Task1 + Task2 × 2) / 3`

Trong practice app: chấm từng task riêng lẻ (student luyện Task 1 hoặc Task 2 độc lập).
Mỗi task chấm 0-10, làm tròn 0.5.

| Key | Name | Description |
|-----|------|-------------|
| `task_fulfillment` | Hoàn thành yêu cầu | Đáp ứng đầy đủ yêu cầu đề bài, nội dung đầy đủ rõ ràng, phát triển ý thấu đáo, độ dài phù hợp. |
| `organization` | Tổ chức bài viết | Bố cục logic, phân đoạn rõ ràng, sử dụng từ nối hiệu quả, mạch lạc tổng thể. |
| `vocabulary` | Từ vựng | Vốn từ phong phú đa dạng, dùng đúng ngữ cảnh, collocations phù hợp. |
| `grammar` | Ngữ pháp | Đa dạng cấu trúc ngữ pháp, chính xác, kiểm soát câu phức. |

### Speaking: 5 criteria (VSTEP chính thức), equal weight

⚠️ Python `prompts.py` chỉ có 4 criteria — thiếu Task Fulfillment. Đã sửa.

| Key | Name | Description |
|-----|------|-------------|
| `fluency_coherence` | Độ trôi chảy & Liên kết | Nói tự nhiên, ít ngập ngừng, tự sửa lỗi tốt. Sắp xếp ý logic, sử dụng từ liên kết phù hợp. |
| `vocabulary` | Từ vựng | Vốn từ phong phú, chính xác, phù hợp chủ đề. Sử dụng từ chuyên ngành và học thuật. |
| `grammar` | Ngữ pháp | Đa dạng cấu trúc câu, chính xác trong ngữ cảnh nói. Kết hợp câu đơn, ghép, phức. |
| `pronunciation` | Phát âm | Phát âm rõ ràng các âm đơn lẻ và âm cuối, trọng âm từ/câu chính xác, ngữ điệu tự nhiên. |
| `task_fulfillment` | Nội dung & Hoàn thành yêu cầu | Trả lời đúng câu hỏi, phát triển ý đầy đủ, logic, phù hợp ngữ cảnh part. |

### Band Descriptors (VSTEP chính thức, per criterion per level)

```json
// Example: Grammar criterion, all levels
{
  "9-10": "Sử dụng đa dạng cấu trúc ngữ pháp phức tạp với độ chính xác cao, hiếm khi mắc lỗi. Kiểm soát tốt câu phức, mệnh đề quan hệ.",
  "7-8": "Đa dạng cấu trúc, chính xác phần lớn. Lỗi nhỏ không ảnh hưởng giao tiếp. Sử dụng câu phức khá tốt.",
  "5-6": "Sử dụng được cả câu đơn và câu phức nhưng còn lỗi. Nghĩa vẫn rõ ràng dù có sai sót.",
  "3-4": "Chủ yếu câu đơn, lỗi ngữ pháp thường xuyên gây khó hiểu. Hạn chế cấu trúc câu.",
  "1-2": "Chỉ dùng được vài mẫu câu đơn giản, lỗi nghiêm trọng, gần như không thể hiểu."
}
```

Band descriptors khác nhau theo level: B1 kỳ vọng cấu trúc đơn giản hơn, C1 kỳ vọng kiểm soát nâng cao.
Seeder tạo 6 rubrics (2 skills × 3 levels) × criteria (4 writing + 5 speaking) = 27 criteria rows.

### Speaking Part Context (inject vào prompt)

| Part | Name | Duration | Expectations |
|------|------|----------|--------------|
| 1 | Social Interaction | 3 min | Trả lời ngắn gọn về chủ đề quen thuộc, trải nghiệm cá nhân. Không cần elaborate. |
| 2 | Solution Discussion | 4 min | Thảo luận vấn đề, đề xuất giải pháp. Cần lập luận có logic. |
| 3 | Topic Development | 5 min | Phát triển quan điểm về chủ đề trừu tượng/phức tạp. Cần elaborate và support opinions. |

## Azure Speech F0 — Constraints

- **5 hours audio/month** (shared with STT)
- **Max 30 seconds/request** → chunk longer audio into segments
- **en-US locale** required for prosody scores
- **Unscripted mode** → no reference text needed (VSTEP speaking = spontaneous)
- Output: transcript + AccuracyScore + FluencyScore + ProsodyScore + word errors + phoneme scores (IPA)
- Grammar/Vocabulary/Topic scores **retired** from Azure → agent handles these

## Migration Steps

1. `composer require laravel/ai` + publish config
2. Create migration: `grading_rubrics` + `grading_criteria` tables
3. Create models: `GradingRubric`, `GradingCriterion`
4. Create seeder: `GradingRubricSeeder` (VSTEP rubric data, 6 rubrics × 27 criteria rows)
5. Create tool: `GetKnowledgePoints` (`php artisan make:tool`)
6. Create agents: `WritingGrader`, `SpeakingGrader` (`php artisan make:agent --structured`)
7. Create blade templates: `grading.writing-system`, `grading.speaking-system` (system prompts with rubric + part context)
8. Create `AzureSpeechService` (Azure REST API wrapper)
9. Create `UploadService` + `UploadController` (presigned URL endpoint)
10. Rewrite `GradeSubmission` job
11. Test writing end-to-end (mock LLM via `WritingGrader::fake()`)
12. Test speaking end-to-end (mock Azure + mock LLM)
13. Remove Python service references + update docker-compose
14. Update AGENTS.md

## Timeline

| Step | Effort | Blocker |
|------|--------|---------|
| 1-4 | 1.5h | Migration + seed (27 criteria rows) |
| 5-7 | 2.5h | Tool + agents + blade prompts |
| 8 | 1.5h | Azure integration |
| 9 | 1h | Upload presign endpoint |
| 10 | 1h | Job rewrite |
| 11-12 | 1h | Testing |
| 13-14 | 30m | Cleanup |
| **Total** | **~9h** | |

## Risks

- **LLM tool calling quality** — Agent có thể gọi tool sai hoặc loop. `#[MaxSteps(3)]` giới hạn.
- **Azure 30s limit** — VSTEP speaking 1-2 phút/part. Cần chunk audio. Nếu chunk giữa câu → transcript bị cắt.
- **Cost** — Rubric injected in prompt = 1 LLM call thay vì 2-3. Chỉ `GetKnowledgePoints` là tool call.
- **Latency** — Single LLM call ~8-12s + Azure ~5s = ~15-17s total. Acceptable cho async queue job.
- **Azure F0 quota** — 5h/month. Nếu hết → speaking grading fails. Monitor usage, alert khi gần 80% (4h).
- **Azure scores ≠ VSTEP scores** — Agent phải interpret Azure scores theo context (level, part). System prompt instruct rõ.
- **Audio MIME spoofing** — Presigned URL chỉ check header. Job verify MIME thật bằng `finfo` trước khi gửi Azure.
