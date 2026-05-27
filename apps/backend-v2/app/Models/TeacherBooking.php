<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'slot_id', 'profile_id', 'submission_type', 'submission_id',
    'meet_url', 'status', 'booked_at', 'cancelled_at',
])]
class TeacherBooking extends BaseModel
{
    protected function casts(): array
    {
        return [
            'booked_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'status' => BookingStatus::class,
        ];
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(TeacherSlot::class, 'slot_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
