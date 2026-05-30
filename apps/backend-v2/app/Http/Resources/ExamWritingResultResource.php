<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExamWritingSubmission;
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
                'feedback' => $result->feedback,
                'calculation_trace' => $result->calculation_trace,
            ] : null,
        ];
    }
}
