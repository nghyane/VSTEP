<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ScoringPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read ScoringPolicy $resource
 */
final class AdminScoringPolicyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'rubric_id' => $this->resource->rubric_id,
            'version' => $this->resource->version,
            'name' => $this->resource->name,
            'rules' => $this->resource->rules,
            'is_active' => (bool) $this->resource->is_active,
            'created_at' => $this->resource->created_at,
        ];
    }
}
