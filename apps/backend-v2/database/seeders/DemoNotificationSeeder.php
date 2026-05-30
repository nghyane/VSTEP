<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Profile;
use App\Services\NotificationService;
use Illuminate\Database\Seeder;

/**
 * Seed notifications for demo profile using NotificationService.
 * No hacky exists() guards — uses dedup keys for idempotency.
 */
final class DemoNotificationSeeder extends Seeder
{
    public function run(NotificationService $notificationService): void
    {
        $profile = Profile::query()->where('nickname', 'Minh')->first();
        if (! $profile) {
            return;
        }

        $pid = $profile->id;

        $this->push($notificationService, $profile, $pid,
            NotificationType::AssessmentCompleted,
            'Chấm bài Writing hoàn tất',
            'Bài viết Task 1 của bạn đã được chấm xong. Xem kết quả ngay!',
            IconKey::Check,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::AssessmentCompleted,
            'Chấm bài Speaking hoàn tất',
            'Bài nói Part 1 của bạn đạt band 7.0. Xem chi tiết!',
            IconKey::Check,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::CourseEnrolled,
            'Đã đăng ký khóa K101',
            'Bạn đã tham gia khóa VSTEP B1 Cấp tốc. Lịch học thứ 2-4-6 hàng tuần.',
            IconKey::Book,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::CourseEnrolled,
            'Đã đăng ký khóa K83',
            'Bạn đã tham gia khóa ôn thi VSTEP B1. Chuẩn bị cho kỳ thi sắp tới!',
            IconKey::Book,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::CoinReceived,
            '+4000 xu thưởng khóa học',
            'Bạn nhận được 4000 xu từ khóa K101. Dùng để mở khóa bài thi thử!',
            IconKey::Coin,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::TopupCompleted,
            'Nạp xu thành công',
            'Bạn vừa nạp 300 xu. Số dư hiện tại: 400 xu.',
            IconKey::Coin,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::StudyReminder,
            'Đã đến lúc luyện tập!',
            'Dành 15 phút luyện tập hôm nay để duy trì streak nhé!',
            IconKey::Book,
        );

        $this->push($notificationService, $profile, $pid,
            NotificationType::BookingCreated,
            'Đặt lịch 1-1 thành công',
            'Bạn đã đặt lịch học kèm với giảng viên vào 19:30 thứ 4 tuần này.',
            IconKey::Calendar,
        );
    }

    private function push(
        NotificationService $svc,
        Profile $profile,
        string $pid,
        NotificationType $type,
        string $title,
        string $body,
        IconKey $icon,
    ): void {
        $svc->push(
            profile: $profile,
            type: $type,
            title: $title,
            body: $body,
            iconKey: $icon,
            dedupKey: "demo:{$pid}:{$type->value}:{$title}",
        );
    }
}
