<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\PracticeFeedbackStatus;
use App\Events\FeedbackCompleted;
use App\Models\PracticeFeedbackRequest;
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
        public readonly string $feedbackRequestId,
    ) {}

    public function handle(WritingFeedbackService $service): void
    {
        $request = PracticeFeedbackRequest::query()->find($this->feedbackRequestId)
            ?? throw new \RuntimeException('Practice feedback request not found.');

        $submission = PracticeWritingSubmission::query()->with('prompt')->find($request->submission_id);
        if ($submission === null) {
            $this->failRequest($request, 'Practice writing submission not found.');
        }

        $result = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
            ->where('submission_id', $request->submission_id)
            ->where('is_active', true)
            ->first();

        if ($result === null) {
            $this->failRequest($request, 'Practice writing grading result not found.');
        }

        $feedback = $service->generateForSubmission($submission, $result);
        $result->update(['improvements' => $feedback['improvements']]);
        $request->update([
            'status' => PracticeFeedbackStatus::Ready,
            'completed_at' => now(),
            'failed_at' => null,
            'last_error' => null,
        ]);

        FeedbackCompleted::dispatch($request->submission_id, $feedback);
    }

    private function failRequest(PracticeFeedbackRequest $request, string $message): never
    {
        $request->update([
            'status' => PracticeFeedbackStatus::Failed,
            'failed_at' => now(),
            'last_error' => $message,
        ]);

        throw new \RuntimeException($message);
    }
}
