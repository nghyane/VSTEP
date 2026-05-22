<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GrammarPoint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarPoint $resource
 */
final class AdminGrammarPointResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'name' => $this->resource->name,
            'vietnamese_name' => $this->resource->vietnamese_name,
            'summary' => $this->resource->summary,
            'category' => $this->resource->category,
            'display_order' => $this->resource->display_order,
            'is_published' => (bool) $this->resource->is_published,
            'levels' => $this->whenLoaded(
                'levels',
                fn () => $this->resource->levels->pluck('level')->all(),
            ),
            'tasks' => $this->whenLoaded(
                'tasks',
                fn () => $this->resource->tasks->pluck('task')->all(),
            ),
            'functions' => $this->whenLoaded(
                'functions',
                fn () => $this->resource->functions->pluck('function')->all(),
            ),
            'structure_count' => $this->when(
                isset($this->resource->structures_count),
                fn () => (int) $this->resource->structures_count,
            ),
            'example_count' => $this->when(
                isset($this->resource->examples_count),
                fn () => (int) $this->resource->examples_count,
            ),
            'exercise_count' => $this->when(
                isset($this->resource->exercises_count),
                fn () => (int) $this->resource->exercises_count,
            ),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
