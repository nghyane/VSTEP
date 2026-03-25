<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\UserProgress;
use App\Services\ProgressService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LearningPathResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $weeklyPlan = $this->resource->map(function (UserProgress $p) {
            $gap = $p->target_level
                ? max(0, $p->target_level->score() - $p->current_level->score())
                : 0;

            $recommendedLevel = $this->resolveRecommendedLevel($p);

            return [
                'skill' => $p->skill,
                'current_level' => $p->current_level,
                'target_level' => $p->target_level ?? $p->current_level,
                'sessions_per_week' => $this->sessionsForGap($gap),
                'focus_area' => null,
                'recommended_level' => $recommendedLevel,
                'estimated_minutes' => $this->minutesForGap($gap),
                'weak_topics' => [],
                'priority' => $gap > 0 ? $gap : $p->current_level->score(),
            ];
        })->sortByDesc('priority')->values();

        return [
            'weekly_plan' => $weeklyPlan,
            'total_minutes_per_week' => $weeklyPlan->sum('estimated_minutes'),
            'projected_improvement' => null,
        ];
    }

    private function resolveRecommendedLevel(UserProgress $p): mixed
    {
        if ($p->scaffold_level >= ProgressService::SCAFFOLD_PER_LEVEL) {
            return $p->current_level->next() ?? $p->current_level;
        }

        if ($p->scaffold_level < 0) {
            return $p->current_level->prev() ?? $p->current_level;
        }

        return $p->current_level;
    }

    private function sessionsForGap(int $gap): int
    {
        return match (true) {
            $gap >= 3 => 5,
            $gap >= 2 => 4,
            $gap >= 1 => 3,
            default => 2,
        };
    }

    private function minutesForGap(int $gap): int
    {
        return match (true) {
            $gap >= 3 => 60,
            $gap >= 2 => 45,
            $gap >= 1 => 30,
            default => 20,
        };
    }
}
