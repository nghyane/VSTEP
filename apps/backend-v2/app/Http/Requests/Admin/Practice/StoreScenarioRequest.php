<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Practice;

use Illuminate\Foundation\Http\FormRequest;

final class StoreScenarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:practice_speaking_scenarios,slug'],
            'title' => ['required', 'string', 'max:200'],
            'level' => ['required', 'string', 'in:A1,A2,B1,B2,C1'],
            'character_name' => ['required', 'string', 'max:80'],
            'character_voice_label' => ['required', 'string', 'max:40'],
            'description' => ['required', 'string'],
            'system_prompt' => ['required', 'string'],
            'opening_line' => ['required', 'string'],
            'target_vocab' => ['nullable', 'array'],
            'target_vocab.*' => ['string'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'expected_turns' => ['required', 'integer', 'min:2'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
