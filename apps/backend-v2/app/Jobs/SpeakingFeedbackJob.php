<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\PracticeFeedbackStatus;
use App\Events\FeedbackCompleted;
use App\Models\PracticeFeedbackRequest;
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
        public readonly string $feedbackRequestId,
    ) {}

    public function handle(SpeakingFeedbackService $service): void
    {
        $request = PracticeFeedbackRequest::query()->find($this->feedbackRequestId)
            ?? throw new \RuntimeException('Practice feedback request not found.');

        $submission = PracticeSpeakingSubmission::query()->with('speakingTask')->find($request->submission_id);
        if ($submission === null) {
            $this->failRequest($request, 'Practice speaking submission not found.');
        }

        $result = SpeakingGradingResult::query()
            ->where('submission_type', 'practice_speaking')
            ->where('submission_id', $request->submission_id)
            ->where('is_active', true)
            ->first();

        if ($result === null) {
            $this->failRequest($request, 'Practice speaking grading result not found.');
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
