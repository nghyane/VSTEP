<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\ConversationReviewer;
use App\Ai\Contracts\ConversationTurnHandler;
use App\Ai\Contracts\PronunciationAnalyzer;
use App\Enums\CoinTransactionType;
use App\Enums\ConversationStatus;
use App\Enums\PracticeFeedbackStatus;
use App\Exceptions\ResourceNotActiveException;
use App\Models\PracticeFeedbackRequest;
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
        private readonly EconomyConfigService $economyConfig,
        private readonly WalletService $walletService,
        private readonly ProgressService $progressService,
        private readonly ProfanityDetector $profanityDetector,
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
        $profanity = $this->profanityDetector->detect($text);

        $llmResult = $profanity['found']
            ? $this->profanityRedirect($suggestedVocab, $profanity)
            : $this->turnHandler->gradeAndReply(
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

    /** @param string[] $suggestedVocab @param array{found: bool, words: list<string>, count: int} $profanity */
    private function profanityRedirect(array $suggestedVocab, array $profanity): array
    {
        return [
            'feedback' => [
                'word_count' => ['used' => 0, 'target' => count($suggestedVocab)],
                'grammar_ok' => false,
                'grammar_corrections' => [],
                'vocab_check' => collect($suggestedVocab)->map(fn (string $phrase): array => [
                    'phrase' => $phrase,
                    'used' => false,
                    'match_type' => 'miss',
                ])->toArray(),
                'better' => 'Let us keep the conversation polite and continue in English.',
                'user_ipa' => null,
                'better_ipa' => null,
                'profanity' => $profanity,
            ],
            'reply' => 'Let us keep the conversation polite. Could you answer again in appropriate English?',
            'reply_ipa' => null,
            'suggested_words' => ['I mean that...', 'Let me try again', 'In my opinion'],
        ];
    }

    public function endSession(PracticeSpeakingConversationSession $session): PracticeSpeakingConversationSession
    {
        if ($session->status !== ConversationStatus::Active) {
            throw new ResourceNotActiveException('Session already ended.');
        }

        $durationSeconds = (int) now()->diffInSeconds($session->started_at);

        $session->update([
            'status' => ConversationStatus::Ended,
            'ended_at' => now(),
            'duration_seconds' => $durationSeconds,
        ]);

        $this->progressService->recordSpeakingConversationCompletion($session->profile_id, $durationSeconds);

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
    public function reviewSession(Profile $profile, PracticeSpeakingConversationSession $session): array
    {
        $request = $this->chargeFeedbackOnce($profile, 'speaking_conversation_review', $session->id, [
            'feedback_type' => 'conversation_review',
        ]);

        try {
            $session->loadMissing(['scenario', 'turns']);
            $scenario = $session->scenario;
            $turns = $session->turns;

            $turnsSerialized = $turns->map(fn ($t) => ($t->role === 'ai' ? $scenario->character_name : 'User').': '.$t->text)->implode("\n");
            $userSentences = $turns->where('role', 'user')->pluck('text')->implode("\n");

            $review = $this->reviewer->review($scenario->title, $scenario->level, $turnsSerialized, $userSentences);
            $this->markFeedbackReady($request);

            return $review;
        } catch (\Throwable $exception) {
            $this->markFeedbackFailed($request, $exception);
            throw $exception;
        }
    }

    /**
     * @return array{pronunciation: string, intonation: string, tip: string}
     */
    public function pronunciationReview(Profile $profile, string $original, string $transcript, ?string $segmentId = null): array
    {
        if ($this->profanityDetector->detect($transcript)['found']) {
            return [
                'pronunciation' => 'Không phân tích phát âm cho lượt nói có từ ngữ không phù hợp.',
                'intonation' => 'Hãy thử lại bằng đúng câu mẫu và giữ ngôn ngữ lịch sự.',
                'tip' => 'Nói lại chậm rãi, rõ từng cụm từ, không thêm nội dung ngoài câu shadowing.',
            ];
        }

        $submissionId = sha1(($segmentId ?? 'shadowing')."|{$original}|{$transcript}");
        $request = $this->chargeFeedbackOnce($profile, 'shadowing_pronunciation', $submissionId, [
            'feedback_type' => 'shadowing_pronunciation',
            'segment_id' => $segmentId,
        ]);

        try {
            $review = $this->pronunciation->analyze($original, $transcript);
            $this->markFeedbackReady($request);

            return $review;
        } catch (\Throwable $exception) {
            $this->markFeedbackFailed($request, $exception);
            throw $exception;
        }
    }

    /** @param array<string,mixed> $metadata */
    private function chargeFeedback(Profile $profile, array $metadata): void
    {
        $this->walletService->spend(
            $profile,
            $this->economyConfig->practiceFeedbackCost(),
            CoinTransactionType::PracticeFeedback,
            null,
            $metadata,
        );
    }

    /** @param array<string,mixed> $metadata */
    private function chargeFeedbackOnce(Profile $profile, string $submissionType, string $submissionId, array $metadata): PracticeFeedbackRequest
    {
        return DB::transaction(function () use ($profile, $submissionType, $submissionId, $metadata) {
            $existing = PracticeFeedbackRequest::query()
                ->where('profile_id', $profile->id)
                ->where('submission_type', $submissionType)
                ->where('submission_id', $submissionId)
                ->lockForUpdate()
                ->first();

            if ($existing instanceof PracticeFeedbackRequest) {
                return $existing;
            }

            $request = PracticeFeedbackRequest::create([
                'profile_id' => $profile->id,
                'submission_type' => $submissionType,
                'submission_id' => $submissionId,
                'status' => PracticeFeedbackStatus::Pending,
                'requested_at' => now(),
            ]);

            $transaction = $this->walletService->spend(
                $profile,
                $this->economyConfig->practiceFeedbackCost(),
                CoinTransactionType::PracticeFeedback,
                $request,
                ['submission_type' => $submissionType, 'submission_id' => $submissionId, ...$metadata],
            );

            $request->update(['coin_transaction_id' => $transaction->id]);

            return $request->refresh();
        });
    }

    private function markFeedbackReady(PracticeFeedbackRequest $request): void
    {
        if ($request->status === PracticeFeedbackStatus::Ready) {
            return;
        }

        $request->update([
            'status' => PracticeFeedbackStatus::Ready,
            'last_error' => null,
            'completed_at' => now(),
            'failed_at' => null,
        ]);
    }

    private function markFeedbackFailed(PracticeFeedbackRequest $request, \Throwable $exception): void
    {
        if ($request->status === PracticeFeedbackStatus::Ready) {
            return;
        }

        $request->update([
            'status' => PracticeFeedbackStatus::Failed,
            'last_error' => $exception->getMessage(),
            'failed_at' => now(),
        ]);
    }

    public function generateIpa(string $text): ?string
    {
        return $this->pronunciation->generateIpa($text);
    }
}
