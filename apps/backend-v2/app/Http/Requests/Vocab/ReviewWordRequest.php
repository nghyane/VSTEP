<?php

declare(strict_types=1);

namespace App\Http\Requests\Vocab;

use Illuminate\Foundation\Http\FormRequest;

class ReviewWordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'word_id' => ['required', 'uuid', 'exists:vocab_words,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:4'],
            'session_id' => ['nullable', 'uuid', 'exists:practice_sessions,id'],
        ];
    }
}
