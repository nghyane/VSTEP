<?php

declare(strict_types=1);

namespace App\Http\Requests\Onboarding;

use App\Enums\VstepBand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SkipOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_band' => ['required', 'string', Rule::enum(VstepBand::class)],
            'english_years' => ['nullable', 'integer', 'min:0', 'max:50'],
            'previous_test' => ['nullable', 'string', Rule::in(['ielts', 'toeic', 'vstep', 'other', 'none'])],
            'previous_score' => ['nullable', 'string', 'max:20'],
            'deadline' => ['nullable', 'date'],
            'daily_study_time_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
