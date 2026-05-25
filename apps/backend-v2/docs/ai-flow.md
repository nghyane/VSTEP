# AI Flow — Sơ đồ toàn cảnh

Tài liệu mô tả toàn bộ pipeline AI trong backend: grading writing/speaking, conversation roleplay, và các dịch vụ NLP hỗ trợ.

## Sơ đồ tổng quan

```
                         ┌──────────────────────────────────────┐
                         │           CLIENT (FE/Mobile)         │
                         └──────┬───────────┬───────────┬───────┘
                                │           │           │
              ┌─────────────────┘           │           └─────────────────┐
              ▼                             ▼                             ▼
   ┌──────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
   │  GRADING (async)     │   │  CONVERSATION (sync)     │   │  PRONUNCIATION (sync)│
   │  GradeJob queue       │   │  SpeakingConversation   │   │  SpeakingConversation│
   │  Writing + Speaking   │   │  Service                │   │  Service             │
   └──────────┬───────────┘   └────────────┬─────────────┘   └──────────┬───────────┘
              │                            │                            │
              ▼                            ▼                            ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                          AI PROVIDERS                                     │
   │                                                                          │
   │  ┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
   │  │ 'llm' provider      │  │ 'workers-ai' provider│  │ External APIs    │ │
   │  │ GPT-5.4 / Gemini    │  │ Llama Scout 17B      │  │ Azure STT        │ │
   │  │ (Cloudflare Gateway)│  │ (Cloudflare Workers) │  │ LanguageTool     │ │
   │  └──────────┬──────────┘  └──────────┬───────────┘  │ NLP Sidecar      │ │
   │             │                        │               └──────────────────┘ │
   │             ▼                        ▼                                    │
   │  ┌─────────────────────┐  ┌───────────────────────────────────────────┐   │
   │  │ ChatCompletionsGw   │  │           Direct HTTP to Workers AI       │   │
   │  │ (structured JSON)   │  │           /chat/completions               │   │
   │  └─────────────────────┘  └───────────────────────────────────────────┘   │
   └──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Grading Pipeline (Writing)

```
USER submit bài viết
  │
  ▼
WritingPracticeController / ExamController
  │  POST /practice/writing/sessions/{id}/submit
  │  POST /exam-sessions/{id}/submit
  ▼
GradingService::enqueue()
  ├── Tạo GradingJob (status=pending)
  └── Dispatch GradeJob vào queue (Horizon)
       │
       ▼ (queue worker picks up)
GradeJob::handle()
  │
  ▼
GradingService::process()
  ├── status → processing
  │
  └── WritingGradingStrategy::grade()
       │
       │  ╔═══════════════════════════════════════════════╗
       │  ║  LAYER 1: LanguageTool                       ║
       │  ║  Docker :8081 → grammar/spelling errors     ║
       │  ║  Input: text                                 ║
       │  ║  Output: [{offset, length, message, ...}]   ║
       │  ║  Fallback: [] khi service unavailable       ║
       │  ╚═══════════╤═══════════════════════════════════╝
       │              ▼
       │  ╔═══════════════════════════════════════════════╗
       │  ║  LAYER 2: RuleBasedScoring                   ║
       │  ║  PHP deterministic — text metrics + caps     ║
       │  ║  Metrics: word_count, sentence_count,        ║
       │  ║           errors/sentence, unique_ratio,     ║
       │  ║           linking_words, paragraph_count     ║
       │  ║  Caps: grammar ≤ 1.5 (eps > 1.0)            ║
       │  ║         grammar ≤ 2.5 (eps > 0.5)            ║
       │  ║         task_achievement ≤ 2.0 (< 80 words)  ║
       │  ║         lexical ≤ 2.0 (unique < 40%)         ║
       │  ║         coherence ≤ 2.0 (< 2 paragraphs)     ║
       │  ║  Flags: severely_under_word_count,           ║
       │  ║         high_error_rate,                     ║
       │  ║         no_paragraph_structure               ║
       │  ║  Output: {caps, metrics, flags}             ║
       │  ╚═══════════╤═══════════════════════════════════╝
       │              ▼
       │  ╔═══════════════════════════════════════════════╗
       │  ║  LAYER 3: LLM Grading                        ║
       │  ║  LlmGradingService → StructuredGradingAgent  ║
       │  ║  Model: GPT-5.4 (config: grading.llm.model)  ║
       │  ║  Prompt: text + prompt + grammar errors     ║
       │  ║           + metrics + caps context           ║
       │  ║  Structured output schema:                   ║
       │  ║    rubric_scores: {task_achievement,          ║
       │  ║                    coherence, lexical,        ║
       │  ║                    grammar} ← [0.0, 4.0]     ║
       │  ║    overall_band: float ← [0.0, 10.0]         ║
       │  ║    strengths: string[]                        ║
       │  ║    improvements: [{message, explanation}]    ║
       │  ║    rewrites: [{original, improved, reason}]  ║
       │  ║    annotations: string[]                      ║
       │  ║  Normalization: synonym key mapping,         ║
       │  ║                  clamp scores [0,4],          ║
       │  ║                  fill fallback defaults       ║
       │  ║  Throws: RuntimeException → GradeJob retries ║
       │  ╚═══════════╤═══════════════════════════════════╝
       │              ▼
       │  ╔═══════════════════════════════════════════════╗
       │  ║  LAYER 4: Reconcile (Rule vs LLM)            ║
       │  ║  final = min(llm_score, cap) per criterion   ║
       │  ║  Ensures LLM "generosity" bounded by rules  ║
       │  ╚═══════════════════════════════════════════════╝
       │
       ▼
WritingGradingResult (versioning)
  ├── Advisory lock: pg_advisory_xact_lock(type+id hash)
  ├── Old results → is_active = false
  ├── New result → version++ , is_active = true
  └── GradingJob → status = ready
       │
       ▼ (DB::afterCommit)
  GradingCompleted event
       ├── SendGradingNotification → "Bài viết đã chấm xong"
       └── UpdateExamSessionOnGradingEvent → exam status graded

  ── FAILURE PATH ──
  (sau 3 retries exhausted)
       │
       ▼
  GradeJob::failed()
    ├── GradingJob → status = failed, last_error = message
    └── GradingFailed event
         └── NotifyGradingFailure → "Chấm bài thất bại"
```

---

## 2. Grading Pipeline (Speaking)

```
USER submit bài nói
  │
  ▼
SpeakingPracticeController / ExamController
  │  POST /practice/speaking/vstep-sessions/{id}/submit
  │  POST /exam-sessions/{id}/submit
  ▼
GradingService::enqueue()
  ├── Tạo GradingJob (status=pending)
  └── Dispatch GradeJob
       │
       ▼
GradingService::process()
  ├── status → processing
  │
  └── SpeakingGradingStrategy::grade()
       │
       │  ╔═══════════════════════════════════════════════╗
       │  ║  STEP 1: Speech-to-Text                      ║
       │  ║  Azure Cognitive Services REST API           ║
       │  ║  audio/webm; codecs=opus → text              ║
       │  ║  Endpoint: {region}.stt.speech.microsoft.com ║
       │  ║  Output: {text, confidence, duration_ms}     ║
       │  ║  Side effect: persist transcript on submission║
       │  ║  Fallback: mock khi AZURE_SPEECH_KEY rỗng   ║
       │  ║  Throws: GradingFailedException nếu thất bại ║
       │  ╚═══════════╤═══════════════════════════════════╝
       │              ▼
       │  ╔═══════════════════════════════════════════════╗
       │  ║  STEP 2: LLM Grading                         ║
       │  ║  LlmGradingService.gradeSpeaking(transcript) ║
       │  ║  Model: GPT-5.4                              ║
       │  ║  Structured output (no rules layer needed):  ║
       │  ║    rubric_scores: {fluency, pronunciation,    ║
       │  ║                    content, vocab, grammar}   ║
       │  ║    overall_band, strengths, improvements     ║
       │  ╚═══════════════════════════════════════════════╝
       │
       ▼
SpeakingGradingResult (versioning)
  └── Same versioning + advisory lock pattern as writing
       │
       ▼
  GradingCompleted → notification + exam session update
```

---

## 3. Conversation Roleplay (synchronous AI)

```
USER bắt đầu hội thoại
  │
  ▼
POST /practice/speaking/conversations
  │  SpeakingConversationService::startSession()
  ├── Load scenario (character, system_prompt, target_vocab)
  ├── Generate IPA for opening line (cached or runtime LLM)
  └── Create session + AI opening turn
       │
       ▼
┌───────────────── LOOP: mỗi lượt user nói ─────────────────┐
│                                                             │
│  POST /practice/speaking/conversations/{id}/turn            │
│    │                                                        │
│    ▼                                                        │
│  SpeakingConversationService::submitTurn()                  │
│    │                                                        │
│    ├── Build prompt: character + history + user text        │
│    │   + target vocab pre-check                            │
│    │                                                        │
│    ├── ╔══════════════════════════════════════════╗        │
│    │   ║  SINGLE LLM CALL                         ║        │
│    │   ║  Workers AI → Llama Scout 17B            ║        │
│    │   ║  /chat/completions (direct HTTP)         ║        │
│    │   ║  Prompt includes:                        ║        │
│    │   ║    1. GRADE user grammar + vocab         ║        │
│    │   ║    2. REPLY as character                 ║        │
│    │   ║    3. SUGGEST next phrases               ║        │
│    │   ║    4. IPA transcriptions                 ║        │
│    │   ║  1 call = grade + reply (avoids 429)     ║        │
│    │   ║  Timeout: 30s                            ║        │
│    │   ║  Max tokens: 800                         ║        │
│    │   ║  Throws: AiServiceUnavailableException   ║        │
│    │   ║          → FE hiển thị nút retry         ║        │
│    │   ╚══════════╤══════════════════════════════╝        │
│    │              ▼                                        │
│    │   normalizeTurnResponse()                              │
│    │   ├── Extract: feedback, reply, suggested_words       │
│    │   ├── Handle varying LLM key names                    │
│    │   ├── Reconcile vocab_check with pre-check            │
│    │   └── Return normalized structure                     │
│    │                                                        │
│    └── DB transaction (lockForUpdate):                      │
│        ├── Insert user turn + grade feedback               │
│        ├── Insert AI turn + suggested words + IPA          │
│        └── Update session counters (turns, vocab, grammar) │
│                                                             │
│  USER kết thúc                                              │
│    │                                                        │
│    ▼                                                        │
│  POST /practice/speaking/conversations/{id}/end             │
│    └── Status → Ended, duration_seconds                     │
│                                                             │
│  USER xem review                                            │
│    │                                                        │
│    ▼                                                        │
│  GET /practice/speaking/conversations/{id}/review           │
│    │                                                        │
│    └── ╔══════════════════════════════════════════╗        │
│        ║  ConversationReviewAgent                  ║        │
│        ║  Workers AI → Llama Scout 17B             ║        │
│        ║  Input: full conversation history         ║        │
│        ║  Output: strengths, improvements,         ║        │
│        ║          corrected_sentences, tip         ║        │
│        ║  Max tokens: 1000                         ║        │
│        ╚══════════════════════════════════════════╝        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Pronunciation review (standalone):
  POST /practice/speaking/pronunciation-review
    ├── Input: original text + student transcript
    └── LLM → {pronunciation, intonation, tip}
    ⚠️ Rate limited: config('practice.rate_limits.pronunciation_review')
```

---

## 4. Hỗ trợ NLP Services

```
┌──────────────────────────────────────────────────────────────┐
│  LanguageTool (self-hosted Docker :8081)                     │
│  ─────────────────────────────────                           │
│  Endpoint: {base}/v2/check                                   │
│  Input: text + language (en-US)                              │
│  Output: [{offset, length, message, category, rule_id,       │
│            replacements}]                                    │
│                                                              │
│  ⚡️ Deterministic — same input → same output                │
│  ⚡️ Used in: WritingGradingStrategy Layer 1                 │
│  ⚡️ Also exposed: LanguageToolService::toAnnotations()      │
│     → converts to grading annotation format                  │
│  ⚡️ Health check: GET /v2/languages (timeout 2s)            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Azure Speech-to-Text                                        │
│  ──────────────────                                          │
│  Endpoint: {region}.stt.speech.microsoft.com                 │
│  Input: audio/webm; codecs=opus (binary)                     │
│  Output: {DisplayText, NBest[0]{Confidence}, Duration}       │
│                                                              │
│  ⚡️ Used in: SpeakingGradingStrategy Step 1                 │
│  ⚡️ transcribeFromStorage(): R2 key → download → transcribe │
│  ⚡️ Fallback: mock transcription khi key rỗng               │
│  ⚡️ Timeout: 30s                                            │
│  ⚡️ Config: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  NLP Sidecar (Python FastAPI :8082)                          │
│  ────────────────────────────────                             │
│  Endpoints:                                                   │
│    POST /grammar/check {text}                                 │
│      → GECToR token-level error detection                    │
│      → [{token, position, tag, correction, error_type}]      │
│    POST /cefr/predict {text}                                 │
│      → CEFR level prediction + confidence                    │
│      → {predicted_level, confidence, all_levels}             │
│                                                              │
│  ⚡️ Trạng thái: đã có service nhưng chưa wired vào          │
│     grading pipeline (LanguageTool đang được dùng thay)     │
│  ⚡️ Graceful fallback: empty/null khi unavailable           │
│  ⚡️ Health check: GET /health → {"status":"ok"}             │
│  ⚡️ Config: NLP_SIDECAR_URL (default http://localhost:8082) │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Event-Driven Grading Lifecycle

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PENDING    │───▶│  PROCESSING  │───▶│    READY     │
│ (queue chờ)  │    │ (LLM running)│    │ (hoàn thành) │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                           │                   │
                           │ retry (max 3)     │ GradingCompleted
                           │ exponential       ├─ SendGradingNotification
                           │ backoff           └─ UpdateExamSessionOnGradingEvent
                           │
                           ▼
                    ┌──────────────┐
                    │   FAILED     │
                    │ (3 retries)  │──── GradingFailed
                    └──────────────┘     └─ NotifyGradingFailure

Concurrency protection:
  - Partial unique index: (submission_type, submission_id)
    WHERE status IN (pending, processing)
    → Chỉ 1 job active cho 1 submission
  - pg_advisory_xact_lock(type+id hash) trong persistResult()
    → Serialize concurrent writes vào grading result
  - Version-based results: mỗi lần regrade → version mới
    is_active=true cho version mới nhất
```

---

## 6. AI Agent Inventory

| Agent | Provider | Model | Use case | Timeout |
|-------|----------|-------|----------|---------|
| StructuredGradingAgent | `llm` | GPT-5.4 | Grading writing + speaking rubric | 60s |
| ConversationTurnAgent | `workers-ai` | Llama Scout 17B | Grade user turn + generate AI reply (1 call) | 30s |
| ConversationReviewAgent | `workers-ai` | Llama Scout 17B | End-of-conversation review | 30s |

> **Note:** ConversationTurnAgent gộp grading + reply trong 1 call duy nhất (tránh rate limit 429). ConversationGradingAgent và ConversationReplyAgent đã bị xóa.

---

## 7. Gateway Architecture

```
Laravel AI SDK
  │
  ├─ OpenAiGateway (built-in)
  │
  ├─ LocalOpenAiGateway extends OpenAiGateway
  │   └── Override: bỏ max_output_tokens (OpenAI Responses API không hỗ trợ local)
  │   └── Override: continueWithToolResults hỗ trợ structured output
  │   └── Custom client(): support custom auth_header + url
  │
  └─ ChatCompletionsGateway extends LocalOpenAiGateway
      └── Build request body cho /chat/completions format
      └── Structured output: response_format = json_schema, strict=true
      └── Tool calling: map tools → function definitions
      └── Schema mapping: Type → JSON Schema (recursive object/array)
      └── Extract tool calls from /chat/completions response format
```

---

## 8. Config & DI Wiring

**File:** `config/ai.php`

```php
'llm' => [
    'driver' => 'chat-completions',  // → ChatCompletionsGateway
    'key'    => env('LLM_API_KEY'),
    'url'    => env('LLM_BASE_URL'),  // Cloudflare AI Gateway
    'models' => ['text' => ['default' => env('LLM_MODEL', 'gpt-5.4')]],
],
'workers-ai' => [
    'driver' => 'chat-completions',  // → ChatCompletionsGateway
    'key'    => env('LLM_API_KEY'),
    'url'    => env('WORKERS_AI_URL'), // Cloudflare Workers AI
    'models' => ['text' => ['default' => env('WORKERS_AI_MODEL', '@cf/meta/llama-4-scout-17b-16e-instruct')]],
],
```

**File:** `app/Providers/AppServiceProvider.php`

```php
// Interfaces → implementations
LlmGrader::class       → LlmGradingService::class
SpeechToText::class    → SpeechToTextService::class

// Strategy registry
GradingStrategyResolver([WritingGradingStrategy, SpeakingGradingStrategy])

// AI driver registration
'local'           → LocalOpenAiGateway
'chat-completions' → ChatCompletionsGateway
```

---

## 9. Error Handling

| Exception | Scope | HTTP Code | Behavior |
|-----------|-------|-----------|----------|
| `GradingFailedException` | Queue-level | - | GradeJob::failed() → status=failed, 3 retries |
| `AiServiceUnavailableException` | Sync (conversation) | 503 | FE hiển thị retry button, retry_after: 5s |
| `\RuntimeException` (LLM invalid JSON) | Queue-level | - | GradeJob retry → after 3: permanent fail |

---

## 10. Testing

| Component | Fake/Stub | Location |
|-----------|-----------|----------|
| LlmGrader | FakeLlmGrader | tests/Support/FakeLlmGrader.php |
| SpeechToText | FakeSpeechToText | tests/Support/FakeSpeechToText.php |
| Grading Pipeline | GradingPipelineTest | tests/Feature/Grading/GradingPipelineTest.php |

Queue driver = `sync` trong test → grading chạy đồng bộ, không cần mock queue.

---

## Tham chiếu

| Doc | Nội dung |
|-----|---------|
| [RFC 0005 — Grading Pipeline](rfcs/0005-grading-pipeline.md) | Thiết kế grading ban đầu |
| [RFC 0007 — Grading Layers](rfcs/0007-grading-layers.md) | Phân tầng LanguageTool + LLM |
| [RFC 0020 — Service Decomposition](rfcs/0020-exam-grading-service-decomposition.md) | Tách service exam + grading |
| [Architecture Overview](architecture-overview.md) | Tổng quan kiến trúc backend |

## 11. Prompt Templates (Blade)

Tất cả prompt được tách ra Blade templates trong `resources/ai/`:

```
resources/ai/
├── conversation/
│   ├── turn.blade.php          # 1 call: grade + reply + IPA
│   ├── review.blade.php        # End-of-session analysis
│   └── pronunciation.blade.php # Pronunciation feedback
└── grading/
    ├── writing.blade.php       # Task prompt + text + metrics + caps
    └── speaking.blade.php      # Transcript only
```

Service gọi: `view('ai.conversation.turn', $data)->render()`

> **2026-05-25:** Tách prompt từ string concat trong service sang Blade templates. Dọn dead code: ConversationGradingAgent, ConversationReplyAgent (thay bởi ConversationTurnAgent), NlpSidecarService (chưa wired). Sửa config `grading.llm.model` → `ai.providers.llm.models.text.default`.
