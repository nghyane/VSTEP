# Speaking Practice — Conversation AI + Shadowing

Created: 2026-05-01

## Architecture Decision

Speaking practice split into 2 independent modes:
- **Hội thoại AI** (Conversation): roleplay with AI character, turn-based dialogue
- **Shadowing**: listen + repeat sentences, word-level accuracy comparison

Old drill/VSTEP speaking features removed entirely — replaced by these 2 modes.

## Conversation AI

### STT: Web Speech API (browser-native)
- `SpeechRecognition` runs on FE, sends text to BE. No Azure STT, no audio upload.
- `continuous = true` + `interimResults = true` — keeps recognition alive up to 30s.
- Auto-restart on Chrome silence timeout via `onend` handler.
- `stoppedRef` flag prevents double submit (stop button vs onend race condition).

### TTS: Web Speech API
- Chrome TTS cold start clips first words. Fix: prepend `"... "` filler to utterance text. Filler gets clipped instead of content.
- `onboundary` event tracks `charIndex` for word-by-word highlight (mờ → đen).
- `warmupTTS()` speaks "ready" at volume 0.01 before first speak — called on user gesture.
- Voice picker: dropdown in header, `getEnglishVoices()` + `pickEnglishVoice()` for default.

### LLM: Workers AI (Cloudflare)
- Provider: `workers-ai` in `config/ai.php`. Model: `@cf/meta/llama-4-scout-17b-16e-instruct`.
- OpenAI via Cloudflare gateway quota exceeded → switched to Workers AI (free).
- Workers AI returns `content` as array (not string) → `ChatCompletionsGateway.php` line 94 fixed to handle both.
- Agent framework `StructuredAgentResponse` fails with Workers AI → conversation/review use direct `Http::post` + manual JSON parse.
- LLM returns varying key names (`feedback`/`grade`, `reply`/`response`, `vocab_check`/`used`) → `normalizeTurnResponse()` handles all variants.
- `word_count` computed BE-side from `vocab_check` array, not trusted from LLM.
- `better` always populated (fallback = user text).
- Reply must end with question — prompt enforces, no code append.

### Translate
- Google Translate free API: `translate.googleapis.com/translate_a/single?client=gtx`.
- `translateText()` in `lib/utils.ts`. Per-bubble toggle button.

## Shadowing

### No backend needed
- TTS reads model sentence (Web Speech API).
- SpeechRecognition captures user speech.
- `compareWords()` in `lib/utils.ts` — DP alignment (not positional) handles word merging (e.g. "lightspeed" vs "light speed").
- `levenshtein()` for close match detection (edit distance ≤ 2).
- Pronunciation review: `POST /practice/speaking/pronunciation-review` — sends original + transcript to LLM.

### Word comparison algorithm
Positional comparison fails when words merge/split. DP alignment (like diff):
1. Score each pair: exact=3, levenshtein≤2=2, contains=1, none=0
2. DP maximize total score
3. Backtrack alignment
4. Unaligned original words → check merged user words (`uw.includes(w)`)

## Anti-patterns discovered

1. **Chrome SpeechRecognition `continuous=true`**: still auto-stops after ~6s silence. Must auto-restart in `onend`.
2. **Chrome TTS after SpeechRecognition**: audio context switch causes cold start. Need warmup.
3. **Chrome TTS `synth.cancel()` + immediate `speak()`**: silently fails. Need 50-100ms delay.
4. **Two-utterance queue for warmup**: unreliable timing. Single utterance with `"... "` prefix is more robust.
5. **`SpeechRecognition.stop()` triggers `onend`**: must use flag (`stoppedRef`) to prevent double submit.

## Files

### Backend
- `database/migrations/2026_05_01_000001..000004` — scenarios table + seeds (8 scenarios)
- `app/Models/PracticeSpeaking{Scenario,ConversationSession,ConversationTurn}.php`
- `app/Ai/Agents/Conversation{TurnAgent,ReviewAgent}.php`
- `app/Services/SpeakingConversationService.php` — direct HTTP to Workers AI
- `app/Http/Controllers/Api/V1/SpeakingConversationController.php` — 9 endpoints

### Frontend
- `src/features/practice/components/Conversation*.tsx` — 7 components
- `src/features/practice/components/Shadowing*.tsx` — 4 components
- `src/features/practice/mock-shadowing.ts` — 6 lessons with segments
- `src/lib/utils.ts` — `speak()`, `warmupTTS()`, `translateText()`, `compareWords()`
