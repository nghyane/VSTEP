<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\TeacherBooking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read TeacherBooking $resource
 */
class AdminTeacherBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $slot = $this->resource->relationLoaded('slot') ? $this->resource->slot : null;
        $profile = $this->resource->relationLoaded('profile') ? $this->resource->profile : null;
        $account = $profile?->relationLoaded('account') ? $profile->account : null;

        return [
            'id' => $this->resource->id,
            'meet_url' => $this->resource->meet_url,
            'status' => $this->resource->status,
            'booked_at' => $this->resource->booked_at->toIso8601String(),
            'slot' => $slot !== null ? [
                'id' => $slot->id,
                'starts_at' => $slot->starts_at->toIso8601String(),
                'duration_minutes' => (int) $slot->duration_minutes,
                'course_id' => $slot->course_id,
            ] : null,
            'profile' => $profile !== null ? [
                'id' => $profile->id,
                'nickname' => $profile->nickname,
                'full_name' => $account?->full_name,
                'email' => $account?->email,
            ] : null,
        ];
    }
}
