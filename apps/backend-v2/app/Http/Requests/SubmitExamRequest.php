<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\ExamSession;
use App\Models\ExamVersion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SubmitExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mcq_answers' => ['sometimes', 'array'],
            'mcq_answers.*.item_ref_type' => ['required', 'string', 'in:exam_listening_item,exam_reading_item'],
            'mcq_answers.*.item_ref_id' => ['required', 'uuid'],
            'mcq_answers.*.selected_index' => ['required', 'integer', 'min:0', 'max:3'],
            'writing_answers' => ['nullable', 'array'],
            'writing_answers.*.task_id' => ['required_with:writing_answers', 'uuid'],
            'writing_answers.*.text' => ['required_with:writing_answers', 'string', 'min:1'],
            'writing_answers.*.word_count' => ['required_with:writing_answers', 'integer', 'min:0'],
            'speaking_answers' => ['nullable', 'array'],
            'speaking_answers.*.part_id' => ['required_with:speaking_answers', 'uuid'],
            'speaking_answers.*.audio_url' => ['required_with:speaking_answers', 'url'],
            'speaking_answers.*.duration_seconds' => ['required_with:speaking_answers', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        $sessionId = $this->route('sessionId');
        /** @var ExamSession|null $session */
        $session = ExamSession::query()->find($sessionId);

        if ($session === null) {
            return [
                fn () => $this->validator()->errors()->add('session', 'Session not found.'),
            ];
        }

        return [
            function ($validator) use ($session) {
                $version = $session->examVersion;
                if ($version === null) {
                    $validator->errors()->add('session', 'Exam version not found.');

                    return;
                }

                $this->validateTaskIds($validator, $version, $this->input('writing_answers', []));
                $this->validatePartIds($validator, $version, $this->input('speaking_answers', []));
            },
        ];
    }

    /**
     * @param  Validator  $validator
     * @param  list<array<string,mixed>>  $writingAnswers
     */
    private function validateTaskIds($validator, ExamVersion $version, array $writingAnswers): void
    {
        $validTaskIds = $version->writingTasks()->pluck('id')->map(fn ($id) => (string) $id)->toArray();

        foreach ($writingAnswers as $index => $answer) {
            if (! in_array((string) $answer['task_id'], $validTaskIds, true)) {
                $validator->errors()->add(
                    "writing_answers.{$index}.task_id",
                    'Task does not belong to this exam.'
                );
            }
        }
    }

    /**
     * @param  Validator  $validator
     * @param  list<array<string,mixed>>  $speakingAnswers
     */
    private function validatePartIds($validator, ExamVersion $version, array $speakingAnswers): void
    {
        $validPartIds = $version->speakingParts()->pluck('id')->map(fn ($id) => (string) $id)->toArray();

        foreach ($speakingAnswers as $index => $answer) {
            if (! in_array((string) $answer['part_id'], $validPartIds, true)) {
                $validator->errors()->add(
                    "speaking_answers.{$index}.part_id",
                    'Part does not belong to this exam.'
                );
            }
        }
    }
}
