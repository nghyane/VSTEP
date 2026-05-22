<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateWordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'word' => ['sometimes', 'string', 'max:100'],
            'phonetic' => ['sometimes', 'nullable', 'string', 'max:100'],
            'part_of_speech' => ['sometimes', 'string', 'max:30'],
            'definition' => ['sometimes', 'string'],
            'example' => ['sometimes', 'nullable', 'string'],
            'synonyms' => ['sometimes', 'array'],
            'synonyms.*' => ['string'],
            'collocations' => ['sometimes', 'array'],
            'collocations.*' => ['string'],
            'word_family' => ['sometimes', 'array'],
            'word_family.*' => ['string'],
            'vstep_tip' => ['sometimes', 'nullable', 'string'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
