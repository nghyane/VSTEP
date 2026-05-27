<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Enums\BookingStatus;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read TeacherSlot $resource
 */
final class AdminTeacherSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeBooking = $this->resource->relationLoaded('bookings')
            ? $this->resource->bookings->whereIn('status', BookingStatus::activeStatuses())->first()
            : null;

        return [
            'id' => $this->resource->id,
            'course_id' => $this->resource->course_id,
            'teacher_id' => $this->resource->teacher_id,
            'starts_at' => $this->resource->starts_at->toIso8601String(),
            'duration_minutes' => (int) $this->resource->duration_minutes,
            'status' => $this->resource->status,
            'booking' => $activeBooking !== null ? $this->formatBooking($activeBooking) : null,
        ];
    }

    private function formatBooking(TeacherBooking $booking): array
    {
        $profile = $booking->relationLoaded('profile') ? $booking->profile : null;
        $account = $profile?->relationLoaded('account') ? $profile->account : null;

        return [
            'id' => $booking->id,
            'meet_url' => $booking->meet_url,
            'status' => $booking->status,
            'booked_at' => $booking->booked_at->toIso8601String(),
            'profile' => $profile !== null ? [
                'id' => $profile->id,
                'nickname' => $profile->nickname,
                'full_name' => $account?->full_name,
                'email' => $account?->email,
            ] : null,
        ];
    }
}
