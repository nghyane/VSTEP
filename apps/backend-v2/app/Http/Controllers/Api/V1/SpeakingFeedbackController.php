<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SpeakingFeedbackJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\SpeakingGradingResult;
use Illuminate\Http\JsonResponse;

/**
 * On-demand AI feedback for speaking — costs 1 coin, SSE streamed when ready.
 */
final class SpeakingFeedbackController extends Controller
{
    public function generate(PracticeSpeakingSubmission $submission): JsonResponse
    {
        $result = SpeakingGradingResult::query()
            ->where('submission_type', 'practice_speaking')
            ->where('submission_id', $submission->id)
            ->where('is_active', true)
            ->first();

        if ($result === null) {
            return response()->json(['message' => 'Submission not graded yet.'], 422);
        }

        SpeakingFeedbackJob::dispatch($submission->id);

        return response()->json([
            'data' => [
                'submission_id' => $submission->id,
                'status' => 'processing',
                'channel' => "feedback.{$submission->id}",
                'event' => 'feedback.completed',
            ],
        ], 202);
    }
}
