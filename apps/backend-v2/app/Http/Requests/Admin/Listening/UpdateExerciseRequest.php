<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Listening;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateExerciseRequest extends FormRequest
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
                Rule::unique('practice_listening_exercises', 'slug')->ignore($exerciseId),
            ],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'part' => ['sometimes', 'integer', 'in:1,2,3'],
            'audio_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'transcript' => ['sometimes', 'string'],
            'vietnamese_transcript' => ['sometimes', 'nullable', 'string'],
            'word_timestamps' => ['sometimes', 'array'],
            'word_timestamps.*.word' => ['required_with:word_timestamps', 'string'],
            'word_timestamps.*.offset' => ['required_with:word_timestamps', 'numeric'],
            'word_timestamps.*.duration' => ['required_with:word_timestamps', 'numeric'],
            'keywords' => ['sometimes', 'array'],
            'keywords.*' => ['string'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
