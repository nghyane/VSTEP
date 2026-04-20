<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ProfileGrammarMastery;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read ProfileGrammarMastery $resource
 */
class GrammarMasteryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'attempts' => $this->resource->attempts,
            'correct' => $this->resource->correct,
            'accuracy_percent' => $this->resource->accuracyPercent(),
            'computed_level' => $this->resource->computed_level->value,
            'last_practiced_at' => $this->resource->last_practiced_at,
        ];
    }
}
