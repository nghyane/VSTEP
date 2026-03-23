<?php

namespace App\Http\Requests\Question;

use App\Enums\Level;
use App\Enums\Skill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'skill' => ['sometimes', 'string', Rule::enum(Skill::class)],
            'level' => ['sometimes', 'string', Rule::enum(Level::class)],
            'part' => ['sometimes', 'integer', 'min:1'],
            'topic' => ['nullable', 'string', 'max:100'],
            'content' => ['sometimes', 'array'],
            'answerKey' => ['nullable', 'array'],
            'explanation' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
            'knowledgePointIds' => ['nullable', 'array'],
            'knowledgePointIds.*' => ['uuid', 'exists:knowledge_points,id'],
        ];
    }
}
