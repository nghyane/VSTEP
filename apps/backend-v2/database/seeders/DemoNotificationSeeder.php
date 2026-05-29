<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Profile;
use App\Services\NotificationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed notifications for demo profile using NotificationService (validates
 * enum types, dedup keys, profile existence).
 */
final class DemoNotificationSeeder extends Seeder
{
    public function run(NotificationService $notificationService): void
    {
        $profile = Profile::query()->where('nickname', 'Minh')->first();
        if (! $profile) {
            return;
        }

        if (DB::table('notifications')->where('profile_id', $profile->id)->exists()) {
            return;
        }

        $notificationService->push(
            $profile, NotificationType::GradingCompleted,
            'Chấm bài Writing hoàn tất',
            'Bài viết Task 1 của bạn đã được chấm xong. Xem kết quả ngay!',
            IconKey::Check,
        );

        $notificationService->push(
            $profile, NotificationType::GradingCompleted,
            'Chấm bài Speaking hoàn tất',
            'Bài nói Part 1 của bạn đạt band 7.0. Xem chi tiết!',
            IconKey::Check,
        );

        $notificationService->push(
            $profile, NotificationType::CourseEnrolled,
            'Đã đăng ký khóa K101',
            'Bạn đã tham gia khóa VSTEP B1 Cấp tốc. Lịch học thứ 2-4-6 hàng tuần.',
            IconKey::Book,
        );

        $notificationService->push(
            $profile, NotificationType::CourseEnrolled,
            'Đã đăng ký khóa K83',
            'Bạn đã tham gia khóa ôn thi VSTEP B1. Chuẩn bị cho kỳ thi sắp tới!',
            IconKey::Book,
        );

        $notificationService->push(
            $profile, NotificationType::CoinReceived,
            '+4000 xu thưởng khóa học',
            'Bạn nhận được 4000 xu từ khóa K101. Dùng để mở khóa bài thi thử!',
            IconKey::Coin,
        );

        $notificationService->push(
            $profile, NotificationType::TopupCompleted,
            'Nạp xu thành công',
            'Bạn vừa nạp 300 xu. Số dư hiện tại: 400 xu.',
            IconKey::Coin,
        );

        $notificationService->push(
            $profile, NotificationType::StudyReminder,
            'Đã đến lúc luyện tập!',
            'Dành 15 phút luyện tập hôm nay để duy trì streak nhé!',
            IconKey::Book,
        );

        $notificationService->push(
            $profile, NotificationType::BookingCreated,
            'Đặt lịch 1-1 thành công',
            'Bạn đã đặt lịch học kèm với giảng viên vào 19:30 thứ 4 tuần này.',
            IconKey::Calendar,
        );
    }
}
