<?php

declare(strict_types=1);

namespace App\Http\Requests\Practice;

use Illuminate\Foundation\Http\FormRequest;

final class WritingDiagnosticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prompt_id' => ['required', 'uuid', 'exists:practice_writing_prompts,id'],
            'text' => ['present', 'nullable', 'string', 'max:5000'],
        ];
    }
}
