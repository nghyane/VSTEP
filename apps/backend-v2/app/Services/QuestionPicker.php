<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Level;
use App\Enums\Skill;
use App\Models\Question;
use App\Models\Submission;
use Illuminate\Support\Collection;

class QuestionPicker
{
    private const RECENT_EXCLUDE = 50;

    public function __construct(
        private readonly WeakPointService $weakPointService,
    ) {}

    public function pick(
        string $userId,
        Skill $skill,
        Level $baseLevel,
        int $currentIndex,
        int $totalItems,
        Collection $sessionQuestionIds,
        ?string $focusKp = null,
    ): ?Question {
        $excludeIds = $this->buildExcludeIds($userId, $skill, $sessionQuestionIds);

        // Every 3rd item → try review from weak points
        if ($currentIndex > 0 && $currentIndex % 3 === 0) {
            $review = $this->pickReviewItem($userId, $skill, $excludeIds);
            if ($review) {
                return $review;
            }
        }

        $level = $this->resolveDifficulty($baseLevel, $currentIndex, $totalItems);

        return $this->findQuestion($skill, $level, $excludeIds, $focusKp)
            ?? $this->findQuestion($skill, $baseLevel, $excludeIds, $focusKp)
            ?? $this->findQuestion($skill, $baseLevel, collect());
    }

    public function resolveDifficulty(Level $baseLevel, int $index, int $total): Level
    {
        if ($total <= 1) {
            return $baseLevel;
        }

        $ratio = $index / ($total - 1);

        return match (true) {
            $ratio < 0.3 => $baseLevel->prev() ?? $baseLevel,
            $ratio > 0.7 => $baseLevel->next() ?? $baseLevel,
            default => $baseLevel,
        };
    }

    private function pickReviewItem(string $userId, Skill $skill, Collection $excludeIds): ?Question
    {
        $dueWp = $this->weakPointService->getDueForReview($userId, $skill, 1)->first();

        if (! $dueWp) {
            return null;
        }

        return Question::where('skill', $skill)
            ->where('is_active', true)
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->whereHas('knowledgePoints', fn ($q) => $q->where('knowledge_points.id', $dueWp->knowledge_point_id))
            ->inRandomOrder()
            ->first();
    }

    private function findQuestion(Skill $skill, Level $level, Collection $excludeIds, ?string $focusKp = null): ?Question
    {
        return Question::where('skill', $skill)
            ->where('level', $level)
            ->where('is_active', true)
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->when($focusKp, fn ($q, $v) => $q->whereHas('knowledgePoints', fn ($q) => $q->where('name', $v)))
            ->inRandomOrder()
            ->first();
    }

    private function buildExcludeIds(string $userId, Skill $skill, Collection $sessionQuestionIds): Collection
    {
        $recentIds = Submission::forUser($userId)
            ->where('skill', $skill)
            ->orderByDesc('created_at')
            ->limit(self::RECENT_EXCLUDE)
            ->pluck('question_id');

        return $sessionQuestionIds->merge($recentIds)->unique();
    }
}
