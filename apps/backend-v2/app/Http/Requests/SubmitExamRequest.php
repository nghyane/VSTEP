<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\ExamSession;
use App\Models\ExamVersion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

final class SubmitExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('exam_session');

        return $session instanceof ExamSession && Gate::allows('update', $session);
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
            'writing_answers.*.text' => ['present', 'nullable', 'string'],
            'writing_answers.*.word_count' => ['present', 'integer', 'min:0'],
            'speaking_answers' => ['nullable', 'array'],
            'speaking_answers.*.part_id' => ['required_with:speaking_answers', 'uuid'],
            'speaking_answers.*.audio_key' => ['required_with:speaking_answers', 'string', 'max:500'],
            'speaking_answers.*.duration_seconds' => ['required_with:speaking_answers', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        /** @var ExamSession|null $session */
        $session = $this->route('exam_session');

        if (! $session instanceof ExamSession) {
            return [
                fn (Validator $validator) => $validator->errors()->add('session', 'Session not found.'),
            ];
        }

        return [
            function ($validator) use ($session) {
                $version = $session->examVersion;
                if ($version === null) {
                    $validator->errors()->add('session', 'Exam version not found.');

                    return;
                }

                $writingAnswers = $this->input('writing_answers');
                $speakingAnswers = $this->input('speaking_answers');

                $this->validateTaskIds($validator, $version, is_array($writingAnswers) ? $writingAnswers : []);
                $this->validatePartIds($validator, $version, is_array($speakingAnswers) ? $speakingAnswers : []);
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
            if (! is_array($answer) || ! array_key_exists('task_id', $answer)) {
                continue;
            }
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
            if (! is_array($answer) || ! array_key_exists('part_id', $answer)) {
                continue;
            }
            if (! in_array((string) $answer['part_id'], $validPartIds, true)) {
                $validator->errors()->add(
                    "speaking_answers.{$index}.part_id",
                    'Part does not belong to this exam.'
                );
            }
        }
    }
}
