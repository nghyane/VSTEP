<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateMcqItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'stem' => ['sometimes', 'string'],
            'options' => ['sometimes', 'array', 'size:4'],
            'options.*' => ['required', 'string'],
            'correct_index' => ['sometimes', 'integer', 'between:0,3'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
