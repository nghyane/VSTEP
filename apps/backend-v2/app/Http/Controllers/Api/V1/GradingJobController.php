<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Models\GradingJob;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class GradingJobController extends Controller
{
    public function show(GradingJob $job): JsonResponse
    {
        // Octane reuses model instances — attributes may be stale.
        // Read status + progress directly from DB to guarantee freshness.
        $row = DB::table('grading_jobs')->where('id', $job->id)->first();

        $status = $row->status ?? GradingJobStatus::Pending->value;
        $progress = $row->progress ? json_decode($row->progress, true) : [];

        $data = [
            'status' => $status,
            'progress' => $progress,
        ];

        if ($status === GradingJobStatus::Ready->value) {
            $result = $this->loadResult($job);
            if ($result !== null) {
                $data['scores'] = $result;
            }
            $data['feedback_ready'] = $this->isFeedbackReady($job);
        }

        if ($status === GradingJobStatus::Failed->value) {
            $data['error'] = $row->last_error ?? 'Grading failed';
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
