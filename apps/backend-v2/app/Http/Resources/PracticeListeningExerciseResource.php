<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PracticeListeningExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeListeningExercise $resource
 */
class PracticeListeningExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'part' => $this->resource->part,
            'audio_url' => $this->resource->audio_url,
            'transcript' => $this->resource->transcript,
            'vietnamese_transcript' => $this->resource->vietnamese_transcript,
            'word_timestamps' => $this->resource->word_timestamps ?? [],
            'keywords' => $this->resource->keywords ?? [],
            'estimated_minutes' => $this->resource->estimated_minutes,
        ];
    }
}
