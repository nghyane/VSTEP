<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read User $resource
 */
final class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'email' => $this->resource->email,
            'full_name' => $this->resource->full_name,
            'role' => $this->resource->role,
            'avatar_key' => $this->resource->avatar_key,
            'title' => $this->resource->title,
            'bio' => $this->resource->bio,
            'deactivated_at' => $this->resource->deactivated_at,
            'created_at' => $this->resource->created_at,
            // Show endpoint set `active_courses` lên model qua setAttribute
            // trước khi pass vào resource (cho teacher); list endpoint không
            // set → field bị ẩn. Dùng getAttributes() vì Laravel strict mode
            // (preventAccessingMissingAttributes) throw khi access property
            // chưa từng set.
            'active_courses' => $this->when(
                array_key_exists('active_courses', $this->resource->getAttributes()),
                fn () => $this->resource->getAttributes()['active_courses'],
            ),
        ];
    }
}
