<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

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
            'target_level' => ['required', 'string', 'in:B1,B2,C1'],
            'target_deadline' => ['required', 'date', 'after:today'],
        ];
    }
}
