<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Listening;

use Illuminate\Foundation\Http\FormRequest;

final class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'display_order' => ['nullable', 'integer'],
            'question' => ['required', 'string'],
            'options' => ['required', 'array', 'size:4'],
            'options.*' => ['required', 'string'],
            'correct_index' => ['required', 'integer', 'between:0,3'],
            'explanation' => ['required', 'string'],
        ];
    }
}
