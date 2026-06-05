<?php

declare(strict_types=1);

namespace App\Http\Requests\Feedback;

use Illuminate\Foundation\Http\FormRequest;

final class ListFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_type' => ['required', 'string'],
            'content_id' => ['required', 'uuid'],
        ];
    }
}
