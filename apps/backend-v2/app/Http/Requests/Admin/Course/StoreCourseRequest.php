<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use App\Enums\Role;
use App\Enums\VstepLevel;
use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $targetLevels = array_map(fn (VstepLevel $l) => $l->value, VstepLevel::targetOptions());

        return [
            'slug' => ['required', 'string', 'max:80', 'unique:courses,slug'],
            'title' => ['required', 'string', 'max:200'],
            'target_level' => ['required', 'string', Rule::in($targetLevels)],
            'target_exam_school' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'rules' => ['nullable', 'string', 'max:5000'],
            // price_coins: legacy field. Mọi course mua bằng VND (RFC 0003 §8).
            // Service default 0; không expose ở form admin.
            'price_coins' => ['nullable', 'integer', 'min:0'],
            'bonus_coins' => ['nullable', 'integer', 'min:0'],
            'price_vnd' => ['required', 'integer', 'min:0'],
            'original_price_vnd' => ['nullable', 'integer', 'min:0'],
            'max_slots' => ['required', 'integer', 'min:1'],
            'max_slots_per_student' => ['nullable', 'integer', 'min:1'],
            'booking_coin_cost' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => [
                'required', 'date', 'after:start_date',
                function (string $attr, mixed $value, \Closure $fail) {
                    $start = $this->input('start_date');
                    if (! $start || ! strtotime($start) || ! strtotime((string) $value)) {
                        return; // other rules handle format
                    }
                    $maxEnd = date('Y-m-d', strtotime('+'.Course::MAX_DURATION_DAYS.' days', strtotime($start)));
                    if ($value > $maxEnd) {
                        $fail('Khóa học không được kéo dài quá '.Course::MAX_DURATION_DAYS.' ngày.');
                    }
                },
            ],
            'required_full_tests' => ['required', 'integer', 'min:0'],
            'commitment_window_days' => ['required', 'integer', 'min:0'],
            'livestream_url' => ['nullable', 'string', 'max:500'],
            'teacher_id' => [
                'required', 'uuid',
                Rule::exists('users', 'id')->where('role', Role::Teacher->value),
            ],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_id.exists' => 'Người dùng được chọn không phải giáo viên.',
        ];
    }
}
