<?php

declare(strict_types=1);

namespace App\Services;

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
use App\Services\PracticeHandlers\PracticeModeHandler;
use App\Services\PracticeHandlers\ShadowingHandler;
use App\Support\VstepScoring;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class PracticeService
{
    public function __construct(
        private readonly QuestionPicker $picker,
        private readonly WeakPointService $weakPointService,
        private readonly WritingScaffoldService $writingScaffoldService,
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
        $itemsCount = $options['items_count'] ?? $mode->defaultItemsCount($skill);

        // Auto-complete stale sessions of same skill+mode (older than 2 hours)
        PracticeSession::forUser($userId)
            ->where('skill', $skill)
            ->where('mode', $mode)
            ->whereNull('completed_at')
            ->where('started_at', '<', now()->subHours(2))
            ->each(fn (PracticeSession $s) => $this->complete($s));

        $writingTier = $skill === Skill::Writing
            ? $progress->writingTier()->value
            : null;

        $session = PracticeSession::create([
            'user_id' => $userId,
            'skill' => $skill,
            'mode' => $mode,
            'level' => $level,
            'config' => [
                'items_count' => $itemsCount,
                'focus_kp' => $options['focus_kp'] ?? null,
                'topic' => $options['topic'] ?? null,
                'part' => $options['part'] ?? null,
                'writing_tier' => $writingTier,
            ],
            'started_at' => now(),
        ]);

        $firstQuestion = $this->pickNextQuestion($session);
        if (! $firstQuestion) {
            $session->delete();

            $this->throwNoQuestionAvailable($skill, $level, $options['part'] ?? null);
        }

        $recommendation = $this->weakPointService->getRecommendation($userId, $skill);

        return [
            'session' => $session->fresh(),
            'current_item' => $this->buildItem($session, $firstQuestion),
            'recommendation' => $recommendation,
            'progress' => $this->buildProgress($session),
            'writing_tier' => $writingTier,
        ];
    }

    public function submit(PracticeSession $session, array $answer): array
    {
        $lock = Cache::lock("practice_submit:{$session->id}", 10);

        if (! $lock->get()) {
            throw ValidationException::withMessages(['session' => ['A submission is already being processed.']]);
        }

        try {
            return $this->processSubmit($session->fresh(), $answer);
        } finally {
            $lock->release();
        }
    }

    public function show(PracticeSession $session): array
    {
        if ($session->isCompleted()) {
            $this->recalculateSummaryIfNeeded($session);

            return ['session' => $session];
        }

        $question = $session->currentQuestion;
        if (! $question && $session->hasMoreItems()) {
            $this->throwNoQuestionAvailable($session->skill, $session->level, $session->config['part'] ?? null);
        }

        return [
            'session' => $session,
            'current_item' => $question ? $this->buildItem($session, $question) : null,
            'progress' => $this->buildProgress($session),
        ];
    }

    public function complete(PracticeSession $session): PracticeSession
    {
        if ($session->isCompleted()) {
            return $session;
        }

        $session->update([
            'summary' => $this->buildSummary($session),
            'current_question_id' => null,
            'completed_at' => now(),
        ]);

        return $session;
    }

    public function list(string $userId, ?Skill $skill = null): LengthAwarePaginator
    {
        return PracticeSession::forUser($userId)
            ->withCount('submissions')
            ->when($skill, fn ($q, $v) => $q->where('skill', $v))
            ->orderByDesc('started_at')
            ->paginate();
    }

    // ── Private ────────────────────────────────────────────────

    private function processSubmit(PracticeSession $session, array $answer): array
    {
        $this->assertActive($session);

        $question = $session->currentQuestion
            ?? throw ValidationException::withMessages(['session' => ['No current question.']]);

        $handler = $this->resolveHandler($session->mode);

        $isRetry = $session->submissions()
            ->where('question_id', $question->id)
            ->exists();

        if ($isRetry && ! $handler->supportsRetry()) {
            throw ValidationException::withMessages(['session' => ['Retry not supported for this mode.']]);
        }

        $submission = Submission::create([
            'user_id' => $session->user_id,
            'practice_session_id' => $session->id,
            'question_id' => $question->id,
            'skill' => $session->skill,
            'answer' => $answer,
            'status' => SubmissionStatus::Pending,
        ]);

        $result = $handler->processAnswer($submission, $question, $answer);

        // Refresh to get handler's updates (status, score)
        $submission->refresh();

        // Update spaced repetition for sync-graded submissions
        if ($submission->status === SubmissionStatus::Completed && $submission->score !== null) {
            $this->weakPointService->recordFromSubmission($submission);
        }

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
            $session->clearCompletedCountCache();
            $nextQuestion = $this->pickNextQuestion($session);
            $nextItem = $nextQuestion ? $this->buildItem($session, $nextQuestion) : null;
        }

        return [
            'result' => $result,
            'submission_id' => $submission->id,
            'can_retry' => $handler->supportsRetry(),
            'is_retry' => $isRetry,
            'previous_score' => $previousScore,
            'improvement' => $isRetry && $previousScore !== null ? ($submission->score ?? 0) - $previousScore : null,
            'attempt_number' => $session->submissions()->where('question_id', $question->id)->count(),
            'current_item' => $isRetry ? null : $nextItem,
            'progress' => $this->buildProgress($session->fresh()),
        ];
    }

    private function pickNextQuestion(PracticeSession $session): ?Question
    {
        if (! $session->hasMoreItems()) {
            $session->update(['current_question_id' => null]);

            return null;
        }

        $sessionQuestionIds = $session->submissions()->pluck('question_id')->unique();

        // Shadowing/Drill: keep exact level. Free/Guided: use difficulty curve.
        $useDifficultyCurve = in_array($session->mode, [PracticeMode::Free, PracticeMode::Guided]);

        $question = $this->picker->pick(
            $session->user_id,
            $session->skill,
            $session->level,
            $useDifficultyCurve ? $sessionQuestionIds->count() : -1,
            $useDifficultyCurve ? $session->itemsCount() : -1,
            $sessionQuestionIds,
            $session->config['focus_kp'] ?? null,
            $session->config['topic'] ?? null,
            $session->config['part'] ?? null,
        );

        $session->update(['current_question_id' => $question?->id]);

        return $question;
    }

    private function buildItem(PracticeSession $session, Question $question): array
    {
        $question->makeHidden(['answer_key', 'explanation']);
        $handler = $this->resolveHandler($session->mode);
        $writingTier = $session->config['writing_tier'] ?? null;

        return [
            'question' => $question->toArray(),
            'difficulty' => $this->picker->resolveDifficulty(
                $session->level,
                $session->completedCount(),
                $session->itemsCount(),
            )->value,
            'is_review' => false,
            ...$handler->enrichItem($question, $writingTier),
            ...$this->buildWritingScaffold($question, $writingTier),
        ];
    }

    private function buildWritingScaffold(Question $question, ?int $writingTier): array
    {
        if ($question->skill !== Skill::Writing || $writingTier === null) {
            return [];
        }

        return [
            'writing_scaffold' => $this->writingScaffoldService->forQuestion($question, $writingTier),
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

    private function buildSummary(PracticeSession $session): array
    {
        $allSubmissions = $session->submissions()->with('question')->get();
        $byQuestion = $allSubmissions->groupBy('question_id');

        $bestScores = $byQuestion->map(fn ($group) => $group->max('score'))->filter();

        $items = $byQuestion->map(function ($group) {
            $best = $group->sortByDesc('score')->first();

            return [
                'question_id' => $best->question_id,
                'topic' => $best->question?->topic,
                'best_score' => $best->score,
                'attempts' => $group->count(),
                'status' => $best->status->value,
            ];
        })->values()->toArray();

        $weakPoints = $allSubmissions
            ->pluck('result.knowledge_gaps')
            ->filter()
            ->flatten(1)
            ->pluck('name')
            ->countBy()
            ->sortDesc()
            ->take(5)
            ->toArray();

        $hasPending = $allSubmissions->contains(
            fn ($s) => $s->status === SubmissionStatus::Pending || $s->status === SubmissionStatus::Processing,
        );

        $summary = [
            'items_completed' => $byQuestion->count(),
            'items_total' => $session->itemsCount(),
            'average_score' => $bestScores->isNotEmpty() ? VstepScoring::round($bestScores->avg()) : null,
            'best_score' => $bestScores->isNotEmpty() ? $bestScores->max() : null,
            'scores_pending' => $hasPending,
            'items' => $items,
            'weak_points' => $weakPoints,
        ];

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

        return $summary;
    }

    private function recalculateSummaryIfNeeded(PracticeSession $session): void
    {
        if (! ($session->summary['scores_pending'] ?? false)) {
            return;
        }

        $hasPending = $session->submissions()
            ->whereIn('status', [SubmissionStatus::Pending, SubmissionStatus::Processing])
            ->exists();

        if (! $hasPending) {
            $session->update(['summary' => $this->buildSummary($session)]);
        }
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

    private function throwNoQuestionAvailable(Skill $skill, Level $level, ?int $part = null): never
    {
        $partLabel = $part !== null ? " part {$part}" : '';

        throw ValidationException::withMessages([
            'session' => ["No practice question available for {$skill->value}{$partLabel} at level {$level->value}."],
        ]);
    }
}
