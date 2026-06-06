<?php

declare(strict_types=1);

namespace App\Http\Requests\TeacherGrading;

use Illuminate\Foundation\Http\FormRequest;

final class StoreTeacherGradingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
