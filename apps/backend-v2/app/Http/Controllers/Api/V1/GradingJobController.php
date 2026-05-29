<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Models\GradingJob;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Http\JsonResponse;

final class GradingJobController extends Controller
{
    public function show(GradingJob $job): JsonResponse
    {
        // Route-bound model may be stale under Octane.
        // ::find() creates a new query instance — always hits the DB.
        $job = GradingJob::find($job->id) ?? $job;

        $data = [
            'status' => $job->status->value,
            'progress' => $job->progress ?? [],
        ];

        if ($job->status === GradingJobStatus::Ready) {
            $result = $this->loadResult($job);
            if ($result !== null) {
                $data['scores'] = $result;
            }
            $data['feedback_ready'] = $this->isFeedbackReady($job);
        }

        if ($job->status === GradingJobStatus::Failed) {
            $data['error'] = $job->last_error ?? 'Grading failed';
        }

        return response()->json(['data' => $data]);
    }

    private function loadResult(GradingJob $job): ?array
    {
        [$type, $id] = [$job->submission_type, $job->submission_id];

        if (str_contains($type, 'writing')) {
            $result = WritingGradingResult::query()
                ->where('submission_type', $type)
                ->where('submission_id', $id)
                ->where('is_active', true)
                ->first();

            if ($result !== null) {
                return [
                    'overall_band' => $result->overall_band,
                    'rubric_scores' => $result->rubric_scores,
                    'annotations' => $result->annotations,
                ];
            }
        }

        if (str_contains($type, 'speaking')) {
            $result = SpeakingGradingResult::query()
                ->where('submission_type', $type)
                ->where('submission_id', $id)
                ->where('is_active', true)
                ->first();

            if ($result !== null) {
                return [
                    'overall_band' => $result->overall_band,
                    'rubric_scores' => $result->rubric_scores,
                    'transcript' => $result->transcript,
                    'pronunciation_report' => $result->pronunciation_report,
                ];
            }
        }

        return null;
    }

    private function isFeedbackReady(GradingJob $job): bool
    {
        [$type, $id] = [$job->submission_type, $job->submission_id];

        if (str_contains($type, 'writing')) {
            $result = WritingGradingResult::query()
                ->where('submission_type', $type)
                ->where('submission_id', $id)
                ->where('is_active', true)
                ->first();

            return $result !== null && ! empty($result->strengths);
        }

        if (str_contains($type, 'speaking')) {
            $result = SpeakingGradingResult::query()
                ->where('submission_type', $type)
                ->where('submission_id', $id)
                ->where('is_active', true)
                ->first();

            return $result !== null && ! empty($result->strengths);
        }

        return false;
    }
}
