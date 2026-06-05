<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ShadowingProgressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'lesson_id' => $this->resource->lesson_id,
            'segment_index' => $this->resource->segment_index,
            'accuracy_percent' => $this->resource->accuracy_percent,
        ];
    }
}
