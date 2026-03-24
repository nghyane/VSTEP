<?php

namespace App\Http\Requests\Exam;

use App\Enums\ExamType;
use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'level' => ['sometimes', 'string', Rule::enum(Level::class)],
            'type' => ['sometimes', 'string', Rule::enum(ExamType::class)],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'blueprint' => ['nullable', 'array'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
