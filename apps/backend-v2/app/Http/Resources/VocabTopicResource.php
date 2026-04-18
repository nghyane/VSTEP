<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VocabTopic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read VocabTopic $resource
 */
class VocabTopicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'name' => $this->resource->name,
            'description' => $this->resource->description,
            'level' => $this->resource->level,
            'icon_key' => $this->resource->icon_key,
            'display_order' => $this->resource->display_order,
            'tasks' => $this->whenLoaded('tasks', fn () => $this->resource->tasks->pluck('task')),
            'word_count' => $this->when(
                isset($this->resource->words_count),
                fn () => $this->resource->words_count,
            ),
        ];
    }
}
