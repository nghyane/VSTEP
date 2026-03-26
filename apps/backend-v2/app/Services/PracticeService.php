<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\PracticeModeHandler;
use App\Enums\Level;
use App\Enums\PracticeMode;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\Submission;
use App\Models\UserProgress;
use App\Services\PracticeHandlers\DrillHandler;
use App\Services\PracticeHandlers\FreeModeHandler;
use App\Services\PracticeHandlers\GuidedHandler;
use App\Services\PracticeHandlers\ShadowingHandler;
use App\Support\VstepScoring;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class PracticeService
{
    public function __construct(
        private readonly QuestionPicker $picker,
        private readonly WeakPointService $weakPointService,
    ) {}

    public function start(string $userId, Skill $skill, PracticeMode $mode, array $options = []): array
    {
        if (! $mode->availableForSkill($skill)) {
            throw ValidationException::withMessages([
                'mode' => ["Mode {$mode->value} is not available for {$skill->value}."],
            ]);
        }

        $progress = UserProgress::findOrInitialize($userId, $skill);
        $level = isset($options['level']) ? Level::from($options['level']) : $progress->current_level;
        $itemsCount = $options['items_count'] ?? $mode->defaultItemsCount();

        $session = PracticeSession::create([
            'user_id' => $userId,
            'skill' => $skill,
            'mode' => $mode,
            'level' => $level,
            'config' => [
                'items_count' => $itemsCount,
                'focus_kp' => $options['focus_kp'] ?? null,
            ],
            'started_at' => now(),
        ]);

        $firstQuestion = $this->pickNextQuestion($session);
        $recommendation = $this->weakPointService->getRecommendation($userId, $skill);

        return [
            'session' => $session->fresh(),
            'current_item' => $firstQuestion ? $this->buildItem($session, $firstQuestion) : null,
            'recommendation' => $recommendation,
            'progress' => $this->buildProgress($session),
        ];
    }

    public function submit(PracticeSession $session, array $answer): array
    {
        $this->assertActive($session);

        $question = $session->currentQuestion
            ?? throw ValidationException::withMessages(['session' => ['No current question.']]);

        $handler = $this->resolveHandler($session->mode);

        // Check retry: same question already has a submission in this session
        $isRetry = $session->submissions()
            ->where('question_id', $question->id)
            ->exists();

        if ($isRetry && ! $handler->supportsRetry()) {
            throw ValidationException::withMessages(['session' => ['Retry not supported for this mode.']]);
        }

        // Create submission
        $submission = Submission::create([
            'user_id' => $session->user_id,
            'practice_session_id' => $session->id,
            'question_id' => $question->id,
            'skill' => $session->skill,
            'answer' => $answer,
            'status' => SubmissionStatus::Pending,
        ]);

        $result = $handler->processAnswer($submission, $question, $answer);

        // Compare with previous attempt if retry
        $previousScore = null;
        if ($isRetry) {
            $previousScore = $session->submissions()
                ->where('question_id', $question->id)
                ->where('id', '!=', $submission->id)
                ->latest()
                ->value('score');
        }

        // Pick next question (only if not retry)
        $nextItem = null;
        if (! $isRetry) {
            $nextQuestion = $this->pickNextQuestion($session);
            $nextItem = $nextQuestion ? $this->buildItem($session, $nextQuestion) : null;
        }

        return [
            'result' => $result,
            'submission_id' => $submission->id,
            'can_retry' => $handler->supportsRetry(),
            'is_retry' => $isRetry,
            'previous_score' => $previousScore,
            'improvement' => $isRetry && $previousScore ? ($result['score'] ?? 0) - $previousScore : null,
            'attempt_number' => $session->submissions()->where('question_id', $question->id)->count(),
            'current_item' => $isRetry ? null : $nextItem,
            'progress' => $this->buildProgress($session->fresh()),
        ];
    }

    public function complete(PracticeSession $session): PracticeSession
    {
        if ($session->isCompleted()) {
            return $session;
        }

        $submissions = $session->submissions()->scored()->get();
        $scores = $submissions->groupBy('question_id')->map(fn ($group) => $group->max('score'));

        $summary = [
            'items_completed' => $scores->count(),
            'items_total' => $session->itemsCount(),
            'average_score' => $scores->isNotEmpty() ? VstepScoring::round($scores->avg()) : null,
            'best_score' => $scores->isNotEmpty() ? $scores->max() : null,
        ];

        // Compare with last session of same type
        $lastSession = PracticeSession::forUser($session->user_id)
            ->where('skill', $session->skill)
            ->where('mode', $session->mode)
            ->completed()
            ->where('id', '!=', $session->id)
            ->orderByDesc('completed_at')
            ->first();

        if ($lastSession?->summary) {
            $summary['improvement'] = ($summary['average_score'] ?? 0) - ($lastSession->summary['average_score'] ?? 0);
        }

        $session->update([
            'summary' => $summary,
            'current_question_id' => null,
            'completed_at' => now(),
        ]);

        return $session;
    }

    public function list(string $userId, ?Skill $skill = null): LengthAwarePaginator
    {
        return PracticeSession::forUser($userId)
            ->when($skill, fn ($q, $v) => $q->where('skill', $v))
            ->orderByDesc('started_at')
            ->paginate();
    }

    // ── Private ────────────────────────────────────────────────

    private function pickNextQuestion(PracticeSession $session): ?Question
    {
        if (! $session->hasMoreItems()) {
            $session->update(['current_question_id' => null]);

            return null;
        }

        $sessionQuestionIds = $session->submissions()->pluck('question_id')->unique();

        $question = $this->picker->pick(
            $session->user_id,
            $session->skill,
            $session->level,
            $sessionQuestionIds->count(),
            $session->itemsCount(),
            $sessionQuestionIds,
            $session->config['focus_kp'] ?? null,
        );

        $session->update(['current_question_id' => $question?->id]);

        return $question;
    }

    private function buildItem(PracticeSession $session, Question $question): array
    {
        $question->makeHidden(['answer_key', 'explanation']);
        $handler = $this->resolveHandler($session->mode);

        return [
            'question' => $question->toArray(),
            'difficulty' => $this->picker->resolveDifficulty(
                $session->level,
                $session->completedCount(),
                $session->itemsCount(),
            )->value,
            'is_review' => false,
            ...$handler->enrichItem($question),
        ];
    }

    private function buildProgress(PracticeSession $session): array
    {
        return [
            'current' => $session->completedCount(),
            'total' => $session->itemsCount(),
            'has_more' => $session->hasMoreItems(),
        ];
    }

    private function resolveHandler(PracticeMode $mode): PracticeModeHandler
    {
        return match ($mode) {
            PracticeMode::Free => app(FreeModeHandler::class),
            PracticeMode::Shadowing => app(ShadowingHandler::class),
            PracticeMode::Drill => app(DrillHandler::class),
            PracticeMode::Guided => app(GuidedHandler::class),
        };
    }

    private function assertActive(PracticeSession $session): void
    {
        if ($session->isCompleted()) {
            throw ValidationException::withMessages(['session' => ['Session is already completed.']]);
        }
    }
}
