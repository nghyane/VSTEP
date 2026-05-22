<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Writing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMarkerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'match' => ['sometimes', 'string'],
            'occurrence' => ['sometimes', 'integer', 'min:1'],
            'side' => ['sometimes', 'string', 'in:left,right'],
            'color' => ['sometimes', 'string', 'max:20'],
            'label' => ['sometimes', 'string', 'max:100'],
            'detail' => ['sometimes', 'nullable', 'string'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
