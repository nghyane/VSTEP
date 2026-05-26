<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateWritingTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['sometimes', 'integer', 'min:1'],
            'task_type' => ['sometimes', 'string', 'in:letter,essay'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1'],
            'prompt' => ['sometimes', 'string'],
            'min_words' => ['sometimes', 'integer', 'min:1'],
            'instructions' => ['nullable', 'array'],
            'instructions.*' => ['string'],
            'requirements' => ['sometimes', 'array', 'min:1'],
            'requirements.*' => ['string', 'min:1'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
