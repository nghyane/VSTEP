<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\WalletTopupPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WalletTopupPackage>
 */
class WalletTopupPackageFactory extends Factory
{
    protected $model = WalletTopupPackage::class;

    public function definition(): array
    {
        return [
            'label' => fake()->unique()->words(2, true),
            'amount_vnd' => 50_000,
            'coins_base' => 500,
            'bonus_coins' => 0,
            'display_order' => 0,
            'is_active' => true,
        ];
    }
}
