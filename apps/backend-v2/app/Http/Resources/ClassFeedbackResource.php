<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassFeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'from_user_name' => $this->whenLoaded('fromUser', fn () => $this->fromUser->full_name),
            'to_user_name' => $this->whenLoaded('toUser', fn () => $this->toUser->full_name),
        ];
    }
}
