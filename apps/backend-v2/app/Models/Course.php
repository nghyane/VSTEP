<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug', 'title', 'target_level', 'target_exam_school', 'description', 'rules',
    'price_coins', 'bonus_coins', 'price_vnd', 'original_price_vnd',
    'max_slots', 'max_slots_per_student', 'booking_coin_cost',
    'start_date', 'end_date', 'required_full_tests', 'commitment_window_days',
    'livestream_url', 'teacher_id', 'is_published',
])]
class Course extends BaseModel
{
    /** Khóa cấp tốc VSTEP tối đa 90 ngày. */
    public const MAX_DURATION_DAYS = 90;

    /** Không cho đổi start_date khi còn <= 10 ngày trước khóa bắt đầu. */
    public const START_DATE_LOCK_DAYS = 10;

    protected function casts(): array
    {
        return [
            'start_date' => 'date', 'end_date' => 'date', 'is_published' => 'boolean',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function scheduleItems(): HasMany
    {
        return $this->hasMany(CourseScheduleItem::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function enrollmentOrders(): HasMany
    {
        return $this->hasMany(CourseEnrollmentOrder::class);
    }

    public function slots(): HasMany
    {
        return $this->hasMany(TeacherSlot::class);
    }

    public function soldSlots(): int
    {
        return $this->enrollments()->count();
    }

    public function isFull(): bool
    {
        return $this->soldSlots() >= $this->max_slots;
    }
}
