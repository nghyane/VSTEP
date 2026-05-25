<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class StoreMcqItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'stem' => ['required', 'string'],
            'options' => ['required', 'array', 'size:4'],
            'options.*' => ['required', 'string'],
            'correct_index' => ['required', 'integer', 'between:0,3'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
