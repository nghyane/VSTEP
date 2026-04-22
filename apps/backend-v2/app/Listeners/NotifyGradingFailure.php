<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\GradingFailed;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Services\NotificationService;

/**
 * Push notification khi grading job thất bại.
 */
final class NotifyGradingFailure
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function handle(GradingFailed $event): void
    {
        $job = $event->job;
        $profile = $this->resolveProfile($job);
        if ($profile === null) {
            return;
        }

        $dedupKey = "grading_failed:{$job->submission_type}:{$job->submission_id}";

        match ($job->submission_type) {
            'practice_writing', 'practice_speaking' => $this->notificationService->push(
                $profile,
                type: 'grading_failed',
                title: 'Chấm bài thất bại',
                body: 'Không thể chấm bài của bạn. Vui lòng thử lại sau.',
                iconKey: 'alert',
                dedupKey: $dedupKey,
            ),
            'exam_writing', 'exam_speaking' => $this->notificationService->push(
                $profile,
                type: 'grading_failed',
                title: 'Chấm bài thi thất bại',
                body: 'Không thể chấm bài thi của bạn. Vui lòng liên hệ hỗ trợ.',
                iconKey: 'alert',
                dedupKey: $dedupKey,
            ),
            default => null,
        };
    }

    private function resolveProfile(GradingJob $job): ?Profile
    {
        $model = match ($job->submission_type) {
            'practice_writing' => PracticeWritingSubmission::class,
            'practice_speaking' => PracticeSpeakingSubmission::class,
            'exam_writing' => ExamWritingSubmission::class,
            'exam_speaking' => ExamSpeakingSubmission::class,
            default => null,
        };

        if ($model === null) {
            return null;
        }

        $profileId = $model::query()
            ->where('id', $job->submission_id)
            ->value('profile_id');

        return $profileId !== null ? Profile::query()->find($profileId) : null;
    }
}
