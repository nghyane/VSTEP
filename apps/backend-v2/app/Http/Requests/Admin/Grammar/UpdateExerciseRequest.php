<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Không cho đổi `kind` sau khi tạo. Validate payload lỏng — service strip
 * key thừa theo kind hiện có khi persist.
 */
final class UpdateExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'explanation' => ['sometimes', 'string'],
            'display_order' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
            'payload' => ['sometimes', 'array'],

            'payload.prompt' => ['sometimes', 'string'],
            'payload.options' => ['sometimes', 'array', 'size:4'],
            'payload.options.*' => ['required_with:payload.options', 'string'],
            'payload.correct_index' => ['sometimes', 'integer', 'between:0,3'],
        ];
    }
}
