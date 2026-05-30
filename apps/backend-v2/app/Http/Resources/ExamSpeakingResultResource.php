<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExamSpeakingSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ExamSpeakingResultResource extends JsonResource
{
    /** @var ExamSpeakingSubmission */
    public $resource;

    public function toArray(Request $request): array
    {
        $submission = $this->resource;
        $attempt = $submission->assessmentAttempt;
        $result = $attempt?->result;

        return [
            'submission_id' => $submission->id,
            'part_id' => $submission->part_id,
            'audio_url' => $submission->audio_url,
            'duration_seconds' => $submission->duration_seconds,
            'transcript' => $submission->transcript,
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
