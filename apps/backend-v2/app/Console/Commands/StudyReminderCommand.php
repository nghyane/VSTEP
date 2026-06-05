<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Services\NotificationEmailService;
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

    public function handle(NotificationService $notificationService, NotificationEmailService $emailService): int
    {
        $yesterday = Carbon::today()->subDay()->toDateString();

        $staleProfiles = Profile::query()
            ->with('account')
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
            $notification = $notificationService->push(
                $profile,
                NotificationType::StudyReminder,
                'Đã đến lúc luyện tập!',
                'Bạn chưa làm bài tập hôm qua và hôm nay. Dành 15 phút luyện tập để duy trì phong độ nhé!',
                IconKey::Book,
                dedupKey: 'study_reminder_'.$profile->id.'_'.Carbon::today()->toDateString(),
            );

            if ($notification !== null) {
                $inactiveDays = $this->inactiveDays($profile);
                if ($this->shouldSendEmail($inactiveDays)) {
                    $emailService->sendToProfile(
                        $profile,
                        'Đã lâu rồi bạn chưa luyện tập VSTEP',
                        [
                            "Bạn đã chưa luyện tập {$inactiveDays} ngày.",
                            'Dành 15 phút hôm nay để lấy lại nhịp học và tiếp tục cải thiện kỹ năng nhé.',
                        ],
                        'Vào luyện tập',
                        '/luyen-tap',
                    );
                }
            }
            $sent++;
        }

        $this->info("Sent {$sent} study reminders.");

        return self::SUCCESS;
    }

    private function inactiveDays(Profile $profile): int
    {
        $latestActivityDate = ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->max('date_local');

        $anchor = $latestActivityDate !== null
            ? Carbon::parse((string) $latestActivityDate)->startOfDay()
            : Carbon::parse($profile->created_at)->startOfDay();

        return (int) $anchor->diffInDays(Carbon::today());
    }

    private function shouldSendEmail(int $inactiveDays): bool
    {
        return in_array($inactiveDays, [3, 7, 14], true)
            || ($inactiveDays > 14 && ($inactiveDays - 14) % 7 === 0);
    }
}
