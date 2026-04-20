<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Profile;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $profile = Profile::first();
        if (! $profile) {
            return;
        }

        $notifications = [
            ['type' => 'reward', 'title' => 'Bạn nhận được 50 xu', 'body' => 'Hoàn thành bài học hôm nay', 'icon_key' => 'coin'],
            ['type' => 'reward', 'title' => 'Bạn nhận được 100 xu', 'body' => 'Streak 7 ngày liên tiếp', 'icon_key' => 'coin'],
            ['type' => 'system', 'title' => 'Cập nhật hệ thống', 'body' => 'Phiên bản mới đã sẵn sàng', 'icon_key' => 'info'],
            ['type' => 'reminder', 'title' => 'Nhắc nhở học tập', 'body' => 'Bạn chưa học hôm nay, hãy dành 15 phút nhé!', 'icon_key' => 'bell'],
            ['type' => 'achievement', 'title' => 'Mở khóa thành tựu', 'body' => 'Hoàn thành 10 bài tập listening', 'icon_key' => 'trophy'],
        ];

        foreach ($notifications as $i => $data) {
            Notification::create([
                'profile_id' => $profile->id,
                'type' => $data['type'],
                'title' => $data['title'],
                'body' => $data['body'],
                'icon_key' => $data['icon_key'],
                'created_at' => now()->subMinutes(count($notifications) - $i),
            ]);
        }
    }
}
