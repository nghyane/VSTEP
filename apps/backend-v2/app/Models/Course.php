<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug', 'title', 'target_level', 'target_exam_school', 'description',
    'price_coins', 'bonus_coins', 'max_slots', 'max_slots_per_student',
    'start_date', 'end_date', 'required_full_tests', 'commitment_window_days',
    'exam_cooldown_days', 'livestream_url', 'teacher_id', 'is_published',
])]
class Course extends BaseModel
{
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
