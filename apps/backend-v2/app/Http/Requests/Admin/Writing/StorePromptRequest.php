<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Writing;

use Illuminate\Foundation\Http\FormRequest;

class StorePromptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:practice_writing_prompts,slug'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'part' => ['required', 'integer', 'in:1,2'],
            'prompt' => ['required', 'string'],
            'min_words' => ['required', 'integer', 'min:1'],
            'max_words' => ['required', 'integer', 'gte:min_words'],
            'required_points' => ['nullable', 'array'],
            'required_points.*' => ['string'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'sentence_starters' => ['nullable', 'array'],
            'sentence_starters.*' => ['string'],
            'sample_answer' => ['nullable', 'string'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
