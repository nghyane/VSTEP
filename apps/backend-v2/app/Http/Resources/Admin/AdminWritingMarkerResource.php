<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeWritingSampleMarker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeWritingSampleMarker $resource
 */
class AdminWritingMarkerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'prompt_id' => $this->resource->prompt_id,
            'match' => $this->resource->match,
            'occurrence' => $this->resource->occurrence,
            'side' => $this->resource->side,
            'color' => $this->resource->color,
            'label' => $this->resource->label,
            'detail' => $this->resource->detail,
            'display_order' => $this->resource->display_order,
        ];
    }
}
