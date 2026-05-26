<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GradingRubric;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GradingRubric $resource
 */
final class AdminGradingRubricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'skill' => $this->resource->skill,
            'version' => $this->resource->version,
            'name' => $this->resource->name,
            'source_reference' => $this->resource->source_reference,
            'criteria' => $this->resource->criteria,
            'scoring_formula' => $this->resource->scoring_formula,
            'is_active' => (bool) $this->resource->is_active,
            'effective_from' => $this->resource->effective_from?->toDateString(),
            'created_at' => $this->resource->created_at,
            'policies' => AdminScoringPolicyResource::collection(
                $this->whenLoaded('policies'),
            ),
            'active_policy' => new AdminScoringPolicyResource(
                $this->whenLoaded('activePolicy'),
            ),
        ];
    }
}
