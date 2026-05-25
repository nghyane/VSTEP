<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateSpeakingPartRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['sometimes', 'integer', 'min:1'],
            'type' => ['sometimes', 'string', 'max:20'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1'],
            'speaking_seconds' => ['sometimes', 'integer', 'min:1'],
            'content' => ['sometimes', 'array'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
