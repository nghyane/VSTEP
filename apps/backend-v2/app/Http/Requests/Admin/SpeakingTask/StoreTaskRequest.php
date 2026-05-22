<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SpeakingTask;

use Illuminate\Foundation\Http\FormRequest;

/**
 * task_type ∈ (social, solution, topic) — theo migration. Mapping với part:
 * part 1 = social, part 2 = solution, part 3 = topic.
 * content shape free-form JSON per part — admin tự nhập đúng schema.
 */
final class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:practice_speaking_tasks,slug'],
            'title' => ['required', 'string', 'max:200'],
            'part' => ['required', 'integer', 'in:1,2,3'],
            'task_type' => ['required', 'string', 'in:social,solution,topic'],
            'content' => ['required', 'array'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'speaking_seconds' => ['required', 'integer', 'min:1'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
