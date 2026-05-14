<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeSpeakingDrill;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeSpeakingDrill $resource
 */
class AdminSpeakingDrillResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'level' => $this->resource->level,
            'estimated_minutes' => $this->resource->estimated_minutes,
            'is_published' => (bool) $this->resource->is_published,
            'sentence_count' => $this->when(
                isset($this->resource->sentences_count),
                fn () => (int) $this->resource->sentences_count,
            ),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
