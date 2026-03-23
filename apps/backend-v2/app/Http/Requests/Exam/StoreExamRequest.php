<?php

namespace App\Http\Requests\Exam;

use App\Enums\ExamType;
use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'level' => ['sometimes', 'string', Rule::enum(Level::class)],
            'type' => ['sometimes', 'string', Rule::enum(ExamType::class)],
            'durationMinutes' => ['nullable', 'integer', 'min:1'],
            'blueprint' => ['nullable', 'array'],
            'blueprint.listening' => ['sometimes', 'array'],
            'blueprint.listening.questionIds' => ['required_with:blueprint.listening', 'array'],
            'blueprint.listening.questionIds.*' => ['uuid', 'exists:questions,id'],
            'blueprint.reading' => ['sometimes', 'array'],
            'blueprint.reading.questionIds' => ['required_with:blueprint.reading', 'array'],
            'blueprint.reading.questionIds.*' => ['uuid', 'exists:questions,id'],
            'blueprint.writing' => ['sometimes', 'array'],
            'blueprint.writing.questionIds' => ['required_with:blueprint.writing', 'array'],
            'blueprint.writing.questionIds.*' => ['uuid', 'exists:questions,id'],
            'blueprint.speaking' => ['sometimes', 'array'],
            'blueprint.speaking.questionIds' => ['required_with:blueprint.speaking', 'array'],
            'blueprint.speaking.questionIds.*' => ['uuid', 'exists:questions,id'],
            'blueprint.durationMinutes' => ['sometimes', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
        ];
    }
}
