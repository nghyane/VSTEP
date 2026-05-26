<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'label',
    'amount_vnd',
    'coins_base',
    'bonus_coins',
    'display_order',
    'is_active',
    'is_best_value',
])]
class WalletTopupPackage extends BaseModel
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_best_value' => 'boolean',
        ];
    }

    public function totalCoins(): int
    {
        return $this->coins_base + $this->bonus_coins;
    }
}
