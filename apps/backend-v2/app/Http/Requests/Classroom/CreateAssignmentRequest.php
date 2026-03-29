<?php

declare(strict_types=1);

namespace App\Http\Requests\Classroom;

use App\Enums\AssignmentType;
use App\Enums\Skill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAssignmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'content' => ['nullable', 'string', 'max:10000'],
            'audio_url' => ['nullable', 'string', 'url', 'max:500'],
            'skill' => ['nullable', Rule::enum(Skill::class)],
            'type' => ['sometimes', Rule::enum(AssignmentType::class)],
            'exam_id' => ['nullable', 'uuid', 'exists:exams,id'],
            'due_date' => ['nullable', 'date', 'after:now'],
            'allow_retry' => ['sometimes', 'boolean'],
        ];
    }
}
