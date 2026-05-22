<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GrammarExample;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarExample $resource
 */
final class AdminGrammarExampleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'grammar_point_id' => $this->resource->grammar_point_id,
            'en' => $this->resource->en,
            'vi' => $this->resource->vi,
            'note' => $this->resource->note,
            'display_order' => $this->resource->display_order,
        ];
    }
}
