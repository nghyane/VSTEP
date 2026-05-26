<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use App\Enums\Role;
use App\Enums\VstepLevel;
use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $courseId = $this->route('id');
        $targetLevels = array_map(fn (VstepLevel $l) => $l->value, VstepLevel::targetOptions());

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('courses', 'slug')->ignore($courseId),
            ],
            'title' => ['sometimes', 'string', 'max:200'],
            'target_level' => ['sometimes', 'string', Rule::in($targetLevels)],
            'target_exam_school' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'rules' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'price_coins' => ['sometimes', 'integer', 'min:0'],
            'bonus_coins' => ['sometimes', 'integer', 'min:0'],
            'price_vnd' => ['sometimes', 'integer', 'min:0'],
            'original_price_vnd' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_slots' => ['sometimes', 'integer', 'min:1'],
            'max_slots_per_student' => ['sometimes', 'integer', 'min:1'],
            'booking_coin_cost' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            // Update: không enforce after_or_equal:today vì course cũ có thể đã bắt đầu.
            // Lock start_date nếu còn <= 10 ngày trước khóa bắt đầu (tránh ảnh hưởng booking).
            'start_date' => [
                'sometimes', 'date',
                function (string $attr, mixed $value, \Closure $fail) {
                    $course = Course::find($this->route('id'));
                    if (! $course) {
                        return;
                    }
                    $currentStart = $course->start_date;
                    $daysUntilStart = (int) now()->startOfDay()->diffInDays($currentStart, false);
                    if ($daysUntilStart <= Course::START_DATE_LOCK_DAYS && (string) $value !== $currentStart->toDateString()) {
                        $fail('Không thể đổi ngày bắt đầu khi còn '.Course::START_DATE_LOCK_DAYS.' ngày hoặc ít hơn trước khi khóa học bắt đầu.');
                    }
                },
            ],
            'end_date' => [
                'sometimes', 'date', 'after:start_date',
                function (string $attr, mixed $value, \Closure $fail) {
                    $start = $this->input('start_date')
                        ?? Course::where('id', $this->route('id'))->value('start_date');
                    if (! $start || ! strtotime((string) $start) || ! strtotime((string) $value)) {
                        return;
                    }
                    $maxEnd = date('Y-m-d', strtotime('+'.Course::MAX_DURATION_DAYS.' days', strtotime((string) $start)));
                    if ($value > $maxEnd) {
                        $fail('Khóa học không được kéo dài quá '.Course::MAX_DURATION_DAYS.' ngày.');
                    }
                },
            ],
            'required_full_tests' => ['sometimes', 'integer', 'min:0'],
            'commitment_window_days' => ['sometimes', 'integer', 'min:0'],
            'livestream_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'teacher_id' => [
                'sometimes', 'uuid',
                Rule::exists('users', 'id')->where('role', Role::Teacher->value),
            ],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.exists' => 'Người dùng được chọn không phải giáo viên.',
        ];
    }
}
