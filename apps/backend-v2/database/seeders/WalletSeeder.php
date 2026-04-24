<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PromoCode;
use App\Models\WalletTopupPackage;
use Illuminate\Database\Seeder;

class WalletSeeder extends Seeder
{
    public function run(): void
    {
        // Baseline: 300đ / xu. Bonus tăng dần theo size gói.
        $packages = [
            ['Gói khởi đầu', 30_000, 100, 0, 1],
            ['Gói cơ bản', 90_000, 300, 20, 2],
            ['Gói phổ biến', 210_000, 700, 100, 3],
            ['Gói tiết kiệm', 450_000, 1_500, 300, 4],
        ];

        $labels = [];
        foreach ($packages as [$label, $vnd, $base, $bonus, $order]) {
            $labels[] = $label;
            WalletTopupPackage::updateOrCreate(
                ['label' => $label],
                [
                    'amount_vnd' => $vnd,
                    'coins_base' => $base,
                    'bonus_coins' => $bonus,
                    'display_order' => $order,
                    'is_active' => true,
                ],
            );
        }

        WalletTopupPackage::whereNotIn('label', $labels)->update(['is_active' => false]);

        $codes = [
            ['DEAR_VSTEP', 'The Coffee House', 50, null, 1],
            ['WELCOME', null, 100, 1_000, 1],
        ];

        foreach ($codes as [$code, $partner, $amount, $totalLimit, $perAccount]) {
            PromoCode::firstOrCreate(
                ['code' => $code],
                [
                    'partner_name' => $partner,
                    'amount_coins' => $amount,
                    'max_total_uses' => $totalLimit,
                    'per_account_limit' => $perAccount,
                    'expires_at' => now()->addYear(),
                    'is_active' => true,
                ],
            );
        }
    }
}
