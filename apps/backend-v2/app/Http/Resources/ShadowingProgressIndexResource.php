<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ShadowingProgressIndexResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}
