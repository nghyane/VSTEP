<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Status machine:
 *   pending → paid (callback success)
 *   pending → failed (callback fail)
 *   pending → expired (timeout job)
 */
#[Fillable([
    'profile_id',
    'package_id',
    'amount_vnd',
    'coins_to_credit',
    'status',
    'payment_provider',
    'provider_ref',
    'paid_at',
])]
class WalletTopupOrder extends BaseModel
{
    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
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
