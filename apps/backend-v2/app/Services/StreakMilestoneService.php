<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\Profile;
use App\Models\ProfileStreakClaim;
use App\Models\ProfileStreakState;
use App\Models\SystemConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Streak milestone reward — claim xu khi đạt mốc N ngày streak.
 *
 * Idempotent: 1 claim/(profile, milestone_days). Tham chiếu config
 * `streak.milestones` cho danh sách mốc + số xu.
 */
class StreakMilestoneService
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {}

    /**
     * @return array<int, array{days:int, coins:int}>
     */
    public function getMilestones(): array
    {
        $raw = SystemConfig::get('streak.milestones') ?? [];
        if (! is_array($raw)) {
            return [];
        }

        return collect($raw)
            ->map(fn ($m) => ['days' => (int) ($m['days'] ?? 0), 'coins' => (int) ($m['coins'] ?? 0)])
            ->filter(fn ($m) => $m['days'] > 0 && $m['coins'] > 0)
            ->sortBy('days')
            ->values()
            ->all();
    }

    /**
     * Liệt kê milestone kèm trạng thái claim cho profile.
     *
     * @return array<int, array{days:int, coins:int, claimed:bool, claimed_at:?string}>
     */
    public function listForProfile(Profile $profile): array
    {
        $milestones = $this->getMilestones();
        if ($milestones === []) {
            return [];
        }

        $claims = ProfileStreakClaim::query()
            ->where('profile_id', $profile->id)
            ->get(['milestone_days', 'claimed_at'])
            ->keyBy('milestone_days');

        return collect($milestones)
            ->map(function ($m) use ($claims) {
                $claim = $claims->get($m['days']);

                return [
                    'days' => $m['days'],
                    'coins' => $m['coins'],
                    'claimed' => $claim !== null,
                    'claimed_at' => $claim?->claimed_at?->toIso8601String(),
                ];
            })
            ->all();
    }

    /**
     * Claim mốc — credit xu, ghi claim record.
     *
     * @return array<string,mixed>
     */
    public function claim(Profile $profile, int $days): array
    {
        $milestone = collect($this->getMilestones())->firstWhere('days', $days);
        if ($milestone === null) {
            throw ValidationException::withMessages([
                'milestone_days' => ["Mốc {$days} ngày không tồn tại."],
            ]);
        }

        return DB::transaction(function () use ($profile, $milestone) {
            // Lock streak state để tránh race với updateStreak.
            $state = ProfileStreakState::query()
                ->whereKey($profile->id)
                ->lockForUpdate()
                ->first();

            $currentStreak = (int) ($state?->current_streak ?? 0);
            if ($currentStreak < $milestone['days']) {
                throw ValidationException::withMessages([
                    'milestone_days' => ["Cần đạt {$milestone['days']} ngày streak (hiện {$currentStreak})."],
                ]);
            }

            $existing = ProfileStreakClaim::query()
                ->where('profile_id', $profile->id)
                ->where('milestone_days', $milestone['days'])
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                throw ValidationException::withMessages([
                    'milestone_days' => ['Mốc này đã được nhận thưởng.'],
                ]);
            }

            $claim = ProfileStreakClaim::query()->create([
                'profile_id' => $profile->id,
                'milestone_days' => $milestone['days'],
                'coins_granted' => $milestone['coins'],
                'claimed_at' => now(),
            ]);

            $tx = $this->walletService->credit(
                profile: $profile,
                amount: $milestone['coins'],
                type: CoinTransactionType::StreakMilestone,
                source: $claim,
                metadata: ['milestone_days' => $milestone['days']],
            );

            $claim->coin_transaction_id = $tx->id;
            $claim->save();

            return [
                'milestone_days' => $milestone['days'],
                'coins_granted' => $milestone['coins'],
                'balance_after' => (int) $tx->balance_after,
                'claimed_at' => $claim->claimed_at->toIso8601String(),
            ];
        });
    }
}
