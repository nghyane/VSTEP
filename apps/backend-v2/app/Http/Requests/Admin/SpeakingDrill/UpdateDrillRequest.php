<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingDrill;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDrillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $drillId = $this->route('id');

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('practice_speaking_drills', 'slug')->ignore($drillId),
            ],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'level' => ['sometimes', 'string', 'in:A2,B1,B2,C1'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
