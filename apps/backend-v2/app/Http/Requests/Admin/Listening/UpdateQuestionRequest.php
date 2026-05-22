<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Listening;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'display_order' => ['sometimes', 'integer'],
            'question' => ['sometimes', 'string'],
            'options' => ['sometimes', 'array', 'size:4'],
            'options.*' => ['required_with:options', 'string'],
            'correct_index' => ['sometimes', 'integer', 'between:0,3'],
            'explanation' => ['sometimes', 'string'],
        ];
    }
}
