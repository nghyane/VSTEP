<?php

declare(strict_types=1);

namespace App\Http\Requests\Onboarding;

use App\Enums\VstepBand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompletePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_band' => ['required', 'string', Rule::enum(VstepBand::class)],
            'deadline' => ['nullable', 'date'],
            'daily_study_time_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
