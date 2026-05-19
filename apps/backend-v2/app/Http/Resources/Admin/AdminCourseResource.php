<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Course $resource
 */
class AdminCourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'target_level' => $this->resource->target_level,
            'target_exam_school' => $this->resource->target_exam_school,
            'description' => $this->resource->description,
            'rules' => $this->resource->rules,
            'price_coins' => (int) $this->resource->price_coins,
            'bonus_coins' => (int) $this->resource->bonus_coins,
            'price_vnd' => (int) $this->resource->price_vnd,
            'original_price_vnd' => $this->resource->original_price_vnd !== null
                ? (int) $this->resource->original_price_vnd
                : null,
            'max_slots' => (int) $this->resource->max_slots,
            'max_slots_per_student' => (int) $this->resource->max_slots_per_student,
            'booking_coin_cost' => (int) $this->resource->booking_coin_cost,
            'start_date' => $this->resource->start_date,
            'end_date' => $this->resource->end_date,
            'required_full_tests' => (int) $this->resource->required_full_tests,
            'commitment_window_days' => (int) $this->resource->commitment_window_days,
            'livestream_url' => $this->resource->livestream_url,
            'teacher_id' => $this->resource->teacher_id,
            'teacher' => $this->whenLoaded('teacher', fn () => [
                'id' => $this->resource->teacher->id,
                'full_name' => $this->resource->teacher->full_name,
                'email' => $this->resource->teacher->email,
            ]),
            'is_published' => (bool) $this->resource->is_published,
            'enrollment_count' => $this->when(
                isset($this->resource->enrollments_count),
                fn () => (int) $this->resource->enrollments_count,
            ),
            'schedule_item_count' => $this->when(
                isset($this->resource->schedule_items_count),
                fn () => (int) $this->resource->schedule_items_count,
            ),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
