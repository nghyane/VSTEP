<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $examId = $this->route('id');

        return [
            'slug' => ['sometimes', 'string', 'max:100', Rule::unique('exams', 'slug')->ignore($examId)],
            'title' => ['sometimes', 'string', 'max:200'],
            'source_school' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'total_duration_minutes' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
