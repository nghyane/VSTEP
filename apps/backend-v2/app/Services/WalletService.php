<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\CoinTransaction;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Single source of truth for coin economy.
 *
 * Balance = SUM(delta) per profile — derive, không lưu cache.
 * Atomic guarantee: wraps in DB transaction + locks profile row
 * (SELECT FOR UPDATE) để serialize concurrent spend/credit trên
 * cùng 1 profile. Không race.
 *
 * KHÔNG service nào khác được write `coin_transactions` trực tiếp.
 */
class WalletService
{
    public function getBalance(Profile $profile): int
    {
        $balance = CoinTransaction::query()
            ->where('profile_id', $profile->id)
            ->orderByDesc('id')
            ->value('balance_after');

        return $balance === null ? 0 : (int) $balance;
    }

    /**
     * Credit xu (dương). Không fail vì balance.
     *
     * @param  array<string,mixed>|null  $metadata
     */
    public function credit(
        Profile $profile,
        int $amount,
        CoinTransactionType $type,
        ?Model $source = null,
        ?array $metadata = null,
    ): CoinTransaction {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Credit amount must be positive.');
        }

        if (! $type->isCredit()) {
            throw new \InvalidArgumentException("Type {$type->value} is not a credit type.");
        }

        return $this->applyDelta($profile, $amount, $type, $source, $metadata);
    }

    /**
     * Spend xu (trừ đi).
     * Throws ValidationException nếu không đủ balance.
     *
     * @param  array<string,mixed>|null  $metadata
     */
    public function spend(
        Profile $profile,
        int $amount,
        CoinTransactionType $type,
        ?Model $source = null,
        ?array $metadata = null,
    ): CoinTransaction {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Spend amount must be positive.');
        }

        if ($type->isCredit()) {
            throw new \InvalidArgumentException("Type {$type->value} is not a debit type.");
        }

        return $this->applyDelta($profile, -$amount, $type, $source, $metadata);
    }

    /**
     * @param  array<string,mixed>|null  $metadata
     */
    private function applyDelta(
        Profile $profile,
        int $delta,
        CoinTransactionType $type,
        ?Model $source,
        ?array $metadata,
    ): CoinTransaction {
        return DB::transaction(function () use ($profile, $delta, $type, $source, $metadata) {
            // Lock profile row to serialize wallet ops on this profile.
            $locked = Profile::query()
                ->whereKey($profile->id)
                ->lockForUpdate()
                ->first();

            if ($locked === null) {
                throw new \RuntimeException('Profile vanished during wallet operation.');
            }

            $current = CoinTransaction::query()
                ->where('profile_id', $profile->id)
                ->orderByDesc('id')
                ->value('balance_after');
            $current = $current === null ? 0 : (int) $current;

            $next = $current + $delta;

            if ($next < 0) {
                throw ValidationException::withMessages([
                    'coins' => ['Insufficient balance: need '.abs($delta).", have {$current}."],
                ]);
            }

            return CoinTransaction::create([
                'profile_id' => $profile->id,
                'type' => $type,
                'delta' => $delta,
                'balance_after' => $next,
                'source_type' => $source ? $this->resolveSourceType($source) : null,
                'source_id' => $source?->getKey(),
                'metadata' => $metadata,
            ]);
        });
    }

    private function resolveSourceType(Model $source): string
    {
        $class = $source::class;

        // Map FQCN → short key for ledger. Ví dụ:
        // App\Models\WalletTopupOrder → wallet_topup_order
        // App\Models\PromoCodeRedemption → promo_code_redemption
        return Str::snake(class_basename($class));
    }
}
