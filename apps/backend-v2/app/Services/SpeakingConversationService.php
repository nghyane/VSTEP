<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Agents\ConversationReviewAgent;
use App\Ai\Agents\ConversationTurnAgent;
use App\Models\PracticeSpeakingConversationSession;
use App\Models\PracticeSpeakingConversationTurn;
use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SpeakingConversationService
{
    public function __construct(
        private readonly ConversationTurnAgent $turnAgent,
        private readonly ConversationReviewAgent $reviewAgent,
    ) {}

    /** @return Collection<int,PracticeSpeakingScenario> */
    public function listScenarios(?string $level): Collection
    {
        $query = PracticeSpeakingScenario::query()->where('is_published', true);
        if ($level !== null) {
            $query->where('level', $level);
        }

        return $query->orderBy('level')->orderBy('created_at')->get();
    }

    public function getScenario(string $id): PracticeSpeakingScenario
    {
        /** @var PracticeSpeakingScenario */
        return PracticeSpeakingScenario::query()->findOrFail($id);
    }

    /**
     * @return array{session: PracticeSpeakingConversationSession, turns: array<int,PracticeSpeakingConversationTurn>}
     */
    public function startSession(Profile $profile, string $scenarioId): array
    {
        $scenario = $this->getScenario($scenarioId);
        $openingIpa = $this->generateIpa($scenario->opening_line);

        return DB::transaction(function () use ($profile, $scenario, $openingIpa) {
            $session = PracticeSpeakingConversationSession::create([
                'profile_id' => $profile->id,
                'scenario_id' => $scenario->id,
                'status' => 'active',
                'started_at' => now(),
            ]);

            $turn = PracticeSpeakingConversationTurn::create([
                'session_id' => $session->id,
                'turn_index' => 0,
                'role' => 'ai',
                'text' => $scenario->opening_line,
                'suggested_words' => $scenario->target_vocab ?? [],
            ]);
            $turn->setAttribute('ipa', $openingIpa);

            return ['session' => $session, 'turns' => [$turn]];
        });
    }

    /**
     * @return array{user_turn: PracticeSpeakingConversationTurn, ai_turn: PracticeSpeakingConversationTurn, session: PracticeSpeakingConversationSession}
     */
    public function submitTurn(Profile $profile, string $sessionId, string $text): array
    {
        /** @var PracticeSpeakingConversationSession $session */
        $session = PracticeSpeakingConversationSession::query()->findOrFail($sessionId);

        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }
        if ($session->status !== 'active') {
            abort(409, 'Session already ended.');
        }

        $scenario = $session->scenario;
        $priorTurns = $session->turns()->get();
        $nextIndex = $priorTurns->count();

        $turnsSerialized = $priorTurns->map(fn ($t) => ($t->role === 'ai' ? $scenario->character_name : 'User').': '.$t->text)->implode("\n");

        // Get suggested_words from the last AI turn — these are what user saw as "Thử dùng các từ sau"
        $lastAiTurn = $priorTurns->where('role', 'ai')->last();
        $suggestedVocab = $lastAiTurn?->suggested_words ?? $scenario->target_vocab ?? [];

        // Single LLM call: grade + reply
        $llmResult = $this->processTurn($scenario, $turnsSerialized, $text, $suggestedVocab);
        $gradingResult = $llmResult['feedback'];
        $replyText = $llmResult['reply'];
        $replyIpa = $llmResult['reply_ipa'];
        $suggestedWords = $llmResult['suggested_words'];

        return DB::transaction(function () use ($session, $text, $gradingResult, $replyText, $replyIpa, $suggestedWords, $nextIndex, $suggestedVocab) {
            $userTurn = PracticeSpeakingConversationTurn::create([
                'session_id' => $session->id,
                'turn_index' => $nextIndex,
                'role' => 'user',
                'text' => $text,
                'feedback' => $gradingResult,
            ]);

            $aiTurn = PracticeSpeakingConversationTurn::create([
                'session_id' => $session->id,
                'turn_index' => $nextIndex + 1,
                'role' => 'ai',
                'text' => $replyText,
                'suggested_words' => $suggestedWords,
            ]);
            $aiTurn->setAttribute('ipa', $replyIpa);

            $vocabUsed = collect($gradingResult['vocab_check'] ?? [])->filter(fn ($v) => $v['used'])->count();
            $session->increment('user_turn_count');
            $session->increment('vocab_used_count', $vocabUsed);
            $session->increment('vocab_target_count', count($suggestedVocab));
            if ($gradingResult['grammar_ok'] ?? false) {
                $session->increment('grammar_ok_count');
            }

            return ['user_turn' => $userTurn, 'ai_turn' => $aiTurn, 'session' => $session->refresh()];
        });
    }

    public function endSession(Profile $profile, string $sessionId): PracticeSpeakingConversationSession
    {
        /** @var PracticeSpeakingConversationSession $session */
        $session = PracticeSpeakingConversationSession::query()->findOrFail($sessionId);

        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }
        if ($session->status !== 'active') {
            abort(409, 'Session already ended.');
        }

        $session->update([
            'status' => 'ended',
            'ended_at' => now(),
            'duration_seconds' => (int) now()->diffInSeconds($session->started_at),
        ]);

        return $session->refresh();
    }

    public function getSession(Profile $profile, string $sessionId): PracticeSpeakingConversationSession
    {
        /** @var PracticeSpeakingConversationSession $session */
        $session = PracticeSpeakingConversationSession::query()
            ->with(['scenario', 'turns'])
            ->findOrFail($sessionId);

        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }

        return $session;
    }

    public function listHistory(Profile $profile): LengthAwarePaginator
    {
        return PracticeSpeakingConversationSession::query()
            ->with('scenario:id,title,level,slug')
            ->where('profile_id', $profile->id)
            ->where('status', 'ended')
            ->orderByDesc('ended_at')
            ->paginate(20);
    }

    /**
     * Single LLM call: grade user turn + generate AI reply.
     *
     * @return array{feedback: array, reply: string, reply_ipa: string|null, suggested_words: string[]}
     */
    private function processTurn(PracticeSpeakingScenario $scenario, string $turnsSerialized, string $userText, array $vocabToCheck): array
    {
        $targetVocab = $vocabToCheck;
        $lowerText = Str::lower($userText);

        $preCheck = collect($targetVocab)->map(fn ($phrase) => [
            'phrase' => $phrase,
            'pre_match' => Str::contains($lowerText, Str::lower($phrase)),
        ])->toArray();

        $prompt = "You are {$scenario->character_name}. {$scenario->system_prompt}\n"
            ."Speaker level: {$scenario->level}.\n"
            ."Conversation so far:\n{$turnsSerialized}\n"
            ."User just said: \"{$userText}\"\n\n"
            ."INSTRUCTIONS (follow exactly):\n"
            ."1. GRADE the user's sentence:\n"
            .'   - Target phrases: '.json_encode($preCheck)."\n"
            ."   - For each phrase, set used=true if user said it or a close paraphrase.\n"
            ."   - grammar_ok: set false if there are grammatical errors.\n"
            ."   - grammar_corrections: array of {wrong, correct, explanation(in Vietnamese)} for each grammar mistake. Empty array if no errors.\n"
            ."   - better: rewrite the user's sentence in natural English. Always provide this.\n"
            ."   - user_ipa: IPA phonetic transcription of the user's ORIGINAL sentence as they said it. Always provide this.\n"
            ."   - better_ipa: IPA phonetic transcription of the 'better' sentence (e.g. \"aɪ wʊd laɪk tuː ɡoʊ\"). Always provide this.\n"
            ."2. REPLY as {$scenario->character_name}:\n"
            ."   - Write 1-2 natural sentences (max 30 words).\n"
            ."   - Your reply MUST be grammatically correct English.\n"
            ."   - Your reply MUST end with a question to continue the conversation.\n"
            ."   - Do NOT repeat phrases or stutter.\n"
            ."3. SUGGEST 2-4 short phrases the user could say next (each ≤ 4 words).\n"
            .'4. REPLY_IPA: provide IPA phonetic transcription of your reply as "reply_ipa" field. Always provide this.';

        $fallbackFeedback = [
            'word_count' => ['used' => 0, 'target' => count($targetVocab)],
            'grammar_ok' => true,
            'grammar_corrections' => [],
            'vocab_check' => collect($targetVocab)->map(fn ($p) => ['phrase' => $p, 'used' => Str::contains($lowerText, Str::lower($p))])->toArray(),
            'better' => $userText,
            'user_ipa' => null,
            'better_ipa' => null,
        ];

        try {
            // Direct HTTP call — bypass agent framework (Workers AI returns content as array)
            $url = rtrim((string) config('ai.providers.workers-ai.url', ''), '/').'/chat/completions';
            $key = (string) config('ai.providers.workers-ai.key', '');
            $authHeader = (string) config('ai.providers.workers-ai.auth_header', 'cf-aig-authorization');
            $model = (string) config('ai.providers.workers-ai.models.text.default');

            $httpResponse = Http::withHeaders([
                $authHeader => 'Bearer '.$key,
            ])->timeout(30)->post($url, [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => $prompt."\n\nRespond ONLY with valid JSON, no markdown."]],
                'max_tokens' => 800,
            ]);

            $data = $httpResponse->json();
            $content = data_get($data, 'choices.0.message.content', '');
            if (is_array($content)) {
                $content = json_encode($content);
            }
            if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $content, $m)) {
                $content = trim($m[1]);
            }
            $structured = json_decode($content, true);

            // LLM may nest data differently — normalize
            $parsed = $this->normalizeTurnResponse($structured, $targetVocab, $lowerText, $userText);
            if ($parsed) {
                return $parsed;
            }

            Log::warning('ConversationTurn LLM: invalid structure', ['response' => $structured]);
        } catch (\Throwable $e) {
            Log::warning('ConversationTurn LLM failed, using fallback', ['error' => $e->getMessage()]);
        }

        return [
            'feedback' => $fallbackFeedback,
            'reply' => "That's interesting! Tell me more.",
            'reply_ipa' => null,
            'suggested_words' => ['Tell me more', 'I think', 'What about you'],
        ];
    }

    /**
     * @return array{overall_score: int, strengths: string[], improvements: string[], corrected_sentences: array, tip: string}
     */
    public function reviewSession(Profile $profile, string $sessionId): array
    {
        $session = $this->getSession($profile, $sessionId);
        $scenario = $session->scenario;
        $turns = $session->turns;

        $turnsSerialized = $turns->map(fn ($t) => ($t->role === 'ai' ? $scenario->character_name : 'User').': '.$t->text)->implode("\n");

        $userSentences = $turns->where('role', 'user')->pluck('text')->implode("\n");

        $prompt = "You are an English teacher reviewing a conversation practice.\n"
            ."Scenario: {$scenario->title} (level {$scenario->level})\n"
            ."Full conversation:\n{$turnsSerialized}\n\n"
            ."User's sentences:\n{$userSentences}\n\n"
            ."Analyze the user's English. Be specific — reference actual sentences the user said.\n"
            ."Respond ONLY with valid JSON (no markdown, no code blocks), with these fields:\n"
            ."- strengths: array of 2-3 specific things the user did well (in Vietnamese, reference actual phrases)\n"
            ."- improvements: array of 2-3 specific things to improve (in Vietnamese, reference actual mistakes)\n"
            ."- corrected_sentences: array of {original, corrected, explanation} for EACH user sentence that has errors (in Vietnamese). Skip correct sentences.\n"
            .'- tip: one practical actionable tip (in Vietnamese)';

        $fallback = [
            'strengths' => ['Giao tiếp tự tin', 'Hiểu được ngữ cảnh hội thoại'],
            'improvements' => ['Cần cải thiện ngữ pháp', 'Sử dụng từ vựng đa dạng hơn'],
            'corrected_sentences' => [],
            'tip' => 'Hãy luyện tập thêm các mẫu câu giao tiếp hàng ngày.',
        ];

        try {
            // Direct HTTP call — bypass agent framework (Workers AI returns content as array)
            $url = rtrim((string) config('ai.providers.workers-ai.url', ''), '/').'/chat/completions';
            $key = (string) config('ai.providers.workers-ai.key', '');
            $authHeader = (string) config('ai.providers.workers-ai.auth_header', 'cf-aig-authorization');
            $model = (string) config('ai.providers.workers-ai.models.text.default', '@cf/meta/llama-4-scout-17b-16e-instruct');

            $response = Http::withHeaders([
                $authHeader => 'Bearer '.$key,
            ])->timeout(30)->post($url, [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'max_tokens' => 1000,
            ]);

            $data = $response->json();
            $content = data_get($data, 'choices.0.message.content', '');
            if (is_array($content)) {
                $content = json_encode($content);
            }

            // Strip markdown wrapper if present
            if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $content, $m)) {
                $content = trim($m[1]);
            }

            $parsed = json_decode($content, true);
            if (is_array($parsed) && isset($parsed['strengths'])) {
                return $parsed;
            }

            Log::warning('ConversationReview: could not parse', ['content' => $content]);
        } catch (\Throwable $e) {
            Log::warning('ConversationReview LLM failed', ['error' => $e->getMessage()]);
        }

        return $fallback;
    }

    /**
     * Normalize LLM response — handles varying key names (feedback/grade, reply/response, etc.)
     *
     * @return array{feedback: array, reply: string, suggested_words: string[]}|null
     */
    private function normalizeTurnResponse(?array $data, array $targetVocab, string $lowerText, string $userText): ?array
    {
        if (! is_array($data)) {
            return null;
        }

        // Flatten if nested under a single wrapper key (e.g. "response": {...})
        if (count($data) === 1 && is_array(reset($data))) {
            $data = reset($data);
        }

        // Find feedback/grade object
        $feedback = $data['feedback'] ?? $data['grade'] ?? $data['grading'] ?? null;

        // Find reply string
        $reply = $data['reply'] ?? $data['response'] ?? $data['message'] ?? null;
        if (is_array($reply)) {
            $reply = $reply['text'] ?? $reply['message'] ?? null;
        }

        // Find suggestions
        $suggestions = $data['suggested_words'] ?? $data['suggestions'] ?? $data['suggest'] ?? [];

        if (! is_array($feedback) || ! is_string($reply)) {
            return null;
        }

        // Normalize better
        $better = $feedback['better'] ?? $feedback['rewrite'] ?? $feedback['correction'] ?? '';
        if (empty($better) || $better === $userText) {
            $better = $userText;
        }

        // Normalize vocab_check — handles multiple formats from LLM
        $rawVocab = $feedback['vocab_check'] ?? $feedback['used'] ?? $feedback['vocabulary'] ?? [];
        $llmVocab = collect([]);
        if (is_array($rawVocab)) {
            foreach ($rawVocab as $key => $val) {
                if (is_array($val) && isset($val['phrase'])) {
                    // Format: [{phrase: "...", used: true}] or [{phrase: "...", pre_match: true}]
                    $used = $val['used'] ?? $val['pre_match'] ?? false;
                    $llmVocab->push(['phrase' => $val['phrase'], 'used' => (bool) $used]);
                } elseif (is_string($key)) {
                    // Format: {"phrase": true/false}
                    $llmVocab->push(['phrase' => $key, 'used' => (bool) $val]);
                }
            }
        }

        // Ensure all target phrases present
        $completeVocab = collect($targetVocab)->map(function ($phrase) use ($llmVocab, $lowerText) {
            $entry = $llmVocab->first(fn ($v) => Str::lower($v['phrase']) === Str::lower($phrase));
            if ($entry) {
                return ['phrase' => $phrase, 'used' => (bool) $entry['used']];
            }

            return ['phrase' => $phrase, 'used' => Str::contains($lowerText, Str::lower($phrase))];
        })->toArray();

        $usedCount = count(array_filter($completeVocab, fn ($v) => $v['used']));

        // Normalize grammar_corrections
        $grammarCorrections = $feedback['grammar_corrections'] ?? $feedback['corrections'] ?? [];
        if (! is_array($grammarCorrections)) {
            $grammarCorrections = [];
        }

        return [
            'feedback' => [
                'word_count' => ['used' => $usedCount, 'target' => count($targetVocab)],
                'grammar_ok' => (bool) ($feedback['grammar_ok'] ?? true),
                'grammar_corrections' => $grammarCorrections,
                'vocab_check' => $completeVocab,
                'better' => $better,
                'user_ipa' => $feedback['user_ipa'] ?? null,
                'better_ipa' => $feedback['better_ipa'] ?? null,
            ],
            'reply' => $reply,
            'reply_ipa' => $data['reply_ipa'] ?? $data['ipa'] ?? null,
            'suggested_words' => is_array($suggestions) ? array_values($suggestions) : [],
        ];
    }

    /**
     * @return array{pronunciation: string, intonation: string, tip: string}
     */
    public function pronunciationReview(string $original, string $transcript): array
    {
        $prompt = "You are an English pronunciation coach.\n"
            ."Original sentence: \"{$original}\"\n"
            ."Student said: \"{$transcript}\"\n\n"
            ."Compare and analyze. Respond ONLY with valid JSON (no markdown), with these fields:\n"
            ."- pronunciation: specific feedback on which words were mispronounced and how to fix (in Vietnamese, 2-3 sentences)\n"
            ."- intonation: feedback on rhythm, stress, linking sounds (in Vietnamese, 1-2 sentences)\n"
            .'- tip: one practical tip to improve (in Vietnamese, 1 sentence)';

        $fallback = [
            'pronunciation' => 'Hãy chú ý phát âm rõ từng từ và nghe lại câu mẫu.',
            'intonation' => 'Cố gắng bắt chước ngữ điệu tự nhiên của câu gốc.',
            'tip' => 'Luyện tập nhại theo nhiều lần để cải thiện.',
        ];

        try {
            $url = rtrim((string) config('ai.providers.workers-ai.url', ''), '/').'/chat/completions';
            $key = (string) config('ai.providers.workers-ai.key', '');
            $authHeader = (string) config('ai.providers.workers-ai.auth_header', 'cf-aig-authorization');
            $model = (string) config('ai.providers.workers-ai.models.text.default');

            $response = Http::withHeaders([
                $authHeader => 'Bearer '.$key,
            ])->timeout(30)->post($url, [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'max_tokens' => 500,
            ]);

            $data = $response->json();
            $content = data_get($data, 'choices.0.message.content', '');
            if (is_array($content)) {
                $content = json_encode($content);
            }
            if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $content, $m)) {
                $content = trim($m[1]);
            }
            $parsed = json_decode($content, true);
            if (is_array($parsed) && isset($parsed['pronunciation'])) {
                return $parsed;
            }
        } catch (\Throwable $e) {
            Log::warning('PronunciationReview LLM failed', ['error' => $e->getMessage()]);
        }

        return $fallback;
    }

    /**
     * Generate IPA transcription for a given English text via LLM.
     */
    private function generateIpa(string $text): ?string
    {
        try {
            $url = rtrim((string) config('ai.providers.workers-ai.url', ''), '/').'/chat/completions';
            $key = (string) config('ai.providers.workers-ai.key', '');
            $authHeader = (string) config('ai.providers.workers-ai.auth_header', 'cf-aig-authorization');
            $model = (string) config('ai.providers.workers-ai.models.text.default');

            $httpResponse = Http::withHeaders([
                $authHeader => 'Bearer '.$key,
            ])->timeout(10)->post($url, [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => "Convert this English text to IPA phonetic transcription. Respond with ONLY the IPA string, nothing else.\n\nText: \"{$text}\""]],
                'max_tokens' => 200,
            ]);

            $content = data_get($httpResponse->json(), 'choices.0.message.content', '');
            if (is_array($content)) {
                $content = collect($content)->pluck('text')->implode('');
            }
            $content = trim((string) $content, " \t\n\r\0\x0B/");
            if (! empty($content) && mb_strlen($content) > 2) {
                return $content;
            }
        } catch (\Throwable $e) {
            Log::warning('IPA generation failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
