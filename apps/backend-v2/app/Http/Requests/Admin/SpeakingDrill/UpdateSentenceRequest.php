<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingDrill;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSentenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['sometimes', 'string'],
            'translation' => ['sometimes', 'nullable', 'string'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
