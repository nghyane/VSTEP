<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\Profile;
use Illuminate\Database\Seeder;

final class DemoNotificationSeeder extends Seeder
{
    public function run(): void
    {
        $profile = Profile::query()->where('nickname', 'Minh')->first();
        if (! $profile) {
            return;
        }

        $notifications = [
            [
                'type' => NotificationType::GradingCompleted,
                'title' => 'Chấm bài Writing hoàn tất',
                'body' => 'Bài viết Task 1 của bạn đã được chấm xong. Xem kết quả ngay!',
                'iconKey' => IconKey::Check,
                'minutesAgo' => 30,
            ],
            [
                'type' => NotificationType::GradingCompleted,
                'title' => 'Chấm bài Speaking hoàn tất',
                'body' => 'Bài nói Part 1 của bạn đạt band 7.0. Xem chi tiết!',
                'iconKey' => IconKey::Check,
                'minutesAgo' => 60,
            ],
            [
                'type' => NotificationType::CourseEnrolled,
                'title' => 'Đã đăng ký khóa K101',
                'body' => 'Bạn đã tham gia khóa VSTEP B1 Cấp tốc. Lịch học thứ 2-4-6 hàng tuần.',
                'iconKey' => IconKey::Book,
                'minutesAgo' => 1440,
            ],
            [
                'type' => NotificationType::CourseEnrolled,
                'title' => 'Đã đăng ký khóa K83',
                'body' => 'Bạn đã tham gia khóa ôn thi VSTEP B1. Chuẩn bị cho kỳ thi sắp tới!',
                'iconKey' => IconKey::Book,
                'minutesAgo' => 2880,
            ],
            [
                'type' => NotificationType::CoinReceived,
                'title' => '+4000 xu thưởng khóa học',
                'body' => 'Bạn nhận được 4000 xu từ khóa K101. Dùng để mở khóa bài thi thử!',
                'iconKey' => IconKey::Coin,
                'minutesAgo' => 4320,
            ],
            [
                'type' => NotificationType::TopupCompleted,
                'title' => 'Nạp xu thành công',
                'body' => 'Bạn vừa nạp 300 xu. Số dư hiện tại: 400 xu.',
                'iconKey' => IconKey::Coin,
                'minutesAgo' => 5760,
            ],
            [
                'type' => NotificationType::StudyReminder,
                'title' => 'Đã đến lúc luyện tập!',
                'body' => 'Dành 15 phút luyện tập hôm nay để duy trì streak nhé!',
                'iconKey' => IconKey::Book,
                'minutesAgo' => 7200,
            ],
            [
                'type' => NotificationType::BookingCreated,
                'title' => 'Đặt lịch 1-1 thành công',
                'body' => 'Bạn đã đặt lịch học kèm với giảng viên vào 19:30 thứ 4 tuần này.',
                'iconKey' => IconKey::Calendar,
                'minutesAgo' => 10080,
            ],
        ];

        foreach ($notifications as $data) {
            Notification::create([
                'profile_id' => $profile->id,
                'type' => $data['type']->value,
                'title' => $data['title'],
                'body' => $data['body'],
                'icon_key' => $data['iconKey']->value,
                'created_at' => now()->subMinutes($data['minutesAgo']),
            ]);
        }
    }
}
