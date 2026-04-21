<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PracticeListeningExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lightweight resource for list view — no transcript/timestamps.
 *
 * @property-read PracticeListeningExercise $resource
 */
class PracticeListeningExerciseSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'part' => $this->resource->part,
            'estimated_minutes' => $this->resource->estimated_minutes,
        ];
    }
}
