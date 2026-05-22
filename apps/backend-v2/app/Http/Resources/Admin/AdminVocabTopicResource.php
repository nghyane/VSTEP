<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\VocabTopic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin-facing resource. Khác learner ở chỗ luôn expose `is_published`.
 * Children (words, exercises) trả qua resource riêng khi loaded.
 *
 * @property-read VocabTopic $resource
 */
final class AdminVocabTopicResource extends JsonResource
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
            'is_published' => (bool) $this->resource->is_published,
            'tasks' => $this->whenLoaded(
                'tasks',
                fn () => $this->resource->tasks->pluck('task')->all(),
            ),
            'word_count' => $this->when(
                isset($this->resource->words_count),
                fn () => (int) $this->resource->words_count,
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
