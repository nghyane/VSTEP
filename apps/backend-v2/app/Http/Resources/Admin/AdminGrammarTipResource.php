<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GrammarVstepTip;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarVstepTip $resource
 */
final class AdminGrammarTipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'grammar_point_id' => $this->resource->grammar_point_id,
            'task' => $this->resource->task,
            'tip' => $this->resource->tip,
            'example' => $this->resource->example,
            'display_order' => $this->resource->display_order,
        ];
    }
}
