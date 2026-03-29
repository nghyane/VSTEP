<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $allQuestionIds = collect($this->blueprint ?? [])
            ->filter(fn (mixed $section) => is_array($section) && array_key_exists('question_ids', $section))
            ->flatMap(fn (array $section) => $section['question_ids'] ?? [])
            ->all();

        $itemCounts = ! empty($allQuestionIds)
            ? Question::whereIn('id', $allQuestionIds)
                ->get(['id', 'content'])
                ->mapWithKeys(fn (Question $q) => [
                    $q->id => count($q->content['items'] ?? []),
                ])
            : collect();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'level' => $this->level,
            'type' => $this->type,
            'duration_minutes' => $this->duration_minutes,
            'sections' => collect($this->blueprint ?? [])
                ->filter(fn (mixed $section) => is_array($section) && array_key_exists('question_ids', $section))
                ->values()
                ->map(function (array $section, int $index) use ($itemCounts): array {
                    $questionIds = $section['question_ids'] ?? [];

                    $itemCount = collect($questionIds)
                        ->sum(fn (string $id) => $itemCounts->get($id, 0));

                    return [
                        'skill' => $section['skill'] ?? null,
                        'part' => $section['part'] ?? $index + 1,
                        'title' => $section['title'] ?? null,
                        'instructions' => $section['instructions'] ?? null,
                        'question_count' => $itemCount ?: count($questionIds),
                        'question_ids' => $questionIds,
                        'order' => $section['order'] ?? $index + 1,
                    ];
                })
                ->all(),
        ];
    }
}
