<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Enums\VstepLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nickname' => ['required', 'string', 'max:50'],
            'target_level' => ['required', 'string', Rule::enum(VstepLevel::class)->only(VstepLevel::targetOptions())],
            'target_deadline' => ['required', 'date', 'after:today'],
        ];
    }
}
