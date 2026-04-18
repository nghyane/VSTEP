<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PracticeReadingExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeReadingExercise $resource
 */
class PracticeReadingExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'part' => $this->resource->part,
            'passage' => $this->resource->passage,
            'vietnamese_translation' => $this->resource->vietnamese_translation,
            'keywords' => $this->resource->keywords ?? [],
            'estimated_minutes' => $this->resource->estimated_minutes,
        ];
    }
}
