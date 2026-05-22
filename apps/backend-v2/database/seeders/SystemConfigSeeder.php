<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SystemConfig;
use Illuminate\Database\Seeder;

/**
 * Seed default system configs per RFC 0001 & RFC 0002.
 * Admin có thể override qua admin panel sau.
 */
class SystemConfigSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // Chart (Spider/Line) — chỉ từ exam sessions.
            'chart.min_tests' => [5, 'Số bài thi tối thiểu để hiện chart.'],
            'chart.sliding_window_size' => [10, 'Số bài gần nhất dùng compute band.'],
            'chart.std_dev_threshold' => [2.0, 'Ngưỡng loại outlier theo std deviation.'],

            // Streak (chỉ từ drill practice sessions).
            'streak.daily_goal' => [1, 'Số practice session/ngày để giữ streak.'],
            'streak.timezone' => ['Asia/Ho_Chi_Minh', 'Timezone dùng tính date_local.'],
            'streak.milestones' => [
                [['days' => 7, 'coins' => 100], ['days' => 14, 'coins' => 250], ['days' => 30, 'coins' => 500]],
                'Mốc thưởng xu khi đạt streak X ngày liên tục.',
            ],

            // Grading pipeline.
            'grading.max_retries' => [3, 'Số retry tối đa cho grading job.'],

            // Exam costs (xu).
            'exam.full_test_cost_coins' => [25, 'Xu/lần thi Full VSTEP (4 kỹ năng).'],
            'exam.custom_per_skill_coins' => [8, 'Xu/kỹ năng khi thi Custom VSTEP.'],

            // Support level costs (xu).
            'support.level_costs' => [
                ['1' => 1, '2' => 2],
                'Xu trừ mỗi lần bật support level trong drill.',
            ],

            // Onboarding bonus.
            'onboarding.initial_coins' => [100, 'Xu tặng khi tạo profile đầu tiên của account.'],
        ];

        foreach ($defaults as $key => [$value, $description]) {
            SystemConfig::set($key, $value, $description);
        }
    }
}
