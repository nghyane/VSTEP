<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ExerciseFeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'profile_id' => $this->resource->profile_id,
            'content_type' => $this->resource->content_type,
            'content_id' => $this->resource->content_id,
            'rating' => $this->resource->rating,
            'comment' => $this->resource->comment,
            'profile' => $this->whenLoaded('profile', fn () => [
                'id' => $this->resource->profile->id,
                'nickname' => $this->resource->profile->nickname,
            ]),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
