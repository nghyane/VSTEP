<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\CourseScheduleItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read CourseScheduleItem $resource
 */
final class TeacherScheduleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $course = $this->resource->relationLoaded('course') ? $this->resource->course : null;

        return [
            'id' => $this->resource->id,
            'course_id' => $this->resource->course_id,
            'session_number' => (int) $this->resource->session_number,
            'date' => $this->resource->date->toDateString(),
            'start_time' => substr($this->resource->start_time, 0, 5),
            'end_time' => substr($this->resource->end_time, 0, 5),
            'topic' => $this->resource->topic,
            'course' => $course !== null ? [
                'id' => $course->id,
                'title' => $course->title,
                'livestream_url' => $course->livestream_url,
            ] : null,
        ];
    }
}
