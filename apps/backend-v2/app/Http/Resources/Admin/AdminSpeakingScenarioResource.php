<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeSpeakingScenario;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeSpeakingScenario $resource
 */
class AdminSpeakingScenarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'slug' => $this->resource->slug,
            'title' => $this->resource->title,
            'level' => $this->resource->level,
            'character_name' => $this->resource->character_name,
            'character_voice_label' => $this->resource->character_voice_label,
            'description' => $this->resource->description,
            'system_prompt' => $this->resource->system_prompt,
            'opening_line' => $this->resource->opening_line,
            'target_vocab' => $this->resource->target_vocab ?? [],
            'estimated_minutes' => $this->resource->estimated_minutes,
            'expected_turns' => $this->resource->expected_turns,
            'is_published' => (bool) $this->resource->is_published,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
