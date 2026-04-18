<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class SubmitOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'weaknesses' => ['required', 'array'],
            'weaknesses.*' => ['string', 'in:listening,reading,writing,speaking'],
            'motivation' => ['nullable', 'string', 'in:graduation,job_requirement,scholarship,personal,certification'],
            'raw_answers' => ['required', 'array'],
        ];
    }
}
