<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Status machine:
 *   pending → paid (mock confirm / real gateway callback)
 *   pending → expired (timeout)
 */
#[Fillable([
    'profile_id',
    'course_id',
    'amount_vnd',
    'status',
    'payment_provider',
    'provider_ref',
    'paid_at',
])]
class CourseEnrollmentOrder extends BaseModel
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['paid_at' => 'datetime', 'status' => OrderStatus::class];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function isPaid(): bool
    {
        return $this->status === OrderStatus::Paid;
    }
}
