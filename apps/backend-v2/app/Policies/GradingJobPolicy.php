<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\User;

final class GradingJobPolicy
{
    /**
     * User can view a grading job only if the underlying submission
     * belongs to their active profile.
     */
    public function view(User $user, GradingJob $job): bool
    {
        if ($user->active_profile_id === null) {
            return false;
        }

        $profileId = $this->resolveSubmissionProfile($job);

        return $profileId !== null && $profileId === $user->active_profile_id;
    }

    private function resolveSubmissionProfile(GradingJob $job): ?string
    {
        return match ($job->submission_type) {
            'practice_writing' => PracticeWritingSubmission::query()
                ->whereKey($job->submission_id)
                ->value('profile_id'),
            'practice_speaking' => PracticeSpeakingSubmission::query()
                ->whereKey($job->submission_id)
                ->value('profile_id'),
            'exam_writing' => ExamWritingSubmission::query()
                ->whereKey($job->submission_id)
                ->value('profile_id'),
            'exam_speaking' => ExamSpeakingSubmission::query()
                ->whereKey($job->submission_id)
                ->value('profile_id'),
            default => null,
        };
    }
}
