<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamVersionListeningSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read ExamVersionListeningSection $resource */
final class AdminListeningSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'exam_version_id' => $this->resource->exam_version_id,
            'part' => $this->resource->part,
            'part_title' => $this->resource->part_title,
            'duration_minutes' => $this->resource->duration_minutes,
            'audio_url' => $this->resource->audio_url,
            'display_order' => $this->resource->display_order,
        ];
    }
}
