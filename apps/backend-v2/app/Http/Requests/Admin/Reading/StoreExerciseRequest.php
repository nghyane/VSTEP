<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Reading;

use Illuminate\Foundation\Http\FormRequest;

final class StoreExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:practice_reading_exercises,slug'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'part' => ['required', 'integer', 'in:1,2,3,4'],
            'passage' => ['required', 'string'],
            'vietnamese_translation' => ['nullable', 'string'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
