<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassAssignmentSubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'full_name' => $this->whenLoaded('user', fn () => $this->user->full_name),
            'email' => $this->whenLoaded('user', fn () => $this->user->email),
            'exam_session' => $this->whenLoaded('examSession', fn () => [
                'id' => $this->examSession->id,
                'status' => $this->examSession->status,
                'overall_score' => $this->examSession->overall_score,
                'overall_band' => $this->examSession->overall_band,
                'listening_score' => $this->examSession->listening_score,
                'reading_score' => $this->examSession->reading_score,
                'writing_score' => $this->examSession->writing_score,
                'speaking_score' => $this->examSession->speaking_score,
                'completed_at' => $this->examSession->completed_at,
            ]),
        ];
    }
}
