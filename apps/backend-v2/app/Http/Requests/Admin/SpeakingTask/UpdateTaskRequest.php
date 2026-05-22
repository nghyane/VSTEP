<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingTask;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $taskId = $this->route('id');

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('practice_speaking_tasks', 'slug')->ignore($taskId),
            ],
            'title' => ['sometimes', 'string', 'max:200'],
            'part' => ['sometimes', 'integer', 'in:1,2,3'],
            'task_type' => ['sometimes', 'string', 'in:social,solution,topic'],
            'content' => ['sometimes', 'array'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'speaking_seconds' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
