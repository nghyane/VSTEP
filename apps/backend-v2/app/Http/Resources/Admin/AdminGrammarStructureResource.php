<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GrammarStructure;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarStructure $resource
 */
final class AdminGrammarStructureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'grammar_point_id' => $this->resource->grammar_point_id,
            'template' => $this->resource->template,
            'description' => $this->resource->description,
            'display_order' => $this->resource->display_order,
        ];
    }
}
