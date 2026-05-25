<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamVersionSpeakingPart;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read ExamVersionSpeakingPart $resource */
final class AdminSpeakingPartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'exam_version_id' => $this->resource->exam_version_id,
            'part' => $this->resource->part,
            'type' => $this->resource->type,
            'duration_minutes' => $this->resource->duration_minutes,
            'speaking_seconds' => $this->resource->speaking_seconds,
            'content' => $this->resource->content,
            'display_order' => $this->resource->display_order,
        ];
    }
}
