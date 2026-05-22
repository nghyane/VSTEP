<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Practice;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateScenarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'slug' => ['sometimes', 'string', 'max:80', Rule::unique('practice_speaking_scenarios', 'slug')->ignore($id)],
            'title' => ['sometimes', 'string', 'max:200'],
            'level' => ['sometimes', 'string', 'in:A1,A2,B1,B2,C1'],
            'character_name' => ['sometimes', 'string', 'max:80'],
            'character_voice_label' => ['sometimes', 'string', 'max:40'],
            'description' => ['sometimes', 'string'],
            'system_prompt' => ['sometimes', 'string'],
            'opening_line' => ['sometimes', 'string'],
            'target_vocab' => ['sometimes', 'array'],
            'target_vocab.*' => ['string'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'expected_turns' => ['sometimes', 'integer', 'min:2'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
