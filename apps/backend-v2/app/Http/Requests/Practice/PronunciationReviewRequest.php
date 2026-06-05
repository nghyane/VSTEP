<?php

declare(strict_types=1);

namespace App\Http\Requests\Practice;

use Illuminate\Foundation\Http\FormRequest;

final class PronunciationReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'original' => ['required', 'string', 'max:500'],
            'transcript' => ['required', 'string', 'max:500'],
            'segment_id' => ['nullable', 'uuid'],
        ];
    }
}
