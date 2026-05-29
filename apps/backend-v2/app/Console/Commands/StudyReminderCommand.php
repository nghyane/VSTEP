<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Profile;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Sends a daily study reminder to learners who haven't practiced
 * in the last 48 hours. Scheduled via routes/console.php.
 */
final class StudyReminderCommand extends Command
{
    protected $signature = 'vstep:study-reminder';

    protected $description = 'Send study reminders to inactive learners';

    public function handle(NotificationService $notificationService): int
    {
        $yesterday = Carbon::today()->subDay()->toDateString();

        $staleProfiles = Profile::query()
            ->with('user')
            ->whereNotExists(function ($q) use ($yesterday) {
                $q->select(DB::raw(1))
                    ->from('profile_daily_activity')
                    ->whereColumn('profile_daily_activity.profile_id', 'profiles.id')
                    ->where('profile_daily_activity.date_local', '>=', $yesterday);
            })
            ->limit(500)
            ->get();

        $sent = 0;

        foreach ($staleProfiles as $profile) {
            $notificationService->push(
                $profile,
                NotificationType::StudyReminder,
                'Đã đến lúc luyện tập!',
                'Bạn chưa làm bài tập hôm qua và hôm nay. Dành 15 phút luyện tập để duy trì phong độ nhé!',
                IconKey::Book,
                dedupKey: 'study_reminder_'.$profile->id.'_'.Carbon::today()->toDateString(),
            );
            $sent++;
        }

        $this->info("Sent {$sent} study reminders.");

        return self::SUCCESS;
    }
}
