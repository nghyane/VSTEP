<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'type' => $this->resource->type,
            'title' => $this->resource->title,
            'body' => $this->resource->body,
            'icon_key' => $this->resource->icon_key,
            'payload' => $this->resource->payload,
            'dedup_key' => $this->resource->dedup_key,
            'read_at' => $this->resource->read_at,
            'created_at' => $this->resource->created_at,
        ];
    }
}
