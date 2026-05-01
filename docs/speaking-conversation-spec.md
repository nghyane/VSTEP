# Speaking Conversation (AI Roleplay) — Backend Spec

Status: **Ready for BE implementation**.
FE mock: `apps/frontend-v3/src/features/practice/components/Conversation*.tsx`.

## 1. Tổng quan

Hội thoại AI: user roleplay 1-1 với nhân vật AI. Mỗi lượt user nói, hệ thống chấm vocab/grammar + AI trả lời tiếp.

- Không tính vào spider chart (chỉ exam mới vào chart).
- Không grading rubric VSTEP. Mỗi turn chỉ check vocab + grammar nhanh + gợi ý câu tốt hơn.
- End-of-session: summary count, không overall band.

## 2. STT: Web Speech API (FE-side)

**Không dùng Azure STT.** FE dùng `SpeechRecognition` API (browser-native) chuyển giọng nói → text ngay trên client. BE chỉ nhận text transcript, không nhận audio file.

Lý do:
- Miễn phí 100%, không giới hạn request.
- Chrome/Edge/Safari dùng Google STT server — chất lượng tốt cho tiếng Anh.
- Giảm complexity BE: bỏ `AudioStorageService`, bỏ `SpeechToTextService` khỏi conversation flow.
- Giảm payload: JSON text thay vì multipart audio upload.

## 3. LLM Provider

Dùng provider `llm` đã config sẵn trong `config/ai.php`:
- Gateway: Cloudflare AI Gateway (`LLM_BASE_URL`)
- Model: `openai/gpt-5.4-mini` (`LLM_MODEL`)
- Key: `LLM_API_KEY` (đã có trong `.env`)

Không cần thêm API key mới.

## 4. Database

### 4.1 `practice_speaking_scenarios` (content — admin seed)

```php
Schema::create('practice_speaking_scenarios', function (Blueprint $t) {
    $t->uuid('id')->primary();
    $t->string('slug', 80)->unique();
    $t->string('title', 200);
    $t->string('level', 2);                    // A1 | A2 | B1 | B2 | C1
    $t->string('character_name', 80);
    $t->string('character_voice_label', 40);   // UI label "us Sierra"
    $t->text('description');                   // Block KỊCH BẢN
    $t->text('system_prompt');                 // LLM persona prompt (server-only)
    $t->text('opening_line');                  // Câu AI mở đầu (không gọi LLM)
    $t->json('target_vocab');                  // string[] — phrase user nên dùng
    $t->smallInteger('estimated_minutes');
    $t->smallInteger('expected_turns');        // 4-10
    $t->boolean('is_published')->default(true);
    $t->timestamps();

    $t->index(['is_published', 'level']);
});
```

Seed 3 scenarios:
- `greeting-a-new-colleague` — A1, Patricia
- `ordering-at-a-cafe` — A2, James
- `first-job-interview` — B1, Linda

### 4.2 `practice_speaking_conversation_sessions`

```php
Schema::create('practice_speaking_conversation_sessions', function (Blueprint $t) {
    $t->uuid('id')->primary();
    $t->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
    $t->foreignUuid('scenario_id')
        ->constrained('practice_speaking_scenarios')->cascadeOnDelete();
    $t->string('status', 20);                  // active | ended
    $t->timestamp('started_at');
    $t->timestamp('ended_at')->nullable();
    $t->integer('duration_seconds')->nullable();
    $t->smallInteger('user_turn_count')->default(0);
    $t->smallInteger('vocab_used_count')->default(0);
    $t->smallInteger('vocab_target_count')->default(0);
    $t->smallInteger('grammar_ok_count')->default(0);
    $t->timestamps();

    $t->index(['profile_id', 'started_at']);
});
```

### 4.3 `practice_speaking_conversation_turns`

```php
Schema::create('practice_speaking_conversation_turns', function (Blueprint $t) {
    $t->uuid('id')->primary();
    $t->foreignUuid('session_id')
        ->constrained('practice_speaking_conversation_sessions')->cascadeOnDelete();
    $t->smallInteger('turn_index');
    $t->string('role', 8);                     // ai | user
    $t->text('text');
    $t->json('feedback')->nullable();          // user turn only — schema §5.2
    $t->json('suggested_words')->nullable();   // ai turn only — string[]
    $t->timestamp('created_at')->useCurrent();

    $t->unique(['session_id', 'turn_index']);
    $t->index('session_id');
});
```

## 5. API Endpoints

Auth: `auth:api` + `profile.required`. Response wrap `{ data: T }`.

### 5.1 `GET /practice/speaking/scenarios`

Query: `level?`. Không trả `system_prompt`, `opening_line`, `target_vocab`.

```json
{
  "data": [{
    "id": "uuid",
    "slug": "greeting-a-new-colleague",
    "title": "Greeting a new colleague",
    "level": "A1",
    "character_name": "Patricia",
    "character_voice": "us Sierra",
    "description": "Patricia is your new colleague...",
    "estimated_minutes": 5
  }]
}
```

### 5.2 `POST /practice/speaking/conversations`

Body: `{ scenario_id: uuid }`.

BE: tạo session (status=active) + insert turn 0 (role=ai, text=scenario.opening_line). **Không gọi LLM.**

```json
{
  "data": {
    "session_id": "uuid",
    "scenario": { "...full trừ system_prompt..." },
    "turns": [{
      "id": "uuid",
      "role": "ai",
      "text": "Hi there! I just started working here today...",
      "feedback": null,
      "suggested_words": []
    }]
  }
}
```

201 Created.

### 5.3 `POST /practice/speaking/conversations/{sessionId}/turn`

Body (JSON, không multipart):
```json
{
  "text": "Nice to meet you too. My name is Fack.",
  "confidence": 0.87
}
```

Validation: `text: required|string|min:1|max:1000`, `confidence: required|numeric|min:0|max:1`.

Guard: session.profile_id match, session.status === 'active'.
Reject: confidence < 0.3 → 422 `{ error: "low_confidence", message: "Không nghe rõ. Vui lòng nói lại." }`.

Pipeline (2 LLM calls chạy song song):

```
1. Validate + guard
2. Song song:
   a. ConversationGradingAgent.grade(scenario, user_text)
      → { word_count, grammar_ok, vocab_check, better }
   b. ConversationReplyAgent.reply(scenario, prior_turns, user_text)
      → { text, suggested_words }
3. Insert user turn (role=user, text, feedback=grading_result)
4. Insert ai turn (role=ai, text=reply, suggested_words)
5. Update session aggregates
6. Return
```

Response:
```json
{
  "data": {
    "user_turn": {
      "id": "uuid",
      "role": "user",
      "text": "Nice to meet you too. My name is Fack.",
      "feedback": {
        "word_count": { "used": 2, "target": 3 },
        "grammar_ok": true,
        "vocab_check": [
          { "phrase": "My name is", "used": true },
          { "phrase": "Nice to meet you too", "used": true },
          { "phrase": "Welcome to the company", "used": false }
        ],
        "better": "Nice to meet you too. I'm Fack."
      }
    },
    "ai_turn": {
      "id": "uuid",
      "role": "ai",
      "text": "Hello Fack! It is nice to meet you too...",
      "feedback": null,
      "suggested_words": ["Which department?", "I am happy", "Welcome"]
    },
    "session": {
      "user_turn_count": 1,
      "expected_turns": 6,
      "should_end": false
    }
  }
}
```

### 5.4 `POST /practice/speaking/conversations/{sessionId}/end`

Set status=ended, tính summary.

```json
{
  "data": {
    "session_id": "uuid",
    "duration_seconds": 312,
    "user_turn_count": 6,
    "vocab_used_count": 14,
    "vocab_target_count": 18,
    "grammar_ok_count": 5,
    "vocab_used_pct": 78,
    "grammar_ok_pct": 83
  }
}
```

### 5.5 `GET /practice/speaking/conversations/{sessionId}`

Trả full scenario + all turns. Dùng cho resume (F5) và xem lại.

### 5.6 `GET /practice/speaking/conversations/history`

Paginated. Sessions status=ended.

## 6. AI Agents

Cả 2 agent dùng provider `llm` (Cloudflare → GPT-5.4-mini), theo pattern `StructuredGradingAgent`.

### 6.1 `ConversationGradingAgent`

Chấm 1 user turn. Schema:
```php
[
  'word_count' => $schema->object([
    'used' => $schema->integer(),
    'target' => $schema->integer(),
  ]),
  'grammar_ok' => $schema->boolean(),
  'vocab_check' => $schema->array()->items(
    $schema->object([
      'phrase' => $schema->string(),
      'used' => $schema->boolean(),
    ])
  ),
  'better' => $schema->string()->nullable(),
]
```

Prompt:
```
Scenario: {title} (level {level})
Target phrases: {target_vocab}
User said: "{text}"

Check each target phrase (case-insensitive, allow paraphrase).
grammar_ok = true if no major errors.
better = ONE rewrite if improvable, null if already good.
```

Pre-check rule-based: `Str::contains` lowercase trước, gửi kèm vào prompt để LLM chỉ override khi paraphrase.

### 6.2 `ConversationReplyAgent`

Sinh câu AI tiếp. Schema:
```php
[
  'text' => $schema->string(),
  'suggested_words' => $schema->array()->items($schema->string()),
]
```

Prompt:
```
You are {character_name}. {system_prompt}
Level: {level}. Use vocabulary at this level only.
Conversation: {turns_serialized}
User: "{text}"

Reply as {character_name} in 1-2 sentences (max 30 words).
Suggest 2-4 short phrases user could say next (each ≤ 4 words).
```

### 6.3 Song song

```php
[$grading, $reply] = Concurrency::run([
    fn() => $this->gradingAgent->grade(...),
    fn() => $this->replyAgent->reply(...),
]);
```

Giảm latency từ ~6s xuống ~3s.

## 7. Service & Controller

### Service: `SpeakingConversationService`

```php
class SpeakingConversationService
{
    public function __construct(
        private ConversationReplyAgent $replyAgent,
        private ConversationGradingAgent $gradingAgent,
    ) {}

    public function listScenarios(?string $level): Collection;
    public function startSession(Profile $profile, string $scenarioId): array;
    public function submitTurn(Profile $profile, string $sessionId, string $text, float $confidence): array;
    public function endSession(Profile $profile, string $sessionId): array;
    public function getSession(Profile $profile, string $sessionId): array;
    public function listHistory(Profile $profile): LengthAwarePaginator;
}
```

### Controller: `SpeakingConversationController`

7 methods, mỗi method ≤ 15 LOC.

### Routes (`routes/api.php`)

```php
Route::get('/practice/speaking/scenarios', [SpeakingConversationController::class, 'listScenarios']);
Route::get('/practice/speaking/scenarios/{id}', [SpeakingConversationController::class, 'showScenario']);
Route::post('/practice/speaking/conversations', [SpeakingConversationController::class, 'start']);
Route::get('/practice/speaking/conversations/history', [SpeakingConversationController::class, 'history']);
Route::get('/practice/speaking/conversations/{sessionId}', [SpeakingConversationController::class, 'show']);
Route::post('/practice/speaking/conversations/{sessionId}/turn', [SpeakingConversationController::class, 'submitTurn']);
Route::post('/practice/speaking/conversations/{sessionId}/end', [SpeakingConversationController::class, 'end']);
```

`/history` trước `/{sessionId}` (route ordering).

### FormRequests

- `StartConversationRequest` — `scenario_id: required|uuid`
- `SubmitTurnRequest` — `text: required|string|min:1|max:1000`, `confidence: required|numeric|min:0|max:1`

## 8. Models

- `PracticeSpeakingScenario` — casts: `target_vocab: array`
- `PracticeSpeakingConversationSession` — belongsTo scenario, profile; hasMany turns
- `PracticeSpeakingConversationTurn` — casts: `feedback: array`, `suggested_words: array`

## 9. Migration order

```
2026_05_xx_000001_create_practice_speaking_scenarios_table.php
2026_05_xx_000002_create_practice_speaking_conversation_sessions_table.php
2026_05_xx_000003_create_practice_speaking_conversation_turns_table.php
2026_05_xx_000004_seed_initial_scenarios.php
```

## 10. Tests

Mock `ConversationReplyAgent`, `ConversationGradingAgent` qua container binding.

- `SpeakingConversationStartTest` — tạo session + opening turn
- `SpeakingConversationSubmitTurnTest` — happy path; low confidence → 422
- `SpeakingConversationEndTest` — summary đúng
- `SpeakingConversationAuthTest` — cross-profile → 403; ended session → 409

## 11. FE contract

| FE file | Khi BE ready |
|---|---|
| `mock-conversation.ts` | Xoá, thay bằng queries |
| `Conversation*.tsx` | Giữ nguyên, wire query/mutation |
| `useVoiceRecorder` | Thay bằng `useSpeechRecognition` (Web Speech API) |
| Types trong `types.ts` | Giữ nguyên, match spec §5 |

## 12. Acceptance criteria

- [ ] Migrations + seed 3 scenarios chạy clean
- [ ] 7 endpoints trả đúng shape
- [ ] Low confidence reject 422
- [ ] Profile guard: cross-profile → 403, ended session → 409
- [ ] 2 LLM agents chạy song song
- [ ] Tests pass: `php artisan test --filter=SpeakingConversation`
- [ ] `./vendor/bin/pint --dirty` clean
