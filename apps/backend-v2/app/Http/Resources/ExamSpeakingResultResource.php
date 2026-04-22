<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExamSpeakingSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSpeakingResultResource extends JsonResource
{
    /** @var ExamSpeakingSubmission */
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
            'part_id' => $submission->part_id,
            'audio_url' => $submission->audio_url,
            'duration_seconds' => $submission->duration_seconds,
            'transcript' => $submission->transcript,
            'grading_status' => $job?->status ?? 'failed',
            'result' => $result !== null ? [
                'rubric_scores' => $result->rubric_scores,
                'overall_band' => $result->overall_band,
                'strengths' => $result->strengths,
                'improvements' => $result->improvements,
                'pronunciation_report' => $result->pronunciation_report,
            ] : null,
        ];
    }
}
