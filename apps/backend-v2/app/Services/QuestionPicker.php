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
        ?string $topic = null,
        ?int $part = null,
    ): ?Question {
        $excludeIds = $this->buildExcludeIds($userId, $skill, $sessionQuestionIds);

        // Every 3rd item → try review from weak points (skip if learner chose a focus KP)
        if (! $focusKp && $currentIndex > 0 && $currentIndex % 3 === 0) {
            $review = $this->pickReviewItem($userId, $skill, $excludeIds, $topic, $part);
            if ($review) {
                return $review;
            }
        }

        $level = $this->resolveDifficulty($baseLevel, $currentIndex, $totalItems);

        // Progressively relax constraints: level → excludeIds → focusKp → nearby levels → drop part
        return $this->findQuestion($skill, $level, $excludeIds, $focusKp, $topic, $part)
            ?? $this->findQuestion($skill, $baseLevel, $excludeIds, $focusKp, $topic, $part)
            ?? $this->findQuestion($skill, $baseLevel, collect(), $focusKp, $topic, $part)
            ?? $this->findQuestion($skill, $baseLevel, collect(), null, $topic, $part)
            // Relax level (try one level up) while keeping part — serves B1 to A2 users when no A2+part exists
            ?? ($part !== null ? $this->findQuestion($skill, $baseLevel->next() ?? $baseLevel, collect(), null, $topic, $part) : null)
            ?? ($part !== null ? $this->findQuestion($skill, $baseLevel->next()?->next() ?? $baseLevel, collect(), null, $topic, $part) : null)
            // Last resort: drop part filter entirely
            ?? $this->findQuestion($skill, $baseLevel, collect(), null, $topic, null);
    }

    public function resolveDifficulty(Level $baseLevel, int $index, int $total): Level
    {
        if ($index < 0 || $total <= 1) {
            return $baseLevel;
        }

        $ratio = $index / ($total - 1);

        return match (true) {
            $ratio < 0.3 => $baseLevel->prev() ?? $baseLevel,
            $ratio > 0.7 => $baseLevel->next() ?? $baseLevel,
            default => $baseLevel,
        };
    }

    private function pickReviewItem(string $userId, Skill $skill, Collection $excludeIds, ?string $topic = null, ?int $part = null): ?Question
    {
        $dueWp = $this->weakPointService->getDueForReview($userId, $skill, 1)->first();

        if (! $dueWp) {
            return null;
        }

        return Question::where('skill', $skill)
            ->where('is_active', true)
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->when($topic, fn ($q, $value) => $q->where('topic', $value))
            ->when($part, fn ($q, $value) => $q->where('part', $value))
            ->whereHas('knowledgePoints', fn ($q) => $q->where('knowledge_points.id', $dueWp->knowledge_point_id))
            ->inRandomOrder()
            ->first();
    }

    private function findQuestion(Skill $skill, Level $level, Collection $excludeIds, ?string $focusKp = null, ?string $topic = null, ?int $part = null): ?Question
    {
        return Question::where('skill', $skill)
            ->where('level', $level)
            ->where('is_active', true)
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->when($focusKp, fn ($q, $v) => $q->whereHas('knowledgePoints', fn ($q) => $q->where('name', $v)))
            ->when($topic, fn ($q, $value) => $q->where('topic', $value))
            ->when($part, fn ($q, $value) => $q->where('part', $value))
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
