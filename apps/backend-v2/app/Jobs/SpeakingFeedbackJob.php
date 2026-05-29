<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\FeedbackCompleted;
use App\Models\PracticeSpeakingSubmission;
use App\Models\SpeakingGradingResult;
use App\Services\SpeakingFeedbackService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

final class SpeakingFeedbackJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(
        public readonly string $submissionId,
    ) {}

    public function handle(SpeakingFeedbackService $service): void
    {
        $submission = PracticeSpeakingSubmission::query()->with('speakingTask')->find($this->submissionId);
        if ($submission === null) {
            return;
        }

        $result = SpeakingGradingResult::query()
            ->where('submission_type', 'practice_speaking')
            ->where('submission_id', $this->submissionId)
            ->where('is_active', true)
            ->first();

        if ($result === null) {
            return;
        }

        $feedback = $service->generateForSubmission($submission, $result);
        $result->update(['improvements' => $feedback['improvements']]);

        FeedbackCompleted::dispatch($this->submissionId, $feedback);
    }
}
