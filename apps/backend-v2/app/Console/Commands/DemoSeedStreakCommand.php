<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DashboardDemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Dev-only command: tạo N ngày activity liên tiếp + derive streak = N cho 1 user
 * để test UI streak (mốc 7/14/30, claim flow). Reuse drill ranges từ
 * DashboardDemoSeeder để tránh duplicate config demo data.
 *
 * Usage: php artisan demo:streak learner@vstep.test 30
 */
class DemoSeedStreakCommand extends Command
{
    protected $signature = 'demo:streak {email} {days : Số ngày liên tiếp cần seed}';

    protected $description = 'Seed N ngày activity liên tiếp cho user để test UI streak';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $days = (int) $this->argument('days');

        if ($days < 1) {
            $this->error('Days phải >= 1');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            $this->error("User không tồn tại: {$email}");

            return self::FAILURE;
        }

        $profile = Profile::query()->where('account_id', $user->id)->first();
        if (! $profile) {
            $this->error("User {$email} không có profile");

            return self::FAILURE;
        }

        DB::transaction(function () use ($profile, $days) {
            DB::table('profile_daily_activity')
                ->where('profile_id', $profile->id)
                ->delete();

            $today = Carbon::today();
            for ($i = 0; $i < $days; $i++) {
                ProfileDailyActivity::create([
                    'profile_id' => $profile->id,
                    'date_local' => $today->copy()->subDays($i)->toDateString(),
                    'drill_session_count' => rand(...DashboardDemoSeeder::DRILL_SESSIONS_RANGE),
                    'drill_duration_seconds' => rand(...DashboardDemoSeeder::DRILL_DURATION_RANGE_SECONDS),
                ]);
            }

            DB::table('profile_streak_state')->updateOrInsert(
                ['profile_id' => $profile->id],
                [
                    'current_streak' => $days,
                    'longest_streak' => $days,
                    'last_active_date_local' => $today->toDateString(),
                    'updated_at' => now(),
                ],
            );
        });

        $this->info("Seeded {$days} ngày streak liên tiếp cho {$email}");

        return self::SUCCESS;
    }
}
