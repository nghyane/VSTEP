<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\CoinTransaction;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Single source of truth for coin economy.
 *
 * Balance = SUM(delta) per account — derive, không lưu cache.
 * Atomic guarantee: wraps in DB transaction + locks account row
 * (SELECT FOR UPDATE) để serialize concurrent spend/credit trên
 * cùng 1 account. Không race.
 *
 * KHÔNG service nào khác được write `coin_transactions` trực tiếp.
 */
final class WalletService
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Read-only balance snapshot for display/API responses.
     * Do not use this method for spend decisions; spend() re-checks under an account row lock.
     */
    public function getBalance(Profile $profile): int
    {
        return $this->getBalanceForAccount($profile->account);
    }

    public function getBalanceForAccount(User $account): int
    {
        $balance = CoinTransaction::query()
            ->where('account_id', $account->id)
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

        return $this->applyDelta($profile->account, $profile, $amount, $type, $source, $metadata);
    }

    /**
     * Credit account wallet with an optional profile context.
     *
     * @param  array<string,mixed>|null  $metadata
     */
    public function creditToAccount(
        User $account,
        ?Profile $profile,
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

        return $this->applyDelta($account, $profile, $amount, $type, $source, $metadata);
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

        return $this->applyDelta($profile->account, $profile, -$amount, $type, $source, $metadata);
    }

    /**
     * @param  array<string,mixed>|null  $metadata
     */
    private function applyDelta(
        User $account,
        ?Profile $profile,
        int $delta,
        CoinTransactionType $type,
        ?Model $source,
        ?array $metadata,
    ): CoinTransaction {
        return DB::transaction(function () use ($account, $profile, $delta, $type, $source, $metadata) {
            if ($profile !== null && $profile->account_id !== $account->id) {
                throw new \InvalidArgumentException('Profile does not belong to account wallet.');
            }

            $locked = User::query()
                ->whereKey($account->id)
                ->lockForUpdate()
                ->first();

            if ($locked === null) {
                throw new \RuntimeException('Account vanished during wallet operation.');
            }

            $current = CoinTransaction::query()
                ->where('account_id', $locked->id)
                ->orderByDesc('id')
                ->value('balance_after');
            $current = $current === null ? 0 : (int) $current;

            $next = $current + $delta;

            if ($next < 0) {
                throw ValidationException::withMessages([
                    'coins' => ['Không đủ xu. Cần '.abs($delta)." xu, hiện có {$current} xu."],
                ]);
            }

            $transaction = CoinTransaction::create([
                'account_id' => $locked->id,
                'profile_id' => $profile?->id,
                'type' => $type,
                'delta' => $delta,
                'balance_after' => $next,
                'source_type' => $source ? $this->resolveSourceType($source) : null,
                'source_id' => $source?->getKey(),
                'metadata' => $metadata,
            ]);

            if ($delta < 0 && $profile !== null) {
                DB::afterCommit(fn () => $this->notificationService->push(
                    profile: $profile,
                    type: NotificationType::CoinSpent,
                    title: $this->spendNotificationTitle($type),
                    body: 'Đã trừ '.number_format(abs($delta), 0, ',', '.').' xu. Số dư còn lại: '.number_format($next, 0, ',', '.').' xu.',
                    iconKey: IconKey::Coin,
                    payload: [
                        'transaction_id' => $transaction->id,
                        'type' => $type->value,
                        'delta' => $delta,
                        'balance_after' => $next,
                    ],
                    dedupKey: "coin-spent:{$transaction->id}",
                ));
            }

            return $transaction;
        });
    }

    private function spendNotificationTitle(CoinTransactionType $type): string
    {
        return match ($type) {
            CoinTransactionType::ExamFull => 'Đã trừ xu thi full-test',
            CoinTransactionType::ExamCustom => 'Đã trừ xu thi kỹ năng',
            CoinTransactionType::CoursePurchase => 'Đã trừ xu mua khóa học',
            CoinTransactionType::TeacherBooking => 'Đã trừ xu đặt lịch 1-1',
            CoinTransactionType::PracticeFeedback => 'Đã trừ xu nhận xét AI',
            default => 'Đã trừ xu',
        };
    }

    private function resolveSourceType(Model $source): string
    {
        return CoinSourceType::fromModel($source::class)->value;
    }
}
