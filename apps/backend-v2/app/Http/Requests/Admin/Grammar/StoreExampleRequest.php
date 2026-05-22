<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

class StoreExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'en' => ['required', 'string'],
            'vi' => ['required', 'string'],
            'note' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
