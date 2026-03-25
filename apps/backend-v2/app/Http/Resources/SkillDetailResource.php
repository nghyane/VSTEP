<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SkillDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'progress' => $this['progress'] ? new UserProgressResource($this['progress']) : null,
            'recent_scores' => $this['recent_scores']->values(),
            'window_avg' => $this['window_avg'],
            'window_deviation' => $this['window_deviation'],
            'trend' => $this['trend'],
            'eta' => null,
        ];
    }
}
