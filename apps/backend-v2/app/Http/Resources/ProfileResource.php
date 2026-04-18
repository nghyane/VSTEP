<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Profile $resource
 */
class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'nickname' => $this->resource->nickname,
            'target_level' => $this->resource->target_level,
            'target_deadline' => $this->resource->target_deadline?->toDateString(),
            'entry_level' => $this->resource->entry_level,
            'avatar_color' => $this->resource->avatar_color,
            'is_initial_profile' => $this->resource->is_initial_profile,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
