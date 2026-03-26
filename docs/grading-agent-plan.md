# Kế hoạch: Chuyển Grading Service sang Laravel Prism AI Agent

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

## Đề xuất: Laravel Prism AI Agent với Tool Calling

Thay Python service bằng **AI Agent** chạy trong Laravel Queue Job. Agent có **tools** để tra cứu rubric, knowledge points, scoring table từ DB. Agent loop: reasoning → tool call → reasoning → output.

### Kiến trúc mới

```
FE submit → Laravel API → dispatch GradeSubmission Job
                                    ↓
                            Prism Agent Loop
                            ├─ Tool: GetRubric(skill, level)
                            ├─ Tool: GetKnowledgePoints(questionId) 
                            ├─ Tool: GetScoreTable(skill)
                            ├─ Tool: AnalyzeGrammar(text)
                            └─ Agent output: WritingGrade / SpeakingGrade
                                    ↓
                            Update submission + progress + notification
```

### Xóa gì

- `apps/grading/` — toàn bộ Python service (giữ prompts làm reference)
- Docker: grading container, grading env vars
- `GradingDispatcher`, grading config, grading Redis streams references

### Thêm gì

#### 1. Package

```bash
composer require prism-php/prism
```

#### 2. Tools (4 classes)

```
app/
  Grading/
    Tools/
      GetRubricTool.php          # Query VSTEP rubric criteria từ DB/config
      GetKnowledgePointsTool.php  # Query knowledge points gắn với question
      GetScoreTableTool.php       # Trả band thresholds + rounding rules
      AnalyzeGrammarTool.php      # Phân tích lỗi ngữ pháp cụ thể
    Schemas/
      WritingGradeSchema.php      # Structured output: scores + feedback + gaps
      SpeakingGradeSchema.php     # Structured output cho speaking
    Prompts/
      writing-system.blade.php    # System prompt cho writing grading agent
      speaking-system.blade.php   # System prompt cho speaking grading agent
    GradingAgent.php              # Orchestrator: chọn tools, run Prism, parse output
```

#### 3. Data cần seed

**VSTEP Rubric Table** — hiện tại rubric nằm hardcode trong Python prompt. Cần đưa vào DB hoặc config:

```
vstep_rubrics:
  - skill: writing
    level: B2
    criteria:
      task_fulfillment: "Completes task, covers all points, appropriate length"
      organization: "Clear structure, logical flow, cohesive devices"
      vocabulary: "Range appropriate for level, some less common items"
      grammar: "Mix of simple and complex structures, few errors"
    band_descriptors:
      9-10: "Excellent — native-like control"
      7-8: "Good — consistent accuracy with minor slips"
      5-6: "Adequate — meaning clear despite errors"
      3-4: "Limited — frequent errors impede communication"
      1-2: "Very limited — barely comprehensible"
```

**Knowledge Point mapping** — Question ↔ KnowledgePoint relation đã có trong DB (`question_knowledge_point` pivot table). Agent dùng tool query để biết question test kiến thức gì → feedback cụ thể.

#### 4. GradeSubmission Job (rewrite)

```php
class GradeSubmission implements ShouldQueue
{
    public function handle(GradingAgent $agent): void
    {
        $submission = Submission::with('question.knowledgePoints')->findOrFail($this->submissionId);
        
        $result = $agent->grade($submission);
        
        // result contains: score, band, criteria_scores, feedback, knowledge_gaps, confidence
        
        $submission->update([...]);
        // Update progress, notify, etc.
    }
}
```

#### 5. GradingAgent

```php
class GradingAgent
{
    public function grade(Submission $submission): GradeResult
    {
        $skill = $submission->skill;
        $prompt = view("grading.prompts.{$skill->value}-system")->render();
        
        $response = Prism::structured()
            ->using(config('grading.provider'), config('grading.model'))
            ->withSystemPrompt($prompt)
            ->withPrompt($this->buildUserPrompt($submission))
            ->withSchema($skill === Skill::Writing ? WritingGradeSchema::class : SpeakingGradeSchema::class)
            ->withTools([
                new GetRubricTool(),
                new GetKnowledgePointsTool(),
                new GetScoreTableTool(),
                new AnalyzeGrammarTool(),
            ])
            ->withMaxSteps(5)
            ->generate();
        
        return GradeResult::from($response->structured);
    }
}
```

#### 6. Agent Loop Example (writing)

```
Agent: Tôi cần chấm bài writing B2 essay. Tra rubric trước.
→ Tool call: GetRubric(skill=writing, level=B2)
← Tool result: {task_fulfillment: "...", organization: "...", vocabulary: "...", grammar: "..."}

Agent: Bài này test knowledge points gì?
→ Tool call: GetKnowledgePoints(questionId=xxx)
← Tool result: [{name: "Essay structure", category: "writing"}, {name: "Cohesive devices", category: "discourse"}]

Agent: Phân tích ngữ pháp.
→ Tool call: AnalyzeGrammar(text="Social media has both...")
← Tool result: {errors: [{offset: 45, message: "Subject-verb agreement", suggestion: "..."}], score: 7.5}

Agent: Dựa trên rubric B2, bài này:
- Task fulfillment: 6 (covers topic but lacks specific examples)
- Organization: 7 (clear structure, good transitions)
- Vocabulary: 7 (appropriate range, some repetition)
- Grammar: 8 (few errors, good variety)

→ Tool call: GetScoreTable(skill=writing)
← Tool result: {formula: "(task1 + task2*2)/3", rounding: "vstep", band_thresholds: {...}}

Output: {
  overallScore: 7.0,
  band: "B2",
  criteriaScores: {task_fulfillment: 6, organization: 7, vocabulary: 7, grammar: 8},
  feedback: "Bài viết có cấu trúc rõ ràng...",
  knowledgeGaps: ["essay_examples", "cohesive_variety"],
  confidence: "high"
}
```

### 7. Speaking flow

```
FE ghi âm → Cloudflare Worker (STT) → transcript text
FE submit: {transcript: "...", durationSeconds: 45, partNumber: 2}
Laravel → GradeSubmission Job → Prism Agent (same loop, different rubric + schema)
```

CF Worker:
```js
// workers/stt/index.js
export default {
  async fetch(request, env) {
    const audio = await request.arrayBuffer();
    const result = await env.AI.run('@cf/openai/whisper', { audio: [...new Uint8Array(audio)] });
    return Response.json({ transcript: result.text });
  }
}
```

### 8. Config

```env
# .env
GRADING_PROVIDER=openai
GRADING_MODEL=gpt-4o
GRADING_FALLBACK_PROVIDER=anthropic
GRADING_FALLBACK_MODEL=claude-sonnet-4-20250514
```

```php
// config/grading.php
return [
    'provider' => env('GRADING_PROVIDER', 'openai'),
    'model' => env('GRADING_MODEL', 'gpt-4o'),
    'fallback_provider' => env('GRADING_FALLBACK_PROVIDER'),
    'fallback_model' => env('GRADING_FALLBACK_MODEL'),
    'max_steps' => 5,
    'timeout' => 90,
];
```

### 9. Docker Compose (simplified)

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

4 containers → 4 containers (bỏ grading, giữ horizon). Thực tế bớt 1 service.

## Migration Steps

1. **Install Prism** — `composer require prism-php/prism`, config providers
2. **Seed rubric data** — VSTEP rubric vào config hoặc DB
3. **Build Tools** — 4 tool classes, test từng cái độc lập
4. **Build Agent** — `GradingAgent` class, test với mock LLM
5. **Rewrite Job** — `GradeSubmission` dùng `GradingAgent`
6. **Test end-to-end** — submit writing → agent loop → score + feedback + gaps
7. **Build CF Worker** — STT endpoint, deploy lên Cloudflare
8. **Test speaking** — FE record → CF Worker STT → submit transcript → agent grade
9. **Xóa Python** — remove `apps/grading/`, update docker-compose
10. **Update AGENTS.md** — document new architecture

## Timeline (ước tính)

| Step | Effort | Blocker |
|------|--------|---------|
| 1-2 | 1h | Cần Prism compatible PHP 8.4 |
| 3-4 | 3h | Core work |
| 5-6 | 2h | Integration |
| 7 | 1h | Cần CF account |
| 8-9 | 1h | Cleanup |
| 10 | 30m | Docs |
| **Total** | **~8h** | |

## Risks

- **Prism + PHP 8.4 + Laravel 13** — Prism có thể chưa support Laravel 13. Cần check compatibility.
- **LLM tool calling quality** — Agent có thể gọi tool sai hoặc loop vô hạn. `maxSteps(5)` giới hạn.
- **Cost** — Agent loop gọi LLM nhiều lần hơn single prompt. Mỗi grading = 2-4 LLM calls thay vì 1. Mitigate: cache rubric trong prompt thay vì tool call mỗi lần.
- **Latency** — Multi-step = chậm hơn. 1 prompt ~5s, agent loop ~15-20s. Acceptable cho async grading.

## Decision Points cần thảo luận

1. **Rubric storage**: Config file (simple) vs DB table (flexible, admin editable)?
2. **Grammar tool**: LLM-based (đơn giản) vs LanguageTool API (chính xác hơn)?
3. **Knowledge gap output**: Lưu vào submission result vs tạo bảng riêng `user_knowledge_gaps`?
4. **CF Worker**: Deploy riêng hay dùng Cloudflare Pages Functions?
5. **Fallback**: Nếu Prism không support Laravel 13, dùng `openai-php/laravel` trực tiếp?
