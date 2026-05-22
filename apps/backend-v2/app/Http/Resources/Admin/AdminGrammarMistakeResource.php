<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GrammarCommonMistake;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarCommonMistake $resource
 */
final class AdminGrammarMistakeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'grammar_point_id' => $this->resource->grammar_point_id,
            'wrong' => $this->resource->wrong,
            'correct' => $this->resource->correct,
            'explanation' => $this->resource->explanation,
            'display_order' => $this->resource->display_order,
        ];
    }
}
