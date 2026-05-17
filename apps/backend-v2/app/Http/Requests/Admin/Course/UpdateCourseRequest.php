<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use App\Enums\Role;
use App\Enums\VstepLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
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
            // Update: không enforce after_or_equal:today vì course cũ có thể đã bắt đầu.
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after:start_date'],
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
