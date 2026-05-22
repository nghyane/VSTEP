<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Services\ExamScoringService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ExamSessionListResource extends JsonResource
{
    public function __construct(
        mixed $resource,
        private readonly ?ExamScoringService $scoringService = null,
    ) {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_id' => $this->examVersion?->exam_id,
            'exam_version_id' => $this->exam_version_id,
            'mode' => $this->mode,
            'selected_skills' => $this->selected_skills,
            'is_full_test' => $this->is_full_test,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'server_deadline_at' => $this->server_deadline_at,
            'scores' => $this->status->isTerminal() && $this->scoringService !== null
                ? $this->scoringService->getSessionScores($this->resource)
                : null,
        ];
    }
}
