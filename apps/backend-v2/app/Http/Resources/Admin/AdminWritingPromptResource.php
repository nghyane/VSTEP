<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeWritingPrompt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeWritingPrompt $resource
 */
class AdminWritingPromptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'part' => $this->resource->part,
            'prompt' => $this->resource->prompt,
            'min_words' => $this->resource->min_words,
            'max_words' => $this->resource->max_words,
            'required_points' => $this->resource->required_points ?? [],
            'keywords' => $this->resource->keywords ?? [],
            'sentence_starters' => $this->resource->sentence_starters ?? [],
            'sample_answer' => $this->resource->sample_answer,
            'estimated_minutes' => $this->resource->estimated_minutes,
            'is_published' => (bool) $this->resource->is_published,
            'marker_count' => $this->when(
                isset($this->resource->sample_markers_count),
                fn () => (int) $this->resource->sample_markers_count,
            ),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
