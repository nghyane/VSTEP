<?php

declare(strict_types=1);

namespace App\Http\Requests\Onboarding;

use App\Enums\Level;
use App\Enums\VstepBand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SelfAssessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'listening' => ['required', 'string', Rule::enum(Level::class)],
            'reading' => ['required', 'string', Rule::enum(Level::class)],
            'writing' => ['required', 'string', Rule::enum(Level::class)],
            'speaking' => ['required', 'string', Rule::enum(Level::class)],
            'target_band' => ['required', 'string', Rule::enum(VstepBand::class)],
            'deadline' => ['nullable', 'date'],
            'daily_study_time_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
