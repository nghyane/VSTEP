<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamVersion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read ExamVersion $resource */
final class AdminExamVersionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'exam_id' => $this->resource->exam_id,
            'version_number' => $this->resource->version_number,
            'is_active' => (bool) $this->resource->is_active,
            'published_at' => $this->resource->published_at,
            'created_at' => $this->resource->created_at,
            'listening_sections' => $this->whenLoaded(
                'listeningSections',
                fn () => $this->resource->listeningSections->map(
                    fn ($s) => [
                        'id' => $s->id,
                        'part' => $s->part,
                        'part_title' => $s->part_title,
                        'duration_minutes' => $s->duration_minutes,
                        'audio_url' => $s->audio_url,
                        'display_order' => $s->display_order,
                        'items' => $s->items->map(fn ($i) => [
                            'id' => $i->id,
                            'stem' => $i->stem,
                            'options' => $i->options,
                            'correct_index' => $i->correct_index,
                            'display_order' => $i->display_order,
                        ])->all(),
                    ]
                )->all(),
            ),
            'reading_passages' => $this->whenLoaded(
                'readingPassages',
                fn () => $this->resource->readingPassages->map(
                    fn ($p) => [
                        'id' => $p->id,
                        'part' => $p->part,
                        'title' => $p->title,
                        'duration_minutes' => $p->duration_minutes,
                        'passage' => $p->passage,
                        'display_order' => $p->display_order,
                        'items' => $p->items->map(fn ($i) => [
                            'id' => $i->id,
                            'stem' => $i->stem,
                            'options' => $i->options,
                            'correct_index' => $i->correct_index,
                            'display_order' => $i->display_order,
                        ])->all(),
                    ]
                )->all(),
            ),
            'writing_tasks' => $this->whenLoaded(
                'writingTasks',
                fn () => $this->resource->writingTasks->map(
                    fn ($t) => [
                        'id' => $t->id,
                        'part' => $t->part,
                        'task_type' => $t->task_type,
                        'duration_minutes' => $t->duration_minutes,
                        'prompt' => $t->prompt,
                        'min_words' => $t->min_words,
                        'instructions' => $t->instructions,
                        'display_order' => $t->display_order,
                    ]
                )->all(),
            ),
            'speaking_parts' => $this->whenLoaded(
                'speakingParts',
                fn () => $this->resource->speakingParts->map(
                    fn ($p) => [
                        'id' => $p->id,
                        'part' => $p->part,
                        'type' => $p->type,
                        'duration_minutes' => $p->duration_minutes,
                        'speaking_seconds' => $p->speaking_seconds,
                        'content' => $p->content,
                        'display_order' => $p->display_order,
                    ]
                )->all(),
            ),
        ];
    }
}
