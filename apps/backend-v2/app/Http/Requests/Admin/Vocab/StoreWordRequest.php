<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;

class StoreWordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'word' => ['required', 'string', 'max:100'],
            'phonetic' => ['nullable', 'string', 'max:100'],
            'part_of_speech' => ['required', 'string', 'max:30'],
            'definition' => ['required', 'string'],
            'example' => ['nullable', 'string'],
            'synonyms' => ['nullable', 'array'],
            'synonyms.*' => ['string'],
            'collocations' => ['nullable', 'array'],
            'collocations.*' => ['string'],
            'word_family' => ['nullable', 'array'],
            'word_family.*' => ['string'],
            'vstep_tip' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
