<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use App\Models\CourseScheduleItem;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateScheduleItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Update không nhận course_id qua route; tra ngược qua item → course để check date range.
        $dateRules = ['sometimes', 'date'];
        $item = CourseScheduleItem::query()->with('course:id,start_date,end_date')->find($this->route('itemId'));
        if ($item !== null && $item->course !== null) {
            $dateRules[] = 'after_or_equal:'.$item->course->start_date->toDateString();
            $dateRules[] = 'before_or_equal:'.$item->course->end_date->toDateString();
        }

        return [
            'session_number' => ['sometimes', 'integer', 'min:1'],
            'date' => $dateRules,
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'topic' => ['sometimes', 'string', 'max:100'],
        ];
    }
}
