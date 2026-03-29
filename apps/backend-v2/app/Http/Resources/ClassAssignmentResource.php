<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'submission_count' => $this->whenCounted('submissions'),
            'graded_count' => $this->when(isset($this->graded_count), $this->graded_count ?? 0),
            'submitted_count' => $this->when(isset($this->submitted_count), $this->submitted_count ?? 0),
            'pending_count' => $this->when(isset($this->pending_count), $this->pending_count ?? 0),
            'submissions' => ClassAssignmentSubmissionResource::collection($this->whenLoaded('submissions')),
        ];
    }
}
