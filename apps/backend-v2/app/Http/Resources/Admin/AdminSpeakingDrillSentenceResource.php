<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeSpeakingDrillSentence;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeSpeakingDrillSentence $resource
 */
class AdminSpeakingDrillSentenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'drill_id' => $this->resource->drill_id,
            'display_order' => $this->resource->display_order,
            'text' => $this->resource->text,
            'ipa' => $this->resource->ipa,
            'translation' => $this->resource->translation,
            'word_count' => (int) $this->resource->word_count,
            'audio_start' => $this->resource->audio_start !== null ? (float) $this->resource->audio_start : null,
            'audio_end' => $this->resource->audio_end !== null ? (float) $this->resource->audio_end : null,
        ];
    }
}
