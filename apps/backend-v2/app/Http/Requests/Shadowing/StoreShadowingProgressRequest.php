<?php

declare(strict_types=1);

namespace App\Http\Requests\Shadowing;

use Illuminate\Foundation\Http\FormRequest;

final class StoreShadowingProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lesson_id' => ['required', 'string', 'max:64'],
            'segment_index' => ['required', 'integer', 'min:0'],
            'accuracy_percent' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
