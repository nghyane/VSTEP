<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Schema registry cho từng system_config key.
 *
 * Mục đích: BE là source-of-truth cho kiểu/option/giới hạn của từng config.
 * Trả về client để render editor phù hợp (Select, list editor, number...)
 * thay vì raw JSON; đồng thời validate input ở UpdateSystemConfigRequest.
 *
 * Type hỗ trợ:
 * - number   { min?, max?, integer? }
 * - string   { }
 * - boolean  { }
 * - timezone { options: string[] }              // IANA tz
 * - milestones { item: ['days','coins'] }       // array<{days:int, coins:int}>
 * - level_costs { }                             // object<string,int>  (level => coins)
 *
 * Key không khai báo schema → fallback 'auto' (UI dùng JSON editor như hiện tại).
 */
final class SystemConfigSchemas
{
    /**
     * @return array<string,mixed>
     */
    public static function for(string $key): array
    {
        return self::map()[$key] ?? ['type' => 'auto'];
    }

    /**
     * @return array<string, array<string,mixed>>
     */
    private static function map(): array
    {
        return [
            'chart.min_tests' => ['type' => 'number', 'min' => 1, 'max' => 100, 'integer' => true],
            'chart.sliding_window_size' => ['type' => 'number', 'min' => 1, 'max' => 200, 'integer' => true],
            'chart.std_dev_threshold' => ['type' => 'number', 'min' => 0, 'max' => 10],

            'streak.daily_goal' => ['type' => 'number', 'min' => 1, 'max' => 20, 'integer' => true],
            'streak.timezone' => ['type' => 'timezone', 'options' => self::timezones()],
            'streak.milestones' => ['type' => 'milestones'],

            'grading.max_retries' => ['type' => 'number', 'min' => 0, 'max' => 10, 'integer' => true],

            'exam.full_test_cost_coins' => ['type' => 'number', 'min' => 0, 'max' => 10000, 'integer' => true],
            'exam.custom_per_skill_coins' => ['type' => 'number', 'min' => 0, 'max' => 10000, 'integer' => true],
            'practice.feedback_cost_coins' => ['type' => 'number', 'min' => 1, 'max' => 10000, 'integer' => true],
            'teacher_grading.request_cost_coins' => ['type' => 'number', 'min' => 1, 'max' => 10000, 'integer' => true],

            'onboarding.initial_coins' => ['type' => 'number', 'min' => 0, 'max' => 100000, 'integer' => true],

            'profile.max_profiles_per_account' => ['type' => 'number', 'min' => 1, 'max' => 20, 'integer' => true],

            'support.zalo_phone' => ['type' => 'string'],
        ];
    }

    /**
     * Danh sách timezone phổ biến cho admin chọn.
     *
     * @return string[]
     */
    public static function timezones(): array
    {
        return [
            'Asia/Ho_Chi_Minh',
            'Asia/Bangkok',
            'Asia/Singapore',
            'Asia/Jakarta',
            'Asia/Manila',
            'Asia/Tokyo',
            'Asia/Seoul',
            'Asia/Shanghai',
            'Asia/Hong_Kong',
            'Asia/Taipei',
            'Asia/Kuala_Lumpur',
            'Australia/Sydney',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'America/New_York',
            'America/Los_Angeles',
            'UTC',
        ];
    }
}
