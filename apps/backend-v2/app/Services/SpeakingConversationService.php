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
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Responses\StructuredAgentResponse;

final class SpeakingConversationService implements ConversationServiceInterface
{
    public function __construct(
        private readonly ConversationTurnAgent $turnAgent,
        private readonly ConversationReviewAgent $reviewAgent,
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
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'session' => ['Bạn đang có 1 cuộc hội thoại đang diễn ra với scenario này. Hãy kết thúc trước khi bắt đầu mới.'],
            ]);
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

        $prompt = view('ai.conversation.turn', [
            'character' => $scenario->character_name,
            'systemPrompt' => $scenario->system_prompt,
            'level' => $scenario->level,
            'history' => $turnsSerialized,
            'userText' => $userText,
            'vocabCheck' => $preCheck,
        ])->render();

        $parsed = $this->callAgent($this->turnAgent, $prompt);

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

        $parsed = $this->callAgent($this->reviewAgent, $prompt);

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

        $parsed = $this->callAgent($this->reviewAgent, $prompt);

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
            $response = $this->reviewAgent->prompt(
                prompt: "Convert this English text to IPA phonetic transcription. Respond with ONLY the IPA string, nothing else.\n\nText: \"{$text}\"",
                provider: 'bifrost',
            );
            $content = trim((string) $response->text, " \t\n\r\0\x0B/");
            if (! empty($content) && mb_strlen($content) > 2) {
                return $content;
            }
        } catch (\Throwable $e) {
            Log::warning('IPA generation failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Call an agent with retry on transient failures (2 retries, exponential backoff).
     * Throws AiServiceUnavailableException after exhausting retries.
     *
     * @return array<string,mixed>
     */
    private function callAgent(Agent $agent, string $prompt): array
    {
        $maxRetries = 2;

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                $response = $agent->prompt(prompt: $prompt, provider: 'bifrost');

                return $response instanceof StructuredAgentResponse ? $response->structured : [];
            } catch (\Throwable $e) {
                if ($attempt === $maxRetries) {
                    Log::warning('AI agent call exhausted retries', [
                        'agent' => $agent::class,
                        'attempts' => $attempt + 1,
                        'error' => $e->getMessage(),
                    ]);

                    throw new AiServiceUnavailableException;
                }

                $delay = (int) (1000 * 2 ** $attempt); // 1s → 2s
                Log::info('AI agent call retrying', [
                    'agent' => $agent::class,
                    'attempt' => $attempt + 1,
                    'delay_ms' => $delay,
                ]);
                usleep($delay * 1000);
            }
        }

        throw new AiServiceUnavailableException;
    }
}
