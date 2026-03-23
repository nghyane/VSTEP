<?php

namespace App\Http\Requests\Progress;

use Illuminate\Foundation\Http\FormRequest;

class StoreGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'targetBand' => ['required', 'string', 'in:B1,B2,C1'],
            'currentEstimatedBand' => ['nullable', 'string', 'in:B1,B2,C1'],
            'deadline' => ['nullable', 'date'],
            'dailyStudyTimeMinutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
