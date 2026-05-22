<?php

declare(strict_types=1);

namespace App\Http\Requests\Practice;

use Illuminate\Foundation\Http\FormRequest;

final class SubmitVstepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'audio_url' => ['required', 'string', 'max:500'],
            'duration_seconds' => ['required', 'integer', 'min:1'],
        ];
    }
}
