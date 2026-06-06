<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SystemConfig;

final class ProgressConfigService
{
    private const CHART_MIN_TESTS_KEY = 'chart.min_tests';

    private const CHART_SLIDING_WINDOW_SIZE_KEY = 'chart.sliding_window_size';

    private const CHART_STD_DEV_THRESHOLD_KEY = 'chart.std_dev_threshold';

    private const STREAK_DAILY_GOAL_KEY = 'streak.daily_goal';

    private const STREAK_TIMEZONE_KEY = 'streak.timezone';

    private const STREAK_MILESTONES_KEY = 'streak.milestones';

    /** @return array{min_tests:int, sliding_window_size:int, std_dev_threshold:float} */
    public function chartConfig(): array
    {
        return [
            'min_tests' => $this->requiredInt(self::CHART_MIN_TESTS_KEY, 1),
            'sliding_window_size' => $this->requiredInt(self::CHART_SLIDING_WINDOW_SIZE_KEY, 1),
            'std_dev_threshold' => $this->requiredFloat(self::CHART_STD_DEV_THRESHOLD_KEY, 0.0),
        ];
    }

    public function streakDailyGoal(): int
    {
        return $this->requiredInt(self::STREAK_DAILY_GOAL_KEY, 1);
    }

    public function streakTimezone(): string
    {
        $value = SystemConfig::get(self::STREAK_TIMEZONE_KEY);
        if (! is_string($value) || trim($value) === '') {
            throw new \RuntimeException('Missing or invalid system config: '.self::STREAK_TIMEZONE_KEY.'.');
        }

        return trim($value);
    }

    /** @return array<int, array{days:int, coins:int}> */
    public function streakMilestones(): array
    {
        $raw = SystemConfig::get(self::STREAK_MILESTONES_KEY);
        if (! is_array($raw)) {
            throw new \RuntimeException('Missing or invalid system config: '.self::STREAK_MILESTONES_KEY.'.');
        }

        return collect($raw)
            ->map(fn ($m) => ['days' => (int) ($m['days'] ?? 0), 'coins' => (int) ($m['coins'] ?? 0)])
            ->filter(fn ($m) => $m['days'] > 0 && $m['coins'] > 0)
            ->sortBy('days')
            ->values()
            ->all();
    }

    private function requiredInt(string $key, int $min): int
    {
        $value = SystemConfig::get($key);
        if (! is_int($value) || $value < $min) {
            throw new \RuntimeException("Missing or invalid system config: {$key}.");
        }

        return $value;
    }

    private function requiredFloat(string $key, float $min): float
    {
        $value = SystemConfig::get($key);
        if ((! is_int($value) && ! is_float($value)) || $value < $min) {
            throw new \RuntimeException("Missing or invalid system config: {$key}.");
        }

        return (float) $value;
    }
}
