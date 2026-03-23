<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserProgressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'skill' => $this->skill,
            'current_level' => $this->current_level,
            'target_level' => $this->target_level,
            'scaffold_level' => $this->scaffold_level,
            'streak_count' => $this->streak_count,
            'streak_direction' => $this->streak_direction,
            'attempt_count' => $this->attempt_count,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
