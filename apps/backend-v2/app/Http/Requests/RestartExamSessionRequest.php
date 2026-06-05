<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class RestartExamSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'abandon_session_id' => ['required', 'uuid'],
            'mode' => ['required', 'in:custom,full'],
            'selected_skills' => ['required_if:mode,custom', 'array'],
            'selected_skills.*' => ['string', 'in:listening,reading,writing,speaking'],
            'time_extension_factor' => ['nullable', 'numeric', 'min:0.1', 'max:3'],
        ];
    }
}
