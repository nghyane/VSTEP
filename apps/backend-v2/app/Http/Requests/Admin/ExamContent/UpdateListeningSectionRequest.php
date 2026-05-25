<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateListeningSectionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['sometimes', 'integer', 'in:1,2,3'],
            'part_title' => ['sometimes', 'string', 'max:100'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1'],
            'audio_url' => ['nullable', 'string', 'max:500'],
            'transcript' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
