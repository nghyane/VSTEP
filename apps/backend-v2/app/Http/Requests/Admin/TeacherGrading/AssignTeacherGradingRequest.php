<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\TeacherGrading;

use Illuminate\Foundation\Http\FormRequest;

final class AssignTeacherGradingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'uuid', 'exists:users,id'],
            'staff_note' => ['nullable', 'string', 'max:2000'],
            'due_at' => ['nullable', 'date'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
