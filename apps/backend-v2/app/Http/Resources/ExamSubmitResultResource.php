<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSubmitResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'session_id' => $this->resource->session->id,
            'status' => $this->resource->session->status,
            'submitted_at' => $this->resource->session->submitted_at,
            'mcq' => [
                'score' => $this->resource->mcqScore,
                'total' => $this->resource->mcqTotal,
                'items' => $this->resource->mcqPerItemResults,
            ],
            'writing_jobs' => $this->resource->writingJobs,
            'speaking_jobs' => $this->resource->speakingJobs,
        ];
    }
}
