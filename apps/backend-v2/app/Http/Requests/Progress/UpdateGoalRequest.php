<?php

declare(strict_types=1);

namespace App\Http\Requests\Progress;

use App\Enums\VstepBand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_band' => ['sometimes', 'string', Rule::enum(VstepBand::class)],
            'current_estimated_band' => ['nullable', 'string', Rule::enum(VstepBand::class)],
            'deadline' => ['nullable', 'date'],
            'daily_study_time_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
