<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WritingPromptDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'part' => $this->part,
            'prompt' => $this->prompt,
            'min_words' => $this->min_words,
            'max_words' => $this->max_words,
            'required_points' => $this->required_points ?? [],
            'keywords' => $this->keywords ?? [],
            'sentence_starters' => $this->sentence_starters ?? [],
            'sample_answer' => $this->sample_answer,
            'estimated_minutes' => $this->estimated_minutes,
            'outline_sections' => $this->outlineSections->sortBy('display_order')->values(),
            'template_sections' => $this->templateSections->sortBy('display_order')->values(),
            'sample_markers' => $this->sampleMarkers->sortBy('display_order')->values(),
        ];
    }
}
