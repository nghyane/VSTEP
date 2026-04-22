<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PracticeSpeakingSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeSpeakingSubmission $resource
 */
class SpeakingSubmissionHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'submitted_at' => $this->resource->submitted_at,
            'duration_seconds' => $this->resource->duration_seconds,
            'task_ref_id' => $this->resource->task_ref_id,
        ];
    }
}
