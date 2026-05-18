<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingDrill;

use Illuminate\Foundation\Http\FormRequest;

class StoreSentenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string'],
            'translation' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
