<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\Profile;
use App\Models\PromoCode;
use App\Models\PromoCodeRedemption;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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
class PromoService
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {}

    public function redeem(User $account, Profile $profile, string $code): PromoCodeRedemption
    {
        if ($profile->account_id !== $account->id) {
            throw ValidationException::withMessages([
                'profile' => ['Profile does not belong to authenticated account.'],
            ]);
        }

        return DB::transaction(function () use ($account, $profile, $code) {
            $promo = PromoCode::query()
                ->whereRaw('LOWER(code) = ?', [strtolower($code)])
                ->lockForUpdate()
                ->first();

            if ($promo === null || ! $promo->isUsable()) {
                throw ValidationException::withMessages([
                    'code' => ['Invalid or expired promo code.'],
                ]);
            }

            if ($promo->max_total_uses !== null) {
                $used = PromoCodeRedemption::query()
                    ->where('promo_code_id', $promo->id)
                    ->count();
                if ($used >= $promo->max_total_uses) {
                    throw ValidationException::withMessages([
                        'code' => ['Promo code has reached total usage limit.'],
                    ]);
                }
            }

            $accountUses = PromoCodeRedemption::query()
                ->where('promo_code_id', $promo->id)
                ->where('account_id', $account->id)
                ->count();
            if ($accountUses >= $promo->per_account_limit) {
                throw ValidationException::withMessages([
                    'code' => ['You have already redeemed this promo code.'],
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
