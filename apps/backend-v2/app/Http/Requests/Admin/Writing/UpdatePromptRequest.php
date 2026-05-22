<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Writing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdatePromptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $promptId = $this->route('id');

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('practice_writing_prompts', 'slug')->ignore($promptId),
            ],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'part' => ['sometimes', 'integer', 'in:1,2'],
            'prompt' => ['sometimes', 'string'],
            'min_words' => ['sometimes', 'integer', 'min:1'],
            'max_words' => ['sometimes', 'integer'],
            'required_points' => ['sometimes', 'array'],
            'required_points.*' => ['string'],
            'keywords' => ['sometimes', 'array'],
            'keywords.*' => ['string'],
            'sentence_starters' => ['sometimes', 'array'],
            'sentence_starters.*' => ['string'],
            'sample_answer' => ['sometimes', 'nullable', 'string'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
