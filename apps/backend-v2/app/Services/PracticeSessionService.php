<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\SystemConfig;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Practice session lifecycle + support level charge.
 *
 * Session flow:
 * 1. start(): create row với module + content_ref.
 * 2. useSupportLevel(): trừ xu theo config['support.level_costs'][level].
 *    Append vào support_levels_used JSON.
 * 3. complete(): set ended_at + duration_seconds. Progress context sẽ
 *    listen event này ở Slice 9 (streak + study time).
 */
class PracticeSessionService
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {}

    public function start(
        Profile $profile,
        string $module,
        Model $content,
    ): PracticeSession {
        return PracticeSession::create([
            'profile_id' => $profile->id,
            'module' => $module,
            'content_ref_type' => $this->refType($content),
            'content_ref_id' => $content->getKey(),
            'started_at' => now(),
            'support_levels_used' => [],
        ]);
    }

    /**
     * Bật support level cho session. Trừ xu atomic.
     * Idempotent theo (session_id, level): nếu đã dùng rồi → skip charge.
     *
     * @return array{coins_spent: int, balance_after: int, support_levels_used: array<int,array<string,mixed>>}
     */
    public function useSupportLevel(
        PracticeSession $session,
        Profile $profile,
        int $level,
    ): array {
        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }

        $costs = SystemConfig::get('support.level_costs') ?? [];
        if (! isset($costs[(string) $level])) {
            throw ValidationException::withMessages([
                'level' => ["Support level {$level} not configured."],
            ]);
        }
        $cost = (int) $costs[(string) $level];

        return DB::transaction(function () use ($session, $profile, $level, $cost) {
            $locked = PracticeSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            $used = (array) ($locked->support_levels_used ?? []);
            $alreadyUsed = collect($used)->contains(fn ($entry) => ($entry['level'] ?? null) === $level);

            if ($alreadyUsed) {
                return [
                    'coins_spent' => 0,
                    'balance_after' => $this->walletService->getBalance($profile),
                    'support_levels_used' => $used,
                ];
            }

            $tx = $cost > 0
                ? $this->walletService->spend(
                    profile: $profile,
                    amount: $cost,
                    type: CoinTransactionType::SupportLevelUse,
                    source: $locked,
                    metadata: ['level' => $level, 'module' => $locked->module],
                )
                : null;

            $used[] = [
                'level' => $level,
                'used_at' => now()->toIso8601String(),
                'coins_spent' => $cost,
            ];
            $locked->update(['support_levels_used' => $used]);

            return [
                'coins_spent' => $cost,
                'balance_after' => $tx?->balance_after ?? $this->walletService->getBalance($profile),
                'support_levels_used' => $used,
            ];
        });
    }

    public function complete(PracticeSession $session): PracticeSession
    {
        if ($session->ended_at !== null) {
            return $session;
        }

        $endedAt = now();
        $duration = (int) $endedAt->diffInSeconds($session->started_at, absolute: true);

        $session->update([
            'ended_at' => $endedAt,
            'duration_seconds' => $duration,
        ]);

        return $session->refresh();
    }

    private function refType(Model $content): string
    {
        return Str::snake(class_basename($content::class));
    }
}
