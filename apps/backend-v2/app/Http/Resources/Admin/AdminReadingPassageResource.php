<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamVersionReadingPassage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read ExamVersionReadingPassage $resource */
final class AdminReadingPassageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'exam_version_id' => $this->resource->exam_version_id,
            'part' => $this->resource->part,
            'title' => $this->resource->title,
            'duration_minutes' => $this->resource->duration_minutes,
            'passage' => $this->resource->passage,
            'display_order' => $this->resource->display_order,
        ];
    }
}
