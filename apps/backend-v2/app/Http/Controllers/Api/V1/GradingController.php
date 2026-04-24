<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GradingJob;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Http\JsonResponse;

class GradingController extends Controller
{
    public function showJob(string $id): JsonResponse
    {
        /** @var GradingJob $job */
        $job = GradingJob::query()->findOrFail($id);

        return response()->json(['data' => [
            'id' => $job->id,
            'submission_type' => $job->submission_type,
            'submission_id' => $job->submission_id,
            'status' => $job->status,
            'attempts' => $job->attempts,
            'last_error' => $job->last_error,
            'started_at' => $job->started_at,
            'completed_at' => $job->completed_at,
        ]]);
    }

    public function jobStatus(string $id): JsonResponse
    {
        /** @var GradingJob $job */
        $job = GradingJob::query()->findOrFail($id);

        // If job is completed, include the active result
        $result = null;
        if ($job->status === 'completed') {
            $result = $job->submission_type === 'exam_writing'
                ? WritingGradingResult::query()
                    ->where('job_id', $job->id)
                    ->where('is_active', true)
                    ->first()
                : SpeakingGradingResult::query()
                    ->where('job_id', $job->id)
                    ->where('is_active', true)
                    ->first();
        }

        return response()->json(['data' => [
            'id' => $job->id,
            'status' => $job->status,
            'attempts' => $job->attempts,
            'result' => $result,
            'completed_at' => $job->completed_at,
        ]]);
    }

    public function writingResult(string $submissionType, string $submissionId): JsonResponse
    {
        $result = WritingGradingResult::query()
            ->where('submission_type', $submissionType)
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
            ->first();

        return response()->json(['data' => $result]);
    }

    public function speakingResult(string $submissionType, string $submissionId): JsonResponse
    {
        $result = SpeakingGradingResult::query()
            ->where('submission_type', $submissionType)
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
            ->first();

        return response()->json(['data' => $result]);
    }
}
