<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExamWritingSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamWritingResultResource extends JsonResource
{
    /** @var ExamWritingSubmission */
    public $resource;

    public function toArray(Request $request): array
    {
        $submission = $this->resource;
        $job = $submission->gradingJob;
        $result = $submission->gradingResults()
            ->where('is_active', true)
            ->first();

        return [
            'submission_id' => $submission->id,
            'task_id' => $submission->task_id,
            'text' => $submission->text,
            'word_count' => $submission->word_count,
            'grading_status' => $job?->status ?? 'failed',
            'result' => $result !== null ? [
                'rubric_scores' => $result->rubric_scores,
                'overall_band' => $result->overall_band,
                'strengths' => $result->strengths,
                'improvements' => $result->improvements,
                'rewrites' => $result->rewrites,
                'annotations' => $result->annotations,
            ] : null,
        ];
    }
}
