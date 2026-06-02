<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VocabTopic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read VocabTopic $resource
 */
final class VocabTopicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'group_key' => $this->resource->group_key,
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
            'learned_count' => $this->when(
                isset($this->resource->learned_count),
                fn () => $this->resource->learned_count,
            ),
            'recommended_topic_id' => $this->when(
                $this->resource->getAttribute('recommended_topic_id') !== null,
                fn () => $this->resource->getAttribute('recommended_topic_id'),
            ),
            'adaptive_reason' => $this->when(
                $this->resource->getAttribute('adaptive_reason') !== null,
                fn () => $this->resource->getAttribute('adaptive_reason'),
            ),
            'adaptive_label' => $this->when(
                $this->resource->getAttribute('adaptive_label') !== null,
                fn () => $this->resource->getAttribute('adaptive_label'),
            ),
        ];
    }
}
