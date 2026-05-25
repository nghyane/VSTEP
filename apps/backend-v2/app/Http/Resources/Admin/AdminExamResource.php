<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Exam;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read Exam $resource */
final class AdminExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'source_school' => $this->resource->source_school,
            'tags' => $this->resource->tags,
            'total_duration_minutes' => $this->resource->total_duration_minutes,
            'is_published' => (bool) $this->resource->is_published,
            'version_count' => $this->when(
                isset($this->resource->versions_count),
                fn () => (int) $this->resource->versions_count,
            ),
            'active_version' => $this->whenLoaded('versions', function () {
                $active = $this->resource->versions->firstWhere('is_active', true);

                return $active ? [
                    'id' => $active->id,
                    'version_number' => $active->version_number,
                    'published_at' => $active->published_at,
                ] : null;
            }),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
