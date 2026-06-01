<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentSourceType;
use App\Models\AssessmentAttempt;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;

final class PracticeGradingResultService
{
    /** @return array{data: array<string,mixed>|null, rubric: array<string,mixed>|null} */
    public function writing(Profile $profile, PracticeWritingSubmission $submission): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        return $this->payload($submission->id);
    }

    /** @return array{data: array<string,mixed>|null, rubric: array<string,mixed>|null} */
    public function speaking(Profile $profile, PracticeSpeakingSubmission $submission): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        return $this->payload($submission->id);
    }

    /** @return array{data: array<string,mixed>|null, rubric: array<string,mixed>|null} */
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

        return [
            'attempt_id' => $attempt->id,
            'data' => $attempt->result === null ? null : [
                'overall_band' => $attempt->result->overall_band,
                'criterion_scores' => $attempt->result->criterion_scores,
                'caps_applied' => $attempt->result->caps_applied,
                'calculation_trace' => $attempt->result->calculation_trace,
                'feedback' => $attempt->result->feedback,
            ],
            'rubric' => [
                'id' => $attempt->rubric->id,
                'title' => $attempt->rubric->title,
                'task_type' => $attempt->rubric->task_type->value,
                'criteria' => $attempt->rubric->criteria,
            ],
        ];
    }
}
