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
            'translation' => $this->resource->translation,
        ];
    }
}
