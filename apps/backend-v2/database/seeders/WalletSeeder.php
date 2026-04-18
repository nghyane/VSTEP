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
        $packages = [
            ['Gói cơ bản', 50_000, 500, 0, 1],
            ['Gói tiêu chuẩn', 200_000, 2_000, 200, 2],
            ['Gói nâng cao', 500_000, 5_000, 500, 3],
        ];

        foreach ($packages as [$label, $vnd, $base, $bonus, $order]) {
            WalletTopupPackage::firstOrCreate(
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
