<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Models\GradingJob;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class GradingJobController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $id = $request->route('grading_job');
        $job = GradingJob::query()->find($id);

        if ($job === null) {
            return response()->json(['message' => 'Grading job not found.'], 404);
        }

        // getRawOriginal bypasses enum casting — reliable under Octane
        $status = $job->getRawOriginal('status', GradingJobStatus::Pending->value);

        $data = [
            'status' => $status,
            'progress' => $job->progress ?? [],
        ];

        if ($status === GradingJobStatus::Ready->value) {
            $result = $this->loadResult($job);
            if ($result !== null) {
                $data['scores'] = $result;
            }
            $data['feedback_ready'] = $this->isFeedbackReady($job);
        }

        if ($status === GradingJobStatus::Failed->value) {
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
