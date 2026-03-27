<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSessionDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'session' => [
                ...parent::toArray($request),
                'exam' => null,
                'questions' => null,
                'answers' => null,
                'submissions' => null,
            ],
            'exam' => new ExamSummaryResource($this->whenLoaded('exam')),
            'questions' => SessionQuestionResource::collection($this->whenLoaded('questions')),
            'answers' => ExamAnswerResource::collection($this->whenLoaded('answers')),
            'submissions' => SubmissionResource::collection($this->whenLoaded('submissions')),
            'progress' => [
                'answered' => $this->whenLoaded('answers', fn () => $this->answers->count()),
                'total' => $this->whenLoaded('questions', fn () => $this->questions->count()),
            ],
        ];
    }
}
