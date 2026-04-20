<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PracticeSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeSession $resource
 */
class PracticeSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'profile_id' => $this->resource->profile_id,
            'module' => $this->resource->module,
            'content_ref_type' => $this->resource->content_ref_type,
            'content_ref_id' => $this->resource->content_ref_id,
            'started_at' => $this->resource->started_at,
            'ended_at' => $this->resource->ended_at,
            'duration_seconds' => $this->resource->duration_seconds,
            'support_levels_used' => $this->resource->support_levels_used ?? [],
        ];
    }
}
