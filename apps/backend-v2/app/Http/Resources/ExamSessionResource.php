<?php

namespace App\Http\Resources;

use App\Enums\SessionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'exam_id' => $this->exam_id,
            'status' => $this->status,
            'listening_score' => $this->listening_score,
            'reading_score' => $this->reading_score,
            'writing_score' => $this->writing_score,
            'speaking_score' => $this->speaking_score,
            'overall_score' => $this->overall_score,
            'overall_band' => $this->overall_band,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'exam' => $this->whenLoaded('exam', fn () => [
                'title' => $this->exam->title,
                'level' => $this->exam->level,
                'type' => $this->exam->type,
            ]),
            'questions' => $this->whenLoaded('answers', fn () => $this->buildQuestions()),
            'answers' => $this->whenLoaded('answers', fn () => $this->buildAnswers()),
        ];
    }

    private function buildQuestions(): array
    {
        return $this->answers
            ->filter(fn ($a) => $a->relationLoaded('question') && $a->question)
            ->map(fn ($a) => array_filter([
                'id' => $a->question->id,
                'skill' => $a->question->skill,
                'part' => $a->question->part,
                'content' => $a->question->content,
                'answer_key' => $this->status !== SessionStatus::InProgress ? $a->question->answer_key : null,
            ], fn ($v) => $v !== null))->unique('id')->values()->all();
    }

    private function buildAnswers(): array
    {
        return $this->answers->map(fn ($a) => [
            'question_id' => $a->question_id,
            'answer' => $a->answer,
            'is_correct' => $a->is_correct,
        ])->all();
    }
}
