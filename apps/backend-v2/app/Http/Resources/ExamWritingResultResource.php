<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExamWritingSubmission;
use App\Services\AssessmentDiagnosticsService;
use App\Services\AssessmentResultDisplayService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ExamWritingResultResource extends JsonResource
{
    /** @var ExamWritingSubmission */
    public $resource;

    public function toArray(Request $request): array
    {
        $submission = $this->resource;
        $attempt = $submission->assessmentAttempt;
        $attempt?->loadMissing('evidence');
        $result = $attempt?->result;

        return [
            'submission_id' => $submission->id,
            'task_id' => $submission->task_id,
            'text' => $submission->text,
            'word_count' => $submission->word_count,
            'grading_status' => $attempt?->job?->status?->value ?? 'pending',
            'result' => $result !== null ? [
                'criterion_scores' => $result->criterion_scores,
                'overall_band' => $result->overall_band,
                'caps_applied' => $result->caps_applied,
                'display' => app(AssessmentResultDisplayService::class)->forResult($result),
                'diagnostics' => app(AssessmentDiagnosticsService::class)->forAttempt($attempt),
                'feedback' => $result->feedback,
                'calculation_trace' => $result->calculation_trace,
            ] : null,
        ];
    }
}
