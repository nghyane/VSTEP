<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\GrammarPoint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarPoint $resource
 */
class GrammarPointResource extends JsonResource
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
            'levels' => $this->whenLoaded('levels', fn () => $this->resource->levels->pluck('level')),
            'tasks' => $this->whenLoaded('tasks', fn () => $this->resource->tasks->pluck('task')),
            'functions' => $this->whenLoaded('functions', fn () => $this->resource->functions->pluck('function')),
        ];
    }
}
