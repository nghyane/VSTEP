<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ScenarioSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'level' => $this->level,
            'character_name' => $this->character_name,
            'character_voice' => $this->character_voice_label,
            'description' => $this->description,
            'estimated_minutes' => $this->estimated_minutes,
        ];
    }
}
