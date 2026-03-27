<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'level' => $this->level,
            'type' => $this->type,
            'duration_minutes' => $this->duration_minutes,
            'sections' => collect($this->blueprint ?? [])
                ->filter(fn (mixed $section) => is_array($section) && array_key_exists('question_ids', $section))
                ->values()
                ->map(function (array $section, int $index): array {
                    $questionIds = $section['question_ids'] ?? [];

                    return [
                        'skill' => $section['skill'] ?? null,
                        'part' => $section['part'] ?? $index + 1,
                        'title' => $section['title'] ?? null,
                        'instructions' => $section['instructions'] ?? null,
                        'question_count' => count($questionIds),
                        'question_ids' => $questionIds,
                        'order' => $section['order'] ?? $index + 1,
                    ];
                })
                ->all(),
        ];
    }
}
