<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\Profile;
use App\Models\PromoCode;
use App\Models\PromoCodeRedemption;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Promo code redemption logic.
 *
 * Chống farm:
 * - unique (promo_code_id, account_id) ở DB — 1 account dùng 1 code tối đa 1 lần
 *   khi per_account_limit = 1.
 * - max_total_uses: count redemptions toàn hệ thống.
 *
 * Xu vào profile được chỉ định (thường là active profile).
 */
final class PromoService
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {}

    public function redeem(User $account, Profile $profile, string $code): PromoCodeRedemption
    {
        if ($profile->account_id !== $account->id) {
            throw ValidationException::withMessages([
                'profile' => ['Hồ sơ này không thuộc tài khoản của bạn.'],
            ]);
        }

        return DB::transaction(function () use ($account, $profile, $code) {
            $promo = PromoCode::query()
                ->whereRaw('LOWER(code) = ?', [Str::lower($code)])
                ->lockForUpdate()
                ->first();

            if ($promo === null || ! $promo->isUsable()) {
                throw ValidationException::withMessages([
                    'code' => ['Mã quà tặng không hợp lệ hoặc đã hết hạn.'],
                ]);
            }

            if ($promo->max_total_uses !== null) {
                $used = PromoCodeRedemption::query()
                    ->where('promo_code_id', $promo->id)
                    ->count();
                if ($used >= $promo->max_total_uses) {
                    throw ValidationException::withMessages([
                        'code' => ['Mã quà tặng đã hết lượt sử dụng.'],
                    ]);
                }
            }

            $accountUses = PromoCodeRedemption::query()
                ->where('promo_code_id', $promo->id)
                ->where('account_id', $account->id)
                ->count();
            if ($accountUses >= $promo->per_account_limit) {
                throw ValidationException::withMessages([
                    'code' => ['Bạn đã sử dụng mã quà tặng này rồi.'],
                ]);
            }

            $tx = $this->walletService->credit(
                profile: $profile,
                amount: $promo->amount_coins,
                type: CoinTransactionType::PromoRedeem,
                source: $promo,
                metadata: [
                    'code' => $promo->code,
                    'partner' => $promo->partner_name,
                ],
            );

            return PromoCodeRedemption::create([
                'promo_code_id' => $promo->id,
                'account_id' => $account->id,
                'profile_id' => $profile->id,
                'coins_granted' => $promo->amount_coins,
                'coin_transaction_id' => $tx->id,
                'redeemed_at' => now(),
            ]);
        });
    }
}
