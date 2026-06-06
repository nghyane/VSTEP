<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\CourseScheduleItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read CourseScheduleItem $resource
 */
final class AdminScheduleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'course_id' => $this->resource->course_id,
            'session_number' => (int) $this->resource->session_number,
            'date' => $this->resource->date,
            // PG TIME trả "HH:MM:SS" — trim phần giây cho FE dùng trực tiếp với <input type="time">.
            'start_time' => substr($this->resource->start_time, 0, 5),
            'end_time' => substr($this->resource->end_time, 0, 5),
            'topic' => $this->resource->topic,
            'status' => $this->resource->status ?? 'scheduled',
            'cancel_reason' => $this->resource->cancel_reason,
        ];
    }
}
