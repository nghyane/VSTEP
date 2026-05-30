<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Status machine:
 *   pending → paid (gateway callback)
 *   pending → expired (timeout)
 */
#[Fillable([
    'profile_id',
    'order_code',
    'course_id',
    'amount_vnd',
    'status',
    'payment_provider',
    'provider_ref',
    'payment_url',
    'gateway_transaction_id',
    'gateway_response',
    'callback_received_at',
    'expires_at',
    'paid_at',
])]
class CourseEnrollmentOrder extends BaseModel
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'order_code' => 'integer',
            'paid_at' => 'datetime',
            'callback_received_at' => 'datetime',
            'expires_at' => 'datetime',
            'gateway_response' => 'array',
            'status' => OrderStatus::class,
        ];
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
