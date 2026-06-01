<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Http\Controllers\Controller;
use App\Models\AssessmentJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AssessmentJobController extends Controller
{
    public function show(Request $request, AssessmentJob $assessmentJob): JsonResponse
    {
        $assessmentJob->loadMissing('attempt.result');

        if ($assessmentJob->attempt->profile_id !== $request->profile()->id) {
            abort(403);
        }

        $data = [
            'attempt_id' => $assessmentJob->attempt_id,
            'status' => $assessmentJob->status->value,
            'progress' => $assessmentJob->progress ?? [],
        ];

        if ($assessmentJob->status === AssessmentJobStatus::Ready && $assessmentJob->attempt->result !== null) {
            $data['scores'] = [
                'overall_band' => $assessmentJob->attempt->result->overall_band,
                'criterion_scores' => $assessmentJob->attempt->result->criterion_scores,
                'caps_applied' => $assessmentJob->attempt->result->caps_applied,
                'feedback' => $assessmentJob->attempt->result->feedback,
            ];
        }

        if ($assessmentJob->status === AssessmentJobStatus::Failed) {
            $data['error'] = $assessmentJob->last_error ?? 'Assessment failed';
        }

        return response()->json(['data' => $data]);
    }
}
