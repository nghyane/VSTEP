<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\FeedbackCompleted;
use App\Models\PracticeWritingSubmission;
use App\Models\WritingGradingResult;
use App\Services\WritingFeedbackService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

final class FeedbackJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(
        public readonly string $submissionId,
    ) {}

    public function handle(WritingFeedbackService $service): void
    {
        $submission = PracticeWritingSubmission::query()->with('prompt')->find($this->submissionId);
        if ($submission === null) {
            return;
        }

        $result = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
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
