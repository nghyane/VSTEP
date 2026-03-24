<?php

namespace App\Http\Requests\Progress;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_band' => ['sometimes', 'string', 'in:B1,B2,C1'],
            'current_estimated_band' => ['nullable', 'string', 'in:B1,B2,C1'],
            'deadline' => ['nullable', 'date'],
            'daily_study_time_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
