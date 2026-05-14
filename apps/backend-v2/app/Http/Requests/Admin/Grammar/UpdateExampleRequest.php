<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'en' => ['sometimes', 'string'],
            'vi' => ['sometimes', 'string'],
            'note' => ['sometimes', 'nullable', 'string'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
