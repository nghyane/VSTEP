<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class StoreWritingTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['required', 'integer', 'min:1'],
            'task_type' => ['required', 'string', 'in:letter,essay'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'prompt' => ['required', 'string'],
            'min_words' => ['required', 'integer', 'min:1'],
            'instructions' => ['nullable', 'array'],
            'instructions.*' => ['string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
