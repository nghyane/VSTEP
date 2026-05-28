<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\FeedbackJob;
use App\Models\PracticeWritingSubmission;
use App\Models\WritingGradingResult;
use Illuminate\Http\JsonResponse;

/**
 * On-demand AI feedback — costs 1 coin, SSE streamed when ready.
 */
final class WritingFeedbackController extends Controller
{
    public function generate(PracticeWritingSubmission $submission): JsonResponse
    {
        $result = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
            ->where('submission_id', $submission->id)
            ->where('is_active', true)
            ->first();

        if ($result === null) {
            return response()->json(['message' => 'Submission not graded yet.'], 422);
        }

        FeedbackJob::dispatch($submission->id);

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
