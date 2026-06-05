<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExerciseFeedback;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ExerciseFeedback */
final class AdminExerciseFeedbackResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $content = match ($this->content_type) {
            'practice_listening_exercise' => $this->listeningExercise,
            'practice_reading_exercise' => $this->readingExercise,
            default => null,
        };

        return [
            'id' => $this->id,
            'content_type' => $this->content_type,
            'content_id' => $this->content_id,
            'content_title' => $content?->title,
            'content_slug' => $content?->slug,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'profile' => $this->profile ? [
                'id' => $this->profile->id,
                'nickname' => $this->profile->nickname,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
