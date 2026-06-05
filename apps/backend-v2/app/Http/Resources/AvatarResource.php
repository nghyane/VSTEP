<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AvatarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'avatar_key' => $this->resource->avatar_key,
            'avatar_url' => $this->resource->avatar_url,
        ];
    }
}
