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
    /**
     * Sessions idle longer than this are considered stale — auto-ended
     * instead of resumed. Shorter sessions are resumed in-place.
     */
    private const STALE_SESSION_MINUTES = 30;

    public function __construct(
        private readonly AiClient $ai,
        private readonly ConversationTurnNormalizer $normalizer,
    ) {}

    // ── Schema definitions ────────────────────────────────────────

    /** @return array<string,mixed> */
    private function turnSchema(): array
    {
        return [
            'feedback' => [
                'type' => 'object',
                'properties' => [
                    'vocab_check' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'phrase' => ['type' => 'string'],
                            'used' => ['type' => 'boolean'],
                        ],
                        'required' => ['phrase', 'used'],
                        'additionalProperties' => false,
                    ]],
                    'grammar_ok' => ['type' => 'boolean'],
                    'grammar_corrections' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'wrong' => ['type' => 'string'],
                            'correct' => ['type' => 'string'],
                            'explanation' => ['type' => 'string'],
                        ],
                        'required' => ['wrong', 'correct', 'explanation'],
                        'additionalProperties' => false,
                    ]],
                    'better' => ['type' => 'string'],
                    'user_ipa' => ['type' => 'string'],
                    'better_ipa' => ['type' => 'string'],
                ],
                'required' => ['vocab_check', 'grammar_ok', 'grammar_corrections', 'better', 'user_ipa', 'better_ipa'],
                'additionalProperties' => false,
            ],
            'reply' => ['type' => 'string'],
            'reply_ipa' => ['type' => 'string'],
            'suggested_words' => ['type' => 'array', 'items' => ['type' => 'string']],
        ];
    }

    /** @return array<string,mixed> */
    private function reviewSchema(): array
    {
        return [
            'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
            'improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
            'corrected_sentences' => ['type' => 'array', 'items' => [
                'type' => 'object',
                'properties' => [
                    'original' => ['type' => 'string'],
                    'corrected' => ['type' => 'string'],
                    'explanation' => ['type' => 'string'],
                ],
                'required' => ['original', 'corrected', 'explanation'],
                'additionalProperties' => false,
            ]],
            'tip' => ['type' => 'string'],
        ];
    }

    /** @return array<string,mixed> */
    private function pronunciationSchema(): array
    {
        return [
            'pronunciation' => ['type' => 'string'],
            'intonation' => ['type' => 'string'],
            'tip' => ['type' => 'string'],
        ];
    }

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
            $active = PracticeSpeakingConversationSession::query()
                ->where('profile_id', $profile->id)
                ->where('scenario_id', $scenario->id)
                ->where('status', ConversationStatus::Active)
                ->first();

            // Resume existing session if it was started recently (< 30 min).
            if ($active !== null) {
                $ageMinutes = (int) $active->started_at->diffInMinutes(now());

                if ($ageMinutes < self::STALE_SESSION_MINUTES) {
                    return [
                        'session' => $active,
                        'turns' => $active->turns()->get()->all(),
                        'resumed' => true,
                    ];
                }

                // Stale — auto-end with complete data before creating new.
                $active->update([
                    'status' => ConversationStatus::Ended,
                    'ended_at' => now(),
                    'duration_seconds' => DB::raw(
                        'EXTRACT(EPOCH FROM (NOW() - started_at))::int',
                    ),
                ]);
            }

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
                'ipa' => $openingIpa,
                'suggested_words' => $scenario->target_vocab ?? [],
            ]);

            return ['session' => $session, 'turns' => [$turn], 'resumed' => false];
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
                'ipa' => $llmResult['reply_ipa'],
                'suggested_words' => $llmResult['suggested_words'],
            ]);

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

        $parsed = $this->callWithTool(
            service: 'conversation',
            toolName: 'conversation_review',
            toolDescription: 'Review a completed conversation session with feedback',
            parametersSchema: $this->reviewSchema(),
            prompt: $prompt,
        );

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
     * Call conversation service for a turn.
     *
     * @return array<string,mixed>
     */
    private function callConversation(string $prompt): array
    {
        return $this->callWithTool(
            service: 'conversation',
            toolName: 'conversation_turn',
            toolDescription: 'Grade the user turn and reply as the conversation character',
            parametersSchema: $this->turnSchema(),
            prompt: $prompt,
        );
    }

    /**
     * @return array<string,mixed>
     */
    private function callPronunciation(string $prompt): array
    {
        return $this->callWithTool(
            service: 'pronunciation',
            toolName: 'pronunciation_review',
            toolDescription: 'Analyze pronunciation accuracy',
            parametersSchema: $this->pronunciationSchema(),
            prompt: $prompt,
        );
    }

    /**
     * Call AI via tool calling (function calling) for structured JSON output.
     * Retries on transient HTTP failures; surface-level JSON errors throw immediately.
     *
     * @param  array<string,mixed>  $parametersSchema
     * @return array<string,mixed>
     */
    private function callWithTool(string $service, string $toolName, string $toolDescription, array $parametersSchema, string $prompt, ?string $instructions = null): array
    {
        $maxRetries = 2;

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                return $this->ai->toolCall(
                    service: $service,
                    prompt: $prompt,
                    toolName: $toolName,
                    toolDescription: $toolDescription,
                    parametersSchema: $parametersSchema,
                    instructions: $instructions,
                );
            } catch (\Throwable $e) {
                if ($attempt === $maxRetries) {
                    Log::warning('AI tool call exhausted retries', [
                        'service' => $service,
                        'tool' => $toolName,
                        'attempts' => $attempt + 1,
                        'error' => $e->getMessage(),
                    ]);

                    throw new AiServiceUnavailableException;
                }

                $delayMs = 1000 * (2 ** $attempt);
                Log::info('AI tool call retrying', [
                    'service' => $service,
                    'tool' => $toolName,
                    'attempt' => $attempt + 1,
                    'delay_ms' => $delayMs,
                ]);
                usleep($delayMs * 1000);
            }
        }

        throw new AiServiceUnavailableException;
    }
}
