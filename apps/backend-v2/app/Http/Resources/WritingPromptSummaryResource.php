<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class WritingPromptSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description ?: $this->prompt,
            'part' => $this->part,
            'min_words' => $this->min_words,
            'max_words' => $this->max_words,
            'estimated_minutes' => $this->estimated_minutes,
            'has_submitted' => (bool) ($this->has_submitted ?? false),
        ];
    }
}
