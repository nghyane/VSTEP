<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Status machine:
 *   pending → paid (callback success)
 *   pending → failed (callback fail or invalid signature)
 *   pending → expired (timeout job)
 */
#[Fillable([
    'order_code',
    'profile_id',
    'package_id',
    'amount_vnd',
    'coins_to_credit',
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
class WalletTopupOrder extends BaseModel
{
    protected function casts(): array
    {
        return [
            'order_code' => 'integer',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'callback_received_at' => 'datetime',
            'gateway_response' => 'array',
            'status' => OrderStatus::class,
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(WalletTopupPackage::class, 'package_id');
    }
}
