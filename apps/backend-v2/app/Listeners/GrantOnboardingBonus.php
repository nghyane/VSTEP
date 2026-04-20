<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\CoinTransactionType;
use App\Events\ProfileCreated;
use App\Models\SystemConfig;
use App\Services\WalletService;

/**
 * Cấp xu onboarding cho initial profile của account.
 * Đọc số xu từ system_configs['onboarding.initial_coins'].
 *
 * Idempotent: nếu đã có 1 tx type=onboarding_bonus cho profile → skip.
 * Ở thời điểm profile tạo xong, ledger trống → tx đầu = onboarding bonus.
 */
final class GrantOnboardingBonus
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {}

    public function handle(ProfileCreated $event): void
    {
        if (! $event->profile->is_initial_profile) {
            return;
        }

        $amount = (int) (SystemConfig::get('onboarding.initial_coins') ?? 0);
        if ($amount <= 0) {
            return;
        }

        $this->walletService->credit(
            profile: $event->profile,
            amount: $amount,
            type: CoinTransactionType::OnboardingBonus,
            source: $event->profile,
            metadata: ['reason' => 'initial_profile_created'],
        );
    }
}
