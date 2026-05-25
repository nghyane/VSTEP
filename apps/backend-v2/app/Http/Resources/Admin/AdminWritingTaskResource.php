<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamVersionWritingTask;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read ExamVersionWritingTask $resource */
final class AdminWritingTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'exam_version_id' => $this->resource->exam_version_id,
            'part' => $this->resource->part,
            'task_type' => $this->resource->task_type,
            'duration_minutes' => $this->resource->duration_minutes,
            'prompt' => $this->resource->prompt,
            'min_words' => $this->resource->min_words,
            'instructions' => $this->resource->instructions,
            'display_order' => $this->resource->display_order,
        ];
    }
}
