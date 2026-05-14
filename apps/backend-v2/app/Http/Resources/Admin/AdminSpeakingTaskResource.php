<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeSpeakingTask;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeSpeakingTask $resource
 */
class AdminSpeakingTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'part' => $this->resource->part,
            'task_type' => $this->resource->task_type,
            'content' => $this->resource->content,
            'estimated_minutes' => $this->resource->estimated_minutes,
            'speaking_seconds' => $this->resource->speaking_seconds,
            'is_published' => (bool) $this->resource->is_published,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
