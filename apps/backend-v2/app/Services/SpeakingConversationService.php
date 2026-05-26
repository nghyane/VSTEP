<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\AiClient;
use App\Enums\ConversationStatus;
use App\Exceptions\AiServiceUnavailableException;
use App\Exceptions\ResourceNotActiveException;
use App\Models\PracticeSpeakingConversationSession;
use App\Models\PracticeSpeakingConversationTurn;
use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class SpeakingConversationService implements ConversationServiceInterface
{
    public function __construct(
        private readonly AiClient $ai,
        private readonly ConversationTurnNormalizer $normalizer,
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

        return DB::transaction(function () use ($profile, $scenario, $openingIpa) {
            // Auto-end any existing active session for this user+scenario.
            // Set ended_at = null to mark as abandoned (not user-ended).
            PracticeSpeakingConversationSession::query()
                ->where('profile_id', $profile->id)
                ->where('scenario_id', $scenario->id)
                ->where('status', ConversationStatus::Active)
                ->update(['status' => ConversationStatus::Ended]);

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

        $prompt = view('ai.conversation.turn', [
            'character' => $scenario->character_name,
            'systemPrompt' => $scenario->system_prompt,
            'level' => $scenario->level,
            'history' => $turnsSerialized,
            'userText' => $userText,
            'vocabCheck' => $preCheck,
        ])->render();

        $structured = $this->callConversation($prompt);

        $parsed = $this->normalizer->normalize($structured, $targetVocab, $lowerText, $userText);
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

        $prompt = view('ai.conversation.review', [
            'title' => $scenario->title,
            'level' => $scenario->level,
            'history' => $turnsSerialized,
            'userSentences' => $userSentences,
        ])->render();

        $parsed = $this->callConversation($prompt);

        if (! isset($parsed['strengths'])) {
            Log::warning('ConversationReview: could not parse', ['parsed' => $parsed]);
            throw new AiServiceUnavailableException;
        }

        return $parsed;
    }

    /**
     * @return array{pronunciation: string, intonation: string, tip: string}
     */
    public function pronunciationReview(string $original, string $transcript): array
    {
        $prompt = view('ai.conversation.pronunciation', [
            'original' => $original,
            'transcript' => $transcript,
        ])->render();

        $parsed = $this->callPronunciation($prompt);

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
            $content = $this->ai->text(
                service: 'pronunciation',
                prompt: "Convert this English text to IPA phonetic transcription. Respond with ONLY the IPA string, nothing else.\n\nText: \"{$text}\"",
            );
            $content = trim($content, " \t\n\r\0\x0B/");
            if (! empty($content) && mb_strlen($content) > 2) {
                return $content;
            }
        } catch (\Throwable $e) {
            Log::warning('IPA generation failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Call conversation service with retry on transient failures.
     *
     * @return array<string,mixed>
     */
    private function callConversation(string $prompt): array
    {
        return $this->callWithRetry('conversation', $prompt);
    }

    /**
     * @return array<string,mixed>
     */
    private function callPronunciation(string $prompt): array
    {
        return $this->callWithRetry('pronunciation', $prompt);
    }

    /**
     * Strip markdown fences and preamble text from LLM response,
     * extracting the first valid JSON object.
     */
    private function extractJson(string $text): string
    {
        $text = trim($text);

        // 1. Try to find JSON between ```json ... ``` fences (non-greedy)
        if (preg_match('/```(?:json)?\s*\n?(.+?)\n?\s*```/s', $text, $m)) {
            return trim($m[1]);
        }

        // 2. Fallback: extract the first {...} or [...] block
        if (preg_match('/[\[{].*[\]}]/s', $text, $m)) {
            return $m[0];
        }

        return $text;
    }

    /**
     * @return array<string,mixed>
     */
    private function callWithRetry(string $service, string $prompt): array
    {
        $maxRetries = 2;

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                $text = $this->ai->text(service: $service, prompt: $prompt);

                $json = $this->extractJson($text);

                $decoded = json_decode($json, true);

                if (! is_array($decoded)) {
                    $snippet = mb_substr($text, 0, 200);
                    throw new \RuntimeException("AI returned non-JSON: {$snippet}");
                }

                return $decoded;
            } catch (\Throwable $e) {
                // Don't retry non-transient errors (JSON parse failures, bad prompts)
                if ($e instanceof \RuntimeException && str_contains($e->getMessage(), 'non-JSON')) {
                    Log::warning('AI call: non-JSON response (not retrying)', [
                        'service' => $service,
                        'error' => $e->getMessage(),
                    ]);

                    throw new AiServiceUnavailableException;
                }

                if ($attempt === $maxRetries) {
                    Log::warning('AI call exhausted retries', [
                        'service' => $service,
                        'attempts' => $attempt + 1,
                        'error' => $e->getMessage(),
                    ]);

                    throw new AiServiceUnavailableException;
                }

                $delayMs = 1000 * (2 ** $attempt);
                Log::info('AI call retrying', [
                    'service' => $service,
                    'attempt' => $attempt + 1,
                    'delay_ms' => $delayMs,
                ]);
                usleep($delayMs * 1000);
            }
        }

        throw new AiServiceUnavailableException;
    }
}
