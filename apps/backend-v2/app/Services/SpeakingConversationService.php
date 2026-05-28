<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\ConversationReviewer;
use App\Ai\Contracts\ConversationTurnHandler;
use App\Ai\Contracts\PronunciationAnalyzer;
use App\Enums\ConversationStatus;
use App\Exceptions\ResourceNotActiveException;
use App\Models\PracticeSpeakingConversationSession;
use App\Models\PracticeSpeakingConversationTurn;
use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class SpeakingConversationService implements ConversationServiceInterface
{
    private const STALE_SESSION_MINUTES = 30;

    public function __construct(
        private readonly ConversationTurnHandler $turnHandler,
        private readonly ConversationReviewer $reviewer,
        private readonly PronunciationAnalyzer $pronunciation,
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

        $openingIpa = $scenario->opening_line_ipa ?: $this->pronunciation->generateIpa($scenario->opening_line);

        return DB::transaction(function () use ($profile, $scenario, $openingIpa) {
            $active = PracticeSpeakingConversationSession::query()
                ->where('profile_id', $profile->id)
                ->where('scenario_id', $scenario->id)
                ->where('status', ConversationStatus::Active)
                ->first();

            if ($active !== null) {
                $ageMinutes = (int) $active->started_at->diffInMinutes(now());

                if ($ageMinutes < self::STALE_SESSION_MINUTES) {
                    return [
                        'session' => $active,
                        'turns' => $active->turns()->get()->all(),
                        'resumed' => true,
                    ];
                }

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

        $lastAiTurn = $priorTurns->where('role', 'ai')->last();
        $suggestedVocab = $lastAiTurn?->suggested_words ?? $scenario->target_vocab ?? [];

        // Single LLM call — retry handled by AiClientManager transport layer.
        $llmResult = $this->turnHandler->gradeAndReply(
            character: $scenario->character_name,
            systemPrompt: $scenario->system_prompt,
            level: $scenario->level,
            history: $turnsSerialized,
            userText: $text,
            vocabToCheck: $suggestedVocab,
        );

        return DB::transaction(function () use ($session, $text, $llmResult, $suggestedVocab) {
            $locked = PracticeSpeakingConversationSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            if ($locked->status !== ConversationStatus::Active) {
                throw new ResourceNotActiveException('Session already ended.');
            }

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
     * @return array{strengths: string[], improvements: string[], corrected_sentences: array, tip: string}
     */
    public function reviewSession(PracticeSpeakingConversationSession $session): array
    {
        $session->loadMissing(['scenario', 'turns']);
        $scenario = $session->scenario;
        $turns = $session->turns;

        $turnsSerialized = $turns->map(fn ($t) => ($t->role === 'ai' ? $scenario->character_name : 'User').': '.$t->text)->implode("\n");
        $userSentences = $turns->where('role', 'user')->pluck('text')->implode("\n");

        return $this->reviewer->review($scenario->title, $scenario->level, $turnsSerialized, $userSentences);
    }

    /**
     * @return array{pronunciation: string, intonation: string, tip: string}
     */
    public function pronunciationReview(string $original, string $transcript): array
    {
        return $this->pronunciation->analyze($original, $transcript);
    }

    public function generateIpa(string $text): ?string
    {
        return $this->pronunciation->generateIpa($text);
    }
}
