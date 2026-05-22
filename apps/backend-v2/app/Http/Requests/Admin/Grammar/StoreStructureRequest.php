<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

final class StoreStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
