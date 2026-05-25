<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class StoreSpeakingPartRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['required', 'integer', 'min:1'],
            'type' => ['required', 'string', 'max:20'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'speaking_seconds' => ['required', 'integer', 'min:1'],
            'content' => ['required', 'array'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
