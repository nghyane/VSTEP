<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

final class SaveExamDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('exam_session'));
    }

    public function rules(): array
    {
        return [
            'skill_idx' => ['required', 'integer', 'min:0', 'max:3'],

            'mcq_answers' => ['present', 'array'],
            'mcq_answers.*.item_ref_id' => ['required', 'uuid'],
            'mcq_answers.*.selected_index' => ['required', 'integer', 'min:0', 'max:3'],

            'writing_answers' => ['present', 'array'],
            'writing_answers.*.task_id' => ['required', 'uuid'],
            'writing_answers.*.text' => ['present', 'string'],

            'speaking_marks' => ['present', 'array'],
            'speaking_marks.*.part_id' => ['required', 'uuid'],
            'speaking_marks.*.audio_url' => ['nullable', 'string', 'max:500'],
            'speaking_marks.*.duration_seconds' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
