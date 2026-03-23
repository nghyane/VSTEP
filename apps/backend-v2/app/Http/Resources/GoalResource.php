<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $days_remaining = $this->deadline
            ? max(0, (int) Carbon::now()->diffInDays($this->deadline, false))
            : null;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'target_band' => $this->target_band,
            'current_estimated_band' => $this->current_estimated_band,
            'deadline' => $this->deadline?->toISOString(),
            'daily_study_time_minutes' => $this->daily_study_time_minutes,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'achieved' => false,
            'on_track' => $days_remaining !== null ? $days_remaining > 0 : null,
            'days_remaining' => $days_remaining,
        ];
    }
}
