<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DrillSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'level' => $this->level,
            'segment_count' => $this->sentences_count ?? $this->sentences()->count(),
            'estimated_minutes' => $this->estimated_minutes,
        ];
    }
}
