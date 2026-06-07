<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Enums\PracticeFeedbackSubmissionType;
use App\Models\AssessmentAttempt;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\PracticeFeedbackRequest;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\TeacherGradingRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

final class AssessmentViewService
{
    public function __construct(
        private readonly EconomyConfigService $economyConfig,
        private readonly PracticeFeedbackService $feedbackService,
        private readonly AssessmentResultDisplayService $displayService,
        private readonly AssessmentDiagnosticsService $diagnosticsService,
    ) {}

    /** @return array<string,mixed> */
    public function show(Profile $profile, AssessmentAttempt $attempt): array
    {
        $this->authorize($profile, $attempt);
        $attempt->loadMissing(['rubric', 'result', 'job']);

        $source = $this->source($attempt);
        $feedback = $this->feedbackState($attempt);

        return [
            'attempt_id' => $attempt->id,
            'source' => [
                'type' => $this->sourceType($attempt),
                'submission_id' => $attempt->source_id,
                'session_id' => $source instanceof Model ? $source->getAttribute('session_id') : null,
            ],
            'status' => $attempt->job?->status?->value ?? 'pending',
            'progress' => $attempt->job?->progress ?? [],
            'error' => $attempt->job?->last_error,
            'context' => $this->context($attempt, $source),
            'rubric' => [
                'id' => $attempt->rubric->id,
                'title' => $attempt->rubric->title,
                'task_type' => $attempt->rubric->task_type->value,
                'max_score' => 10,
                'criteria' => $this->criteria($attempt),
            ],
            'result' => $attempt->result === null ? null : [
                'overall_band' => $attempt->result->overall_band,
                'criterion_scores' => $attempt->result->criterion_scores,
                'caps_applied' => $attempt->result->caps_applied,
                'source' => 'ai',
                'display' => $this->displayService->forResult($attempt->result),
                'diagnostics' => $this->diagnosticsService->forAttempt($attempt),
                'calculation_trace' => $attempt->result->calculation_trace,
                'feedback' => $attempt->result->feedback,
            ],
            'feedback_request' => $feedback,
            'teacher_grading_request' => $this->teacherGradingRequestState($attempt),
        ];
    }

    /** @return array<string,mixed> */
    public function requestFeedback(Profile $profile, AssessmentAttempt $attempt): array
    {
        $this->authorize($profile, $attempt);

        if ($attempt->source_type !== AssessmentSourceType::Practice) {
            throw ValidationException::withMessages([
                'assessment' => ['Feedback requests are only supported for practice submissions.'],
            ]);
        }

        $source = $this->source($attempt);

        if ($source instanceof PracticeWritingSubmission) {
            return $this->feedbackService->requestWriting($profile, $source);
        }

        if ($source instanceof PracticeSpeakingSubmission) {
            return $this->feedbackService->requestSpeaking($profile, $source);
        }

        throw ValidationException::withMessages([
            'assessment' => ['Feedback requests are only supported for practice submissions.'],
        ]);
    }

    private function authorize(Profile $profile, AssessmentAttempt $attempt): void
    {
        if ($attempt->profile_id !== $profile->id) {
            abort(403);
        }
    }

    private function sourceType(AssessmentAttempt $attempt): string
    {
        return $attempt->source_type->value.'_'.$attempt->skill->value;
    }

    private function source(AssessmentAttempt $attempt): Model
    {
        return match ([$attempt->source_type, $attempt->skill]) {
            [AssessmentSourceType::Practice, AssessmentSkill::Writing] => PracticeWritingSubmission::query()
                ->with('prompt')
                ->findOrFail($attempt->source_id),
            [AssessmentSourceType::Practice, AssessmentSkill::Speaking] => PracticeSpeakingSubmission::query()
                ->with('speakingTask')
                ->findOrFail($attempt->source_id),
            [AssessmentSourceType::Exam, AssessmentSkill::Writing] => ExamWritingSubmission::query()
                ->with('task')
                ->findOrFail($attempt->source_id),
            [AssessmentSourceType::Exam, AssessmentSkill::Speaking] => ExamSpeakingSubmission::query()
                ->with('part')
                ->findOrFail($attempt->source_id),
        };
    }

    /** @return array<string,mixed> */
    private function context(AssessmentAttempt $attempt, Model $source): array
    {
        return match ([$attempt->source_type, $attempt->skill]) {
            [AssessmentSourceType::Practice, AssessmentSkill::Writing] => $this->writingContext(
                $attempt,
                $source,
                $source->prompt?->title,
                $source->prompt?->prompt,
                $source->prompt?->part,
            ),
            [AssessmentSourceType::Exam, AssessmentSkill::Writing] => $this->writingContext(
                $attempt,
                $source,
                'Writing Task '.$source->task?->part,
                $source->task?->prompt,
                $source->task?->part,
            ),
            [AssessmentSourceType::Practice, AssessmentSkill::Speaking] => $this->speakingContext(
                $attempt,
                $source,
                $source->speakingTask?->title,
                $source->speakingTask?->content,
                $source->speakingTask?->part,
            ),
            [AssessmentSourceType::Exam, AssessmentSkill::Speaking] => $this->speakingContext(
                $attempt,
                $source,
                'Speaking Part '.$source->part?->part,
                $source->part?->content,
                $source->part?->part,
            ),
        };
    }

    /** @return array<string,mixed> */
    private function writingContext(
        AssessmentAttempt $attempt,
        Model $source,
        ?string $title,
        ?string $prompt,
        ?int $part,
    ): array {
        return [
            'skill' => $attempt->skill->value,
            'task_type' => $attempt->task_type->value,
            'part' => $part,
            'title' => $title,
            'prompt' => $prompt,
            'response_text' => $source->getAttribute('text'),
            'word_count' => $source->getAttribute('word_count'),
            'submitted_at' => $source->getAttribute('submitted_at'),
        ];
    }

    /** @return array<string,mixed> */
    private function speakingContext(
        AssessmentAttempt $attempt,
        Model $source,
        ?string $title,
        mixed $prompt,
        ?int $part,
    ): array {
        return [
            'skill' => $attempt->skill->value,
            'task_type' => $attempt->task_type->value,
            'part' => $part,
            'title' => $title,
            'prompt' => $prompt,
            'audio_url' => $source->getAttribute('audio_url'),
            'transcript' => $source->getAttribute('transcript'),
            'duration_seconds' => $source->getAttribute('duration_seconds'),
            'submitted_at' => $source->getAttribute('submitted_at'),
        ];
    }

    /** @return list<array<string,mixed>> */
    private function criteria(AssessmentAttempt $attempt): array
    {
        return collect($attempt->rubric->criteria)
            ->map(fn (array $criterion): array => [
                ...$criterion,
                'max' => $criterion['max'] ?? 10,
            ])
            ->values()
            ->all();
    }

    /** @return array<string,mixed> */
    private function feedbackState(AssessmentAttempt $attempt): array
    {
        $canRequest = $attempt->source_type === AssessmentSourceType::Practice
            && $attempt->result !== null;
        $request = $this->practiceFeedbackRequest($attempt);

        return [
            'can_request' => $canRequest,
            'requested' => $request !== null,
            'cost_coins' => $canRequest ? $this->economyConfig->practiceFeedbackCost() : 0,
            'status' => $request?->status?->value ?? 'none',
        ];
    }

    private function practiceFeedbackRequest(AssessmentAttempt $attempt): ?PracticeFeedbackRequest
    {
        if ($attempt->source_type !== AssessmentSourceType::Practice) {
            return null;
        }

        $submissionType = PracticeFeedbackSubmissionType::fromSkill($attempt->skill);

        return PracticeFeedbackRequest::query()
            ->where('submission_type', $submissionType->value)
            ->where('submission_id', $attempt->source_id)
            ->first();
    }

    /** @return array<string,mixed> */
    private function teacherGradingRequestState(AssessmentAttempt $attempt): array
    {
        $canRequest = $attempt->result !== null;
        $request = TeacherGradingRequest::query()
            ->with(['assignedTeacher:id,full_name,email', 'teacherResult'])
            ->where('attempt_id', $attempt->id)
            ->first();

        return [
            'can_request' => $canRequest,
            'requested' => $request !== null,
            'cost_coins' => $canRequest ? $this->economyConfig->teacherGradingRequestCost() : 0,
            'request_id' => $request?->id,
            'status' => $request?->status?->value ?? 'none',
            'assigned_teacher' => $request?->assignedTeacher === null ? null : [
                'id' => $request->assignedTeacher->id,
                'full_name' => $request->assignedTeacher->full_name,
                'email' => $request->assignedTeacher->email,
            ],
            'requested_at' => $request?->requested_at,
            'assigned_at' => $request?->assigned_at,
            'completed_at' => $request?->completed_at,
            'teacher_result' => $request?->teacherResult === null ? null : [
                'id' => $request->teacherResult->id,
                'overall_band' => $request->teacherResult->overall_band,
                'criterion_scores' => $request->teacherResult->criterion_scores,
                'feedback' => $request->teacherResult->feedback,
                'submitted_at' => $request->teacherResult->submitted_at,
                'source' => 'teacher',
            ],
        ];
    }
}
