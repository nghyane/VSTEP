<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'code',
    'partner_name',
    'amount_coins',
    'max_total_uses',
    'per_account_limit',
    'expires_at',
    'is_active',
])]
class PromoCode extends BaseModel
{
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function isUsable(?\DateTimeInterface $now = null): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now ??= now();

        return $this->expires_at === null || $this->expires_at->isAfter($now);
    }
}
