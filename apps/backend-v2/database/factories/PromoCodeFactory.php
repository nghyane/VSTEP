<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PromoCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PromoCode>
 */
class PromoCodeFactory extends Factory
{
    protected $model = PromoCode::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->lexify('CODE????')),
            'partner_name' => null,
            'amount_coins' => 50,
            'max_total_uses' => null,
            'per_account_limit' => 1,
            'expires_at' => now()->addYear(),
            'is_active' => true,
        ];
    }
}
