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
    public function generate(string $submissionId): JsonResponse
    {
        $submission = PracticeWritingSubmission::query()->find($submissionId);
        if ($submission === null) {
            return response()->json(['message' => 'Submission not found.'], 404);
        }

        $result = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
            ->first();

        if ($result === null) {
            return response()->json(['message' => 'Submission not graded yet.'], 422);
        }

        FeedbackJob::dispatch($submissionId);

        return response()->json([
            'data' => [
                'submission_id' => $submissionId,
                'status' => 'processing',
                'channel' => "feedback.{$submissionId}",
                'event' => 'feedback.completed',
            ],
        ], 202);
    }
}
