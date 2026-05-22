<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Buổi học phải nằm trong khung [course.start_date, course.end_date].
        // Tìm course từ route param `id` để inject min/max vào rule.
        $course = Course::query()->find($this->route('id'));
        $dateRules = ['required', 'date'];
        if ($course !== null) {
            $dateRules[] = 'after_or_equal:'.$course->start_date->toDateString();
            $dateRules[] = 'before_or_equal:'.$course->end_date->toDateString();
        }

        return [
            'session_number' => ['nullable', 'integer', 'min:1'],
            'date' => $dateRules,
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'topic' => ['required', 'string', 'max:100'],
        ];
    }
}
