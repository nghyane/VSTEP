<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SlotStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['course_id', 'teacher_id', 'starts_at', 'duration_minutes', 'status'])]
class TeacherSlot extends BaseModel
{
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'status' => SlotStatus::class,
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(TeacherBooking::class, 'slot_id');
    }
}
