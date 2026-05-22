<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingDrill;

use Illuminate\Foundation\Http\FormRequest;

final class StoreSentenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string'],
            'ipa' => ['nullable', 'string', 'max:500'],
            'translation' => ['nullable', 'string'],
            'word_count' => ['nullable', 'integer', 'min:0'],
            'audio_start' => ['nullable', 'numeric', 'min:0'],
            'audio_end' => ['nullable', 'numeric', 'min:0'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
