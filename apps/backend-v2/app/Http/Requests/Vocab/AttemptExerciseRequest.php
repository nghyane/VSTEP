<?php

declare(strict_types=1);

namespace App\Http\Requests\Vocab;

use Illuminate\Foundation\Http\FormRequest;

class AttemptExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'answer' => ['required', 'array'],
            'answer.selected_index' => ['nullable', 'integer', 'min:0', 'max:3'],
            'answer.text' => ['nullable', 'string', 'max:200'],
            'session_id' => ['nullable', 'uuid', 'exists:practice_sessions,id'],
        ];
    }
}
