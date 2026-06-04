<?php

declare(strict_types=1);

namespace App\Http\Requests\Feedback;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_type' => [
                'required',
                'string',
                'max:50',
                Rule::in(['practice_listening_exercise', 'practice_reading_exercise']),
            ],
            'content_id' => ['required', 'uuid'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
