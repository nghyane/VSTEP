<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingDrill;

use Illuminate\Foundation\Http\FormRequest;

class StoreDrillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:practice_speaking_drills,slug'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'level' => ['required', 'string', 'in:A1,A2,B1,B2,C1'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'audio_url' => ['nullable', 'string', 'max:500'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
