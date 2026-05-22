<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DrillDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'level' => $this->level,
            'audio_url' => $this->audio_url ?? '',
            'segments' => $this->sentences->values()->map(fn ($s) => [
                'id' => $s->id,
                'index' => (int) $s->display_order,
                'text' => $s->text,
                'ipa' => $s->ipa ?? '',
                'translation' => $s->translation ?? '',
                'word_count' => $s->word_count ?? str_word_count($s->text),
                'audio_start' => $s->audio_start !== null ? (float) $s->audio_start : 0.0,
                'audio_end' => $s->audio_end !== null ? (float) $s->audio_end : 0.0,
            ]),
        ];
    }
}
