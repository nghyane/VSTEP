<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'promo_code_id',
    'account_id',
    'profile_id',
    'coins_granted',
    'coin_transaction_id',
    'redeemed_at',
])]
class PromoCodeRedemption extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'redeemed_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(User::class, 'account_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function coinTransaction(): BelongsTo
    {
        return $this->belongsTo(CoinTransaction::class);
    }
}
