<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Models\GradingJob;
use App\Models\PracticeFeedbackRequest;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

final class GradingJobController extends Controller
{
    public function show(GradingJob $gradingJob): JsonResponse
    {
        Gate::authorize('view', $gradingJob);

        // getRawOriginal bypasses enum casting — reliable under Octane
        $status = $gradingJob->getRawOriginal('status', GradingJobStatus::Pending->value);

        $data = [
            'status' => $status,
            'progress' => $gradingJob->progress ?? [],
        ];

        if ($status === GradingJobStatus::Ready->value) {
            $result = $this->loadResult($gradingJob);
            if ($result !== null) {
                $data['scores'] = $result;
            }
            $data['feedback_ready'] = $this->isFeedbackReady($gradingJob);
        }

        if ($status === GradingJobStatus::Failed->value) {
            $data['error'] = $gradingJob->last_error ?? 'Grading failed';
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

        return PracticeFeedbackRequest::query()
            ->where('submission_type', $type)
            ->where('submission_id', $id)
            ->where('status', 'ready')
            ->exists();
    }
}
