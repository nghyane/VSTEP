<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentSourceType;
use App\Models\AssessmentAttempt;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\TeacherGradingRequest;

final class PracticeGradingResultService
{
    public function __construct(
        private readonly AssessmentDiagnosticsService $diagnosticsService,
    ) {}

    /** @return array{attempt_id?: string, data: array<string,mixed>|null, rubric: array<string,mixed>|null, teacher_grading_request?: array<string,mixed>} */
    public function writing(Profile $profile, PracticeWritingSubmission $submission): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        return $this->payload($submission->id);
    }

    /** @return array{attempt_id?: string, data: array<string,mixed>|null, rubric: array<string,mixed>|null, teacher_grading_request?: array<string,mixed>} */
    public function speaking(Profile $profile, PracticeSpeakingSubmission $submission): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        return $this->payload($submission->id);
    }

    /** @return array{attempt_id?: string, data: array<string,mixed>|null, rubric: array<string,mixed>|null, teacher_grading_request?: array<string,mixed>} */
    private function payload(string $submissionId): array
    {
        $attempt = AssessmentAttempt::query()
            ->with(['result', 'rubric'])
            ->where('source_type', AssessmentSourceType::Practice)
            ->where('source_id', $submissionId)
            ->latest('submitted_at')
            ->first();

        if ($attempt === null) {
            return ['data' => null, 'rubric' => null];
        }

        $teacherGradingRequest = TeacherGradingRequest::query()
            ->with(['assignedTeacher:id,full_name,email', 'teacherResult'])
            ->where('attempt_id', $attempt->id)
            ->first();

        return [
            'attempt_id' => $attempt->id,
            'data' => $attempt->result === null ? null : [
                'overall_band' => $attempt->result->overall_band,
                'criterion_scores' => $attempt->result->criterion_scores,
                'caps_applied' => $attempt->result->caps_applied,
                'source' => 'ai',
                'diagnostics' => $this->diagnosticsService->forAttempt($attempt),
                'calculation_trace' => $attempt->result->calculation_trace,
                'feedback' => $attempt->result->feedback,
            ],
            'rubric' => [
                'id' => $attempt->rubric->id,
                'title' => $attempt->rubric->title,
                'task_type' => $attempt->rubric->task_type->value,
                'max_score' => $this->maxScore($attempt->rubric->scoring_policy),
                'criteria' => $attempt->rubric->criteria,
            ],
            'teacher_grading_request' => $this->teacherGradingRequestState($teacherGradingRequest),
        ];
    }

    /** @return array<string,mixed> */
    private function teacherGradingRequestState(?TeacherGradingRequest $request): array
    {
        return [
            'can_request' => true,
            'requested' => $request !== null,
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

    /** @param array<string,mixed>|null $policy */
    private function maxScore(?array $policy): int
    {
        return match ((string) ($policy['scale'] ?? '')) {
            'vstep_0_10' => 10,
            default => throw new \RuntimeException('Assessment rubric scoring scale is not supported.'),
        };
    }
}
