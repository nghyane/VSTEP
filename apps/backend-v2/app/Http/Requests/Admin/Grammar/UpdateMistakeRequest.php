<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateMistakeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'wrong' => ['sometimes', 'string'],
            'correct' => ['sometimes', 'string'],
            'explanation' => ['sometimes', 'string'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
