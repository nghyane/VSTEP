<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Reading;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $exerciseId = $this->route('id');

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('practice_reading_exercises', 'slug')->ignore($exerciseId),
            ],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'part' => ['sometimes', 'integer', 'in:1,2,3,4'],
            'passage' => ['sometimes', 'string'],
            'vietnamese_translation' => ['sometimes', 'nullable', 'string'],
            'keywords' => ['sometimes', 'array'],
            'keywords.*' => ['string'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
