---
RFC: 0007
Title: AI Grading Pipeline — Layer Architecture
Status: Accepted
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0007 — AI Grading Pipeline — Layer Architecture

## Summary

Mô tả chi tiết cách hệ thống chấm bài Writing/Speaking hoạt động qua 3 layer: Heuristic → LanguageTool → LLM. Mỗi layer có vai trò riêng, output riêng, và fallback riêng.

## Tổng quan pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER SUBMIT BÀI VIẾT                            │
│                                                                         │
│  "Dear Minh, I am writing to say sorry... I has to go to hospital..."  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 0: HEURISTIC (sync, 0ms, PHP thuần)                            │
│                                                                         │
│  Input:  text thuần                                                     │
│  Output: word_count, keyword_coverage, paragraph_count                  │
│  Vai trò: kiểm tra điều kiện cơ bản TRƯỚC khi gọi AI                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ • Đếm từ: 82 từ (min 100 → cảnh báo thiếu)                    │   │
│  │ • Keywords hit: "apologize" ✓, "explain" ✓, "suggest plan" ✓   │   │
│  │ • Paragraphs: 4 (OK)                                           │   │
│  │ • Basic regex: "I has" → subject-verb agreement flag            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Fallback: KHÔNG CÓ — layer này luôn chạy, không phụ thuộc service    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: LANGUAGETOOL (async, ~100ms, Docker container)               │
│                                                                         │
│  Service: LanguageToolService.php                                       │
│  Endpoint: POST http://localhost:8081/v2/check                          │
│  Input:  text thuần + language=en-US                                    │
│  Output: array of errors với OFFSET CHÍNH XÁC                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Error 1:                                                        │   │
│  │   offset: 67, length: 5                                         │   │
│  │   text gốc: "I has"                                             │   │
│  │   category: "Grammar — Subject-Verb Agreement"                  │   │
│  │   message: "The verb 'has' does not agree with 'I'"             │   │
│  │   suggestion: "have"                                            │   │
│  │                                                                 │   │
│  │ Error 2:                                                        │   │
│  │   offset: 95, length: 6                                         │   │
│  │   text gốc: "happen"                                            │   │
│  │   category: "Grammar — Verb Tense"                              │   │
│  │   message: "Use past tense here"                                │   │
│  │   suggestion: "happened"                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Đặc điểm:                                                             │
│  • Rule-based: 3000+ patterns, KHÔNG hallucinate                       │
│  • Deterministic: cùng input → cùng output MỌI LẦN                    │
│  • Offset chính xác: FE có thể highlight đúng vị trí lỗi              │
│  • Phân loại lỗi: Grammar, Typos, Punctuation, Style                  │
│  • KHÔNG đánh giá chất lượng tổng thể (không cho điểm)                │
│                                                                         │
│  Fallback: trả [] (mảng rỗng) nếu container không chạy                │
│  → Pipeline vẫn tiếp tục, chỉ thiếu annotations offset                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ grammar_errors[] truyền làm context
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: LLM — Gemini 3 Flash via Ollama (async, ~5-9s)              │
│                                                                         │
│  Service: GradingService.callLlmWritingGrading()                        │
│  Endpoint: POST http://localhost:11434/v1/chat/completions              │
│  Model: gemini-3-flash-preview (cloud inference qua Ollama)             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ SYSTEM PROMPT (rubric Bộ Giáo dục):                             │   │
│  │                                                                 │   │
│  │ "You are a VSTEP writing examiner. Grade using MOE rubric:      │   │
│  │  - Task Achievement (0-4): covers required points, tone         │   │
│  │  - Coherence & Cohesion (0-4): logical flow, linking            │   │
│  │  - Lexical Resource (0-4): vocabulary range, accuracy           │   │
│  │  - Grammatical Range & Accuracy (0-4): variety, errors          │   │
│  │                                                                 │   │
│  │  Overall band = (sum/16) × 10, rounded to 0.5.                 │   │
│  │                                                                 │   │
│  │  Return ONLY valid JSON: { rubric_scores, overall_band,         │   │
│  │  strengths[], improvements[], rewrites[] }"                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ USER MESSAGE:                                                   │   │
│  │                                                                 │   │
│  │ "Task prompt: Write a letter to apologize...                    │   │
│  │                                                                 │   │
│  │  Student's writing:                                             │   │
│  │  Dear Minh, I am writing to say sorry...                        │   │
│  │                                                                 │   │
│  │  Word count: 82                                                 │   │
│  │                                                                 │   │
│  │  Grammar errors detected by automated checker:                  │   │
│  │  - "The verb 'has' does not agree with 'I'" (offset 67)        │   │
│  │  - "Use past tense here" (offset 95)"                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Vai trò LLM:                                                           │
│  • KHÔNG cần detect grammar nữa (Layer 1 đã làm)                      │
│  • Focus: đánh giá CHẤT LƯỢNG tổng thể theo rubric                    │
│  • Cho điểm 4 tiêu chí (có context lỗi grammar từ Layer 1)            │
│  • Sinh feedback narrative: strengths, improvements                     │
│  • Sinh rewrites: câu gốc → câu tốt hơn → lý do                      │
│  • Đánh giá coherence, task achievement (Layer 1 không làm được)       │
│                                                                         │
│  Output JSON:                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ {                                                               │   │
│  │   "rubric_scores": {                                            │   │
│  │     "task_achievement": 2.5,                                    │   │
│  │     "coherence": 3.0,                                           │   │
│  │     "lexical": 2.5,                                             │   │
│  │     "grammar": 2.5                                              │   │
│  │   },                                                            │   │
│  │   "overall_band": 6.5,                                          │   │
│  │   "strengths": [                                                │   │
│  │     "Addresses all 3 required points",                          │   │
│  │     "Appropriate informal tone",                                │   │
│  │     "Clear paragraph structure"                                 │   │
│  │   ],                                                            │   │
│  │   "improvements": [                                             │   │
│  │     {                                                           │   │
│  │       "message": "Increase word count",                         │   │
│  │       "explanation": "82 words < 120 minimum for B2"            │   │
│  │     }                                                           │   │
│  │   ],                                                            │   │
│  │   "rewrites": [                                                 │   │
│  │     {                                                           │   │
│  │       "original": "I has to go to hospital",                    │   │
│  │       "improved": "I had to rush to the hospital",              │   │
│  │       "reason": "Corrects grammar + adds descriptive verb"      │   │
│  │     }                                                           │   │
│  │   ]                                                             │   │
│  │ }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Fallback: trả default scores (2.0/2.0/2.0/2.0, band 5.0)             │
│  khi Ollama không phản hồi hoặc JSON parse fail                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MERGE & STORE                                                          │
│                                                                         │
│  annotations = Layer 1 (LanguageTool offset errors)                     │
│              + Layer 2 (LLM annotations nếu có)                         │
│                                                                         │
│  rubric_scores = Layer 2 (LLM)                                          │
│  strengths     = Layer 2 (LLM)                                          │
│  improvements  = Layer 2 (LLM)                                          │
│  rewrites      = Layer 2 (LLM)                                          │
│                                                                         │
│  → INSERT writing_grading_results (version N, is_active=true)           │
│  → Previous version: is_active=false                                    │
│  → GradingJob: status='ready'                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Speaking pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     USER SUBMIT AUDIO (Speaking)                         │
│                                                                         │
│  audio_key: "audio/speaking/{profile_id}/{ulid}.webm"                  │
│  (đã upload lên R2 qua presigned PUT)                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: AZURE SPEECH-TO-TEXT (~2-5s)                                  │
│                                                                         │
│  Service: SpeechToTextService.transcribeFromStorage()                    │
│  Flow: Download audio từ R2 → POST tới Azure STT API                   │
│                                                                         │
│  Input:  raw audio bytes (WebM/Opus)                                    │
│  Output:                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ {                                                               │   │
│  │   "text": "I usually wake up at seven in the morning...",       │   │
│  │   "confidence": 0.92,                                           │   │
│  │   "duration_ms": 45000                                          │   │
│  │ }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Vai trò:                                                               │
│  • Chuyển audio → text để LLM đánh giá nội dung                       │
│  • confidence score → pronunciation_report.accuracy_score               │
│  • Transcript lưu vào submission row để user xem lại                   │
│                                                                         │
│  Fallback: mock transcript khi AZURE_SPEECH_KEY trống                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ transcript text
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: LLM GRADING ON TRANSCRIPT (~5-9s)                             │
│                                                                         │
│  Giống Layer 2 Writing nhưng rubric khác:                               │
│                                                                         │
│  Rubric Speaking (mỗi tiêu chí 0-4):                                   │
│  • Fluency & Coherence: natural flow, hesitation, logic                 │
│  • Pronunciation: clarity (proxy từ transcript quality)                 │
│  • Lexical Resource: vocabulary range                                   │
│  • Grammatical Range & Accuracy: sentence variety                       │
│  • Content & Task Fulfillment: relevance, development                   │
│                                                                         │
│  Overall band = (sum of 5 / 20) × 10                                   │
│                                                                         │
│  Output: rubric_scores + strengths + improvements                       │
│                                                                         │
│  Note: Pronunciation score THẬT lấy từ Azure (Step 1),                 │
│  LLM chỉ đánh giá proxy qua transcript readability.                    │
│  Final pronunciation_report dùng Azure confidence.                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STORE: speaking_grading_results                                        │
│                                                                         │
│  rubric_scores     = LLM output                                         │
│  pronunciation_report = { accuracy_score: Azure confidence × 100 }      │
│  transcript        = Azure STT text                                     │
│  strengths         = LLM output                                         │
│  improvements      = LLM output                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tại sao 3 layer thay vì 1 LLM duy nhất?

| Vấn đề | Chỉ LLM | 3 Layer |
|---|---|---|
| Grammar offset chính xác | ❌ LLM hay sai offset 2-3 ký tự | ✅ LanguageTool chính xác 100% |
| Deterministic | ❌ Cùng input, LLM có thể trả khác | ✅ Layer 0+1 luôn consistent |
| Hallucinate lỗi không có | ❌ LLM đôi khi "thấy" lỗi không tồn tại | ✅ LanguageTool rule-based |
| Miss lỗi cơ bản | ❌ LLM có thể bỏ qua "I has" | ✅ LanguageTool có rule cho mọi pattern |
| Đánh giá coherence/task | ✅ LLM giỏi | ❌ Rule-based không làm được |
| Sinh feedback narrative | ✅ LLM giỏi | ❌ Rule-based chỉ có message template |
| Sinh rewrites | ✅ LLM giỏi | ❌ Rule-based chỉ suggest 1 từ |
| Latency nếu LLM down | ❌ Không có kết quả | ✅ Vẫn có annotations từ Layer 1 |

**Kết luận:** Mỗi layer bổ sung cho nhau. Không layer nào thay thế được layer khác.

---

## Fallback chain

```
Trường hợp 1: Mọi thứ hoạt động (happy path)
  Layer 0 ✓ → Layer 1 ✓ → Layer 2 ✓
  Result: đầy đủ annotations + rubric + feedback

Trường hợp 2: LanguageTool down
  Layer 0 ✓ → Layer 1 [] (empty) → Layer 2 ✓
  Result: rubric + feedback OK, thiếu offset annotations
  User vẫn thấy điểm + gợi ý, chỉ không highlight inline

Trường hợp 3: Ollama/LLM down
  Layer 0 ✓ → Layer 1 ✓ → Layer 2 fallback (default scores)
  Result: có annotations chính xác, điểm = 5.0 mặc định
  User thấy lỗi grammar highlighted, điểm tạm

Trường hợp 4: Cả 2 down
  Layer 0 ✓ → Layer 1 [] → Layer 2 fallback
  Result: chỉ có heuristic (word count, keywords)
  GradingJob status = 'ready' nhưng quality thấp
  User có thể request regrade sau
```

---

## Data flow chi tiết (Writing)

```
1. User POST /practice/writing/sessions/{id}/submit
   Body: { "text": "Dear Minh..." }

2. WritingPracticeService.submit()
   → Create PracticeWritingSubmission row
   → Complete PracticeSession (set ended_at)
   → Call GradingService.enqueueWritingGrading('practice_writing', submission_id)

3. GradingService.enqueueWritingGrading()
   → Create GradingJob (status='pending')
   → Call processWritingJob() [sync phase 1, async phase 2]

4. GradingService.processWritingJob()
   → Update job status='processing'
   → Load submission text + prompt

5. Layer 1: LanguageTool
   → LanguageToolService.check(text)
   → HTTP POST http://localhost:8081/v2/check
   → Parse response → array of {offset, length, message, category, replacements}
   → Convert to annotations format: {start, end, severity, category, message, suggestion}

6. Layer 2: LLM
   → Build system prompt (rubric MOE)
   → Build user message (task prompt + student text + word count + grammar errors context)
   → HTTP POST http://localhost:11434/v1/chat/completions
   → Parse JSON response → rubric_scores, strengths, improvements, rewrites

7. Merge
   → annotations = LanguageTool annotations + LLM annotations (nếu có)
   → Deactivate previous active result (is_active=false)
   → Create WritingGradingResult (version++, is_active=true)

8. Complete
   → Update GradingJob status='ready', completed_at=now()
   → [Future] Dispatch notification event

9. User GET /grading/writing/practice_writing/{submission_id}
   → Return active WritingGradingResult
```

---

## Versioning (regrade)

```
Lần 1: User submit → Job 1 → Result version=1, is_active=true
Lần 2: User request regrade → Job 2 → Result version=1 is_active=false
                                      → Result version=2 is_active=true

FE luôn query WHERE is_active=true → thấy latest.
History: query all versions ORDER BY version DESC.
```

---

## Cấu hình

| Key | Default | Mô tả |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server endpoint |
| `OLLAMA_GRADING_MODEL` | `gemini-3-flash-preview` | Model dùng cho grading |
| `LANGUAGETOOL_URL` | `http://localhost:8081` | LanguageTool container |
| `AZURE_SPEECH_KEY` | (required) | Azure Cognitive Services key |
| `AZURE_SPEECH_REGION` | `southeastasia` | Azure region |

---

## Performance

| Layer | Latency | CPU/GPU | Cost |
|---|---|---|---|
| Heuristic | 0ms | PHP CPU | Free |
| LanguageTool | ~100ms | Java container, 512MB RAM | Free (self-host) |
| LLM (Gemini Flash) | 5-9s | Cloud inference via Ollama | ~$0.0002/request |
| Azure STT | 2-5s | Cloud | Free tier 5h/month |
| **Total Writing** | **~6-10s** | | |
| **Total Speaking** | **~8-14s** | | |

---

## Tại sao chọn Gemini 3 Flash

| Tiêu chí | Gemini 3 Flash | GPT-4o-mini | Gemma 3 (local) |
|---|---|---|---|
| Grammar detection | 6/6 lỗi ✓ | Tương đương | Kém hơn |
| Rubric adherence | Tốt | Tốt | OK |
| JSON output reliability | Cao | Cao | Trung bình |
| Latency | 5-9s | 3-5s | 1-2s (cần GPU) |
| Cost | ~$0.0002 | ~$0.0003 | Free (GPU cost) |
| Deploy complexity | Ollama 1 lệnh | API key | GPU server |
| Đồ án phù hợp | ✅ | ✅ | ❌ (cần GPU) |

---

## Mở rộng tương lai

1. **LanguageTool custom rules**: thêm rules cho lỗi phổ biến người Việt (article omission, tense confusion)
2. **GECToR model**: thêm HuggingFace model cho error correction chính xác hơn
3. **Async queue**: chuyển processWritingJob sang Laravel Queue job thật (Horizon)
4. **Caching**: cache LanguageTool results cho cùng text (idempotent)
5. **A/B testing**: so sánh Gemini vs GPT-4o-mini accuracy trên 100 bài thật
