<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\GrammarPoint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarPoint $resource
 */
final class GrammarPointResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'name' => $this->resource->name,
            'vietnamese_name' => $this->resource->vietnamese_name,
            'summary' => $this->resource->summary,
            'learning_objective' => $this->resource->learning_objective,
            'success_criteria' => $this->resource->success_criteria,
            'prerequisite_slugs' => $this->resource->prerequisite_slugs ?? [],
            'cefr_descriptor' => $this->resource->cefr_descriptor,
            'vstep_use_case' => $this->resource->vstep_use_case,
            'assessed_by' => $this->resource->assessed_by ?? [],
            'is_checkpoint' => $this->resource->is_checkpoint,
            'category' => $this->resource->category,
            'display_order' => $this->resource->display_order,
            'levels' => $this->whenLoaded('levels', fn () => $this->resource->levels->pluck('level')),
            'tasks' => $this->whenLoaded('tasks', fn () => $this->resource->tasks->pluck('task')),
            'functions' => $this->whenLoaded('functions', fn () => $this->resource->functions->pluck('function')),
        ];
    }
}
