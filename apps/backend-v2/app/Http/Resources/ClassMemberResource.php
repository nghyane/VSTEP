<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'full_name' => $this->whenLoaded('user', fn () => $this->user->full_name),
            'email' => $this->whenLoaded('user', fn () => $this->user->email),
            'joined_at' => $this->joined_at,
        ];
    }
}
