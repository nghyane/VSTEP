<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'exam' => new ExamSummaryResource($this->whenLoaded('exam')),
            'questions' => SessionQuestionResource::collection($this->whenLoaded('questions')),
            'answers' => ExamAnswerResource::collection($this->whenLoaded('answers')),
        ];
    }
}
