<?php

declare(strict_types=1);

namespace App\Http\Requests\Practice;

use Illuminate\Foundation\Http\FormRequest;

final class DrillAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sentence_id' => ['required', 'uuid'],
            'mode' => ['required', 'string', 'in:dictation,shadowing'],
            'user_text' => ['nullable', 'string'],
            'accuracy_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
