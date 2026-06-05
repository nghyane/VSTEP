<?php

declare(strict_types=1);

namespace App\Http\Requests\Audio;

use Illuminate\Foundation\Http\FormRequest;

final class PresignUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'context' => ['required', 'string', 'in:practice_speaking,exam_speaking'],
            'content_type' => ['nullable', 'string', 'max:100'],
            'extension' => ['nullable', 'string', 'max:12'],
        ];
    }
}
