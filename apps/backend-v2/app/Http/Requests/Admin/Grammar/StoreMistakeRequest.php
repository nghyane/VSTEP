<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

final class StoreMistakeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'wrong' => ['required', 'string'],
            'correct' => ['required', 'string'],
            'explanation' => ['required', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
