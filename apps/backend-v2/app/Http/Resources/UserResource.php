<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read User $resource
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'email' => $this->resource->email,
            'full_name' => $this->resource->full_name,
            'role' => $this->resource->role->value,
            'avatar_key' => $this->resource->avatar_key,
            'email_verified_at' => $this->resource->email_verified_at,
            'created_at' => $this->resource->created_at,
        ];
    }
}
