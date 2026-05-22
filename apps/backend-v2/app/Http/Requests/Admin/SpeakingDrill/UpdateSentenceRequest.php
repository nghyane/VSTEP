<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingDrill;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateSentenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['sometimes', 'string'],
            'ipa' => ['sometimes', 'nullable', 'string', 'max:500'],
            'translation' => ['sometimes', 'nullable', 'string'],
            'word_count' => ['sometimes', 'integer', 'min:0'],
            'audio_start' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'audio_end' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
