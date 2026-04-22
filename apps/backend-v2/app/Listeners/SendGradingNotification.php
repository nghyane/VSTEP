<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\GradingCompleted;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Services\NotificationService;

/**
 * Gửi notification cho user khi grading hoàn thành.
 */
final class SendGradingNotification
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function handle(GradingCompleted $event): void
    {
        $job = $event->job;
        $profile = $this->resolveProfile($job);
        if ($profile === null) {
            return;
        }

        $dedupKey = "grading_completed:{$job->submission_type}:{$job->submission_id}";

        match ($job->submission_type) {
            'practice_writing' => $this->notificationService->push(
                $profile,
                type: 'grading_completed',
                title: 'Bài viết đã chấm xong',
                body: 'Kết quả chấm bài viết của bạn đã sẵn sàng.',
                iconKey: 'check',
                dedupKey: $dedupKey,
            ),
            'practice_speaking' => $this->notificationService->push(
                $profile,
                type: 'grading_completed',
                title: 'Bài nói đã chấm xong',
                body: 'Kết quả chấm bài nói của bạn đã sẵn sàng.',
                iconKey: 'mic',
                dedupKey: $dedupKey,
            ),
            'exam_writing', 'exam_speaking' => $this->notificationService->push(
                $profile,
                type: 'grading_completed',
                title: 'Bài thi đã chấm xong',
                body: 'Kết quả chấm bài thi của bạn đã sẵn sàng.',
                iconKey: 'award',
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
