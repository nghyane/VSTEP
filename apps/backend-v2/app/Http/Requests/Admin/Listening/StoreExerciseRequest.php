<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Listening;

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
            'slug' => ['required', 'string', 'max:80', 'unique:practice_listening_exercises,slug'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'part' => ['required', 'integer', 'in:1,2,3'],
            'audio_url' => ['nullable', 'string', 'max:500'],
            'transcript' => ['required', 'string'],
            'vietnamese_transcript' => ['nullable', 'string'],
            'word_timestamps' => ['nullable', 'array'],
            'word_timestamps.*.word' => ['required_with:word_timestamps', 'string'],
            'word_timestamps.*.offset' => ['required_with:word_timestamps', 'numeric'],
            'word_timestamps.*.duration' => ['required_with:word_timestamps', 'numeric'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
