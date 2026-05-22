<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Agents\ConversationReviewAgent;
use App\Ai\Agents\ConversationTurnAgent;
use App\Enums\ConversationStatus;
use App\Exceptions\AiServiceUnavailableException;
use App\Exceptions\ResourceNotActiveException;
use App\Models\PracticeSpeakingConversationSession;
use App\Models\PracticeSpeakingConversationTurn;
use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class SpeakingConversationService
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

        // Use cached IPA if available — populated by admin scenario CRUD.
        // Fallback to runtime generation for backward compat.
        $openingIpa = $scenario->opening_line_ipa ?: $this->generateIpa($scenario->opening_line);

        try {
            return DB::transaction(function () use ($profile, $scenario, $openingIpa) {
                $session = PracticeSpeakingConversationSession::create([
                    'profile_id' => $profile->id,
                    'scenario_id' => $scenario->id,
                    'status' => ConversationStatus::Active,
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
        } catch (QueryException $e) {
            // Partial unique index — already has active session for (profile, scenario).
            if (($e->errorInfo[0] ?? null) === '23505') {
                throw ValidationException::withMessages([
                    'session' => ['Bạn đang có 1 cuộc hội thoại đang diễn ra với scenario này. Hãy kết thúc trước khi bắt đầu mới.'],
                ]);
            }
            throw $e;
        }
    }

    /**
     * @return array{user_turn: PracticeSpeakingConversationTurn, ai_turn: PracticeSpeakingConversationTurn, session: PracticeSpeakingConversationSession}
     */
    public function submitTurn(PracticeSpeakingConversationSession $session, string $text): array
    {
        if ($session->status !== ConversationStatus::Active) {
            throw new ResourceNotActiveException('Session already ended.');
        }

        $scenario = $session->scenario;
        $priorTurns = $session->turns()->get();

        $turnsSerialized = $priorTurns->map(fn ($t) => ($t->role === 'ai' ? $scenario->character_name : 'User').': '.$t->text)->implode("\n");

        // suggested_words from last AI turn — what user saw as "Thử dùng các từ sau"
        $lastAiTurn = $priorTurns->where('role', 'ai')->last();
        $suggestedVocab = $lastAiTurn?->suggested_words ?? $scenario->target_vocab ?? [];

        // LLM call OUTSIDE transaction (slow, no DB lock held).
        $llmResult = $this->processTurn($scenario, $turnsSerialized, $text, $suggestedVocab);

        // DB writes — transaction + lock to serialize concurrent submitTurn calls.
        return DB::transaction(function () use ($session, $text, $llmResult, $suggestedVocab) {
            $locked = PracticeSpeakingConversationSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            if ($locked->status !== ConversationStatus::Active) {
                throw new ResourceNotActiveException('Session already ended.');
            }

            // Recompute nextIndex from locked state — concurrent submits
            // may have inserted turns between our LLM call and this point.
            $nextIndex = (int) ($locked->turns()->max('turn_index') ?? -1) + 1;

            $gradingResult = $llmResult['feedback'];

            $userTurn = PracticeSpeakingConversationTurn::create([
                'session_id' => $locked->id,
                'turn_index' => $nextIndex,
                'role' => 'user',
                'text' => $text,
                'feedback' => $gradingResult,
            ]);

            $aiTurn = PracticeSpeakingConversationTurn::create([
                'session_id' => $locked->id,
                'turn_index' => $nextIndex + 1,
                'role' => 'ai',
                'text' => $llmResult['reply'],
                'suggested_words' => $llmResult['suggested_words'],
            ]);
            $aiTurn->setAttribute('ipa', $llmResult['reply_ipa']);

            // Batch update — single UPDATE thay vì 4 increments.
            $vocabUsed = collect($gradingResult['vocab_check'] ?? [])->filter(fn ($v) => $v['used'])->count();
            $grammarOk = (bool) ($gradingResult['grammar_ok'] ?? false);

            $locked->update([
                'user_turn_count' => $locked->user_turn_count + 1,
                'vocab_used_count' => $locked->vocab_used_count + $vocabUsed,
                'vocab_target_count' => $locked->vocab_target_count + count($suggestedVocab),
                'grammar_ok_count' => $locked->grammar_ok_count + ($grammarOk ? 1 : 0),
            ]);

            return ['user_turn' => $userTurn, 'ai_turn' => $aiTurn, 'session' => $locked->refresh()];
        });
    }

    public function endSession(PracticeSpeakingConversationSession $session): PracticeSpeakingConversationSession
    {
        if ($session->status !== ConversationStatus::Active) {
            throw new ResourceNotActiveException('Session already ended.');
        }

        $session->update([
            'status' => ConversationStatus::Ended,
            'ended_at' => now(),
            'duration_seconds' => (int) now()->diffInSeconds($session->started_at),
        ]);

        return $session->refresh();
    }

    public function getSession(PracticeSpeakingConversationSession $session): PracticeSpeakingConversationSession
    {
        return $session->loadMissing(['scenario', 'turns']);
    }

    public function listHistory(Profile $profile): LengthAwarePaginator
    {
        return PracticeSpeakingConversationSession::query()
            ->with('scenario:id,title,level,slug')
            ->where('profile_id', $profile->id)
            ->where('status', ConversationStatus::Ended)
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

        try {
            $structured = $this->callConversationLlm(
                $prompt."\n\nRespond ONLY with valid JSON, no markdown.",
                maxTokens: 800,
            );
        } catch (\Throwable $e) {
            Log::warning('ConversationTurn LLM failed', ['error' => $e->getMessage()]);
            throw new AiServiceUnavailableException;
        }

        $parsed = $this->normalizeTurnResponse($structured, $targetVocab, $lowerText, $userText);
        if ($parsed === null) {
            Log::warning('ConversationTurn LLM: invalid structure', ['response' => $structured]);
            throw new AiServiceUnavailableException;
        }

        return $parsed;
    }

    /**
     * @return array{overall_score: int, strengths: string[], improvements: string[], corrected_sentences: array, tip: string}
     */
    public function reviewSession(PracticeSpeakingConversationSession $session): array
    {
        $session->loadMissing(['scenario', 'turns']);
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

        try {
            $parsed = $this->callConversationLlm($prompt, maxTokens: 1000);
        } catch (\Throwable $e) {
            Log::warning('ConversationReview LLM failed', ['error' => $e->getMessage()]);
            throw new AiServiceUnavailableException;
        }

        if (! isset($parsed['strengths'])) {
            Log::warning('ConversationReview: could not parse', ['parsed' => $parsed]);
            throw new AiServiceUnavailableException;
        }

        return $parsed;
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

        try {
            $parsed = $this->callConversationLlm($prompt, maxTokens: 500);
        } catch (\Throwable $e) {
            Log::warning('PronunciationReview LLM failed', ['error' => $e->getMessage()]);
            throw new AiServiceUnavailableException;
        }

        if (! isset($parsed['pronunciation'])) {
            throw new AiServiceUnavailableException;
        }

        return $parsed;
    }

    /**
     * Generate IPA transcription for a given English text via LLM.
     * Returns null on failure — IPA is optional UI hint, not critical.
     */
    public function generateIpa(string $text): ?string
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

    /**
     * Shared LLM call helper — Workers AI returns `content` as array.
     * Throws \RuntimeException on HTTP/parse failure so caller decides
     * (throw AiServiceUnavailableException OR fallback for optional ops).
     *
     * @return array<string,mixed>
     */
    private function callConversationLlm(string $prompt, int $maxTokens): array
    {
        $url = rtrim((string) config('ai.providers.workers-ai.url', ''), '/').'/chat/completions';
        $key = (string) config('ai.providers.workers-ai.key', '');
        $authHeader = (string) config('ai.providers.workers-ai.auth_header', 'cf-aig-authorization');
        $model = (string) config('ai.providers.workers-ai.models.text.default');

        $response = Http::withHeaders([$authHeader => 'Bearer '.$key])
            ->timeout(30)
            ->post($url, [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'max_tokens' => $maxTokens,
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException("Conversation LLM HTTP {$response->status()}");
        }

        $content = data_get($response->json(), 'choices.0.message.content', '');
        if (is_array($content)) {
            $content = json_encode($content);
        }

        // Strip markdown wrapper if present.
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $content, $m)) {
            $content = trim($m[1]);
        }

        $parsed = json_decode((string) $content, true);
        if (! is_array($parsed)) {
            throw new \RuntimeException('Conversation LLM returned non-JSON');
        }

        return $parsed;
    }
}
