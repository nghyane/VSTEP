<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Level;
use App\Enums\Skill;
use App\Models\Question;
use App\Models\Submission;
use App\Models\UserProgress;
use Illuminate\Support\Collection;

class PracticeService
{
    private const RECENT_LIMIT = 50;

    public function nextQuestion(string $userId, Skill $skill, ?int $part = null): array
    {
        $progress = $this->ensureProgress($userId, $skill);
        $targetLevel = $this->resolveTargetLevel($progress->current_level, $progress->scaffold_level);

        $recentQuestionIds = Submission::forUser($userId)
            ->where('skill', $skill)
            ->orderByDesc('created_at')
            ->limit(self::RECENT_LIMIT)
            ->pluck('question_id');

        $question = $this->findQuestion($skill, $targetLevel, $part, $recentQuestionIds)
            ?? $this->findQuestion($skill, $progress->current_level, $part, $recentQuestionIds);

        $isRepeat = false;
        if (! $question) {
            $question = $this->findQuestion($skill, $progress->current_level, $part, collect());
            $isRepeat = $question !== null;
        }

        return [
            'question' => $question,
            'scaffold_level' => $progress->scaffold_level,
            'current_level' => $progress->current_level,
            'is_repeat' => $isRepeat,
        ];
    }

    private function ensureProgress(string $userId, Skill $skill): UserProgress
    {
        return UserProgress::findOrInitialize($userId, $skill);
    }

    private function resolveTargetLevel(Level $currentLevel, int $scaffoldLevel): Level
    {
        if ($scaffoldLevel >= ProgressService::SCAFFOLD_PER_LEVEL) {
            return $currentLevel->next() ?? $currentLevel;
        }

        if ($scaffoldLevel < 0) {
            return $currentLevel->prev() ?? $currentLevel;
        }

        return $currentLevel;
    }

    private function findQuestion(Skill $skill, Level $level, ?int $part, Collection $excludeIds): ?Question
    {
        return Question::where('skill', $skill)
            ->where('level', $level)
            ->where('is_active', true)
            ->when($part, fn ($q, $v) => $q->where('part', $v))
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->inRandomOrder()
            ->first();
    }
}
