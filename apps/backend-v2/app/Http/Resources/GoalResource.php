<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $daysRemaining = $this->deadline
            ? max(0, (int) now()->diffInDays($this->deadline, false))
            : null;

        return [
            ...parent::toArray($request),
            'days_remaining' => $daysRemaining,
            'achieved' => $this->isAchieved(),
            'on_track' => $this->isOnTrack($daysRemaining),
        ];
    }

    private function isAchieved(): bool
    {
        if (! $this->target_band) {
            return false;
        }

        $minLevel = $this->target_band->minLevel();
        $skills = UserProgress::where('user_id', $this->user_id)->get();

        if ($skills->count() < 4) {
            return false;
        }

        return $skills->every(
            fn (UserProgress $p) => $p->current_level->score() >= $minLevel->score(),
        );
    }

    private function isOnTrack(?int $daysRemaining): ?bool
    {
        if ($daysRemaining === null) {
            return null;
        }

        if ($daysRemaining === 0) {
            return false;
        }

        if (! $this->target_band) {
            return null;
        }

        $minLevel = $this->target_band->minLevel();
        $skills = UserProgress::where('user_id', $this->user_id)->get();

        if ($skills->isEmpty()) {
            return false;
        }

        $totalGap = $skills->sum(
            fn (UserProgress $p) => max(0, $minLevel->score() - $p->current_level->score()),
        );

        return $totalGap === 0 || $daysRemaining > $totalGap * 7;
    }
}
