<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

#[Fillable([
    'profile_id', 'date_local', 'drill_session_count', 'drill_duration_seconds',
    'mcq_count', 'mcq_correct_count', 'reading_exercise_count',
    'listening_exercise_count', 'writing_submission_count',
    'speaking_submission_count', 'vocab_review_count', 'exam_session_count',
    'total_duration_seconds', 'coins_earned', 'coins_spent',
])]
class ProfileDailyActivity extends Model
{
    use HasFactory;

    protected $table = 'profile_daily_activity';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected function casts(): array
    {
        return ['date_local' => 'date', 'updated_at' => 'datetime'];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public const ACTIVITY_TYPES = [
        'mcq' => ['count' => 'mcq_count'],
        'reading' => ['count' => 'reading_exercise_count'],
        'listening' => ['count' => 'listening_exercise_count'],
        'writing' => ['count' => 'writing_submission_count'],
        'speaking_drill' => ['count' => 'drill_session_count', 'duration' => 'drill_duration_seconds'],
        'speaking_submission' => ['count' => 'speaking_submission_count'],
        'vocab_review' => ['count' => 'vocab_review_count'],
        'exam_session' => ['count' => 'exam_session_count'],
    ];

    public static function addActivity(
        string $profileId, string $activityType,
        int $count = 1, int $durationSeconds = 0, int $coinsEarned = 0,
    ): void {
        $typeConfig = self::ACTIVITY_TYPES[$activityType]
            ?? throw new \InvalidArgumentException("Unknown activity type: {$activityType}");
        $date = self::todayLocalDate();
        $query = self::query()->where('profile_id', $profileId)->where('date_local', $date);

        if (! $query->exists()) {
            self::query()->insert([
                'profile_id' => $profileId, 'date_local' => $date,
                $typeConfig['count'] => $count,
                'total_duration_seconds' => $durationSeconds,
                'coins_earned' => $coinsEarned, 'updated_at' => now(),
                ...(isset($typeConfig['duration']) ? [$typeConfig['duration'] => $durationSeconds] : []),
            ]);

            return;
        }

        $increments = [$typeConfig['count'] => $count, 'total_duration_seconds' => $durationSeconds, 'coins_earned' => $coinsEarned];
        if (isset($typeConfig['duration'])) {
            $increments[$typeConfig['duration']] = $durationSeconds;
        }
        $query->incrementEach($increments, ['updated_at' => now()]);
    }

    public static function trackSpending(string $profileId, int $coinsSpent): void
    {
        $date = self::todayLocalDate();
        $query = self::query()->where('profile_id', $profileId)->where('date_local', $date);
        if (! $query->exists()) {
            self::query()->insert(['profile_id' => $profileId, 'date_local' => $date, 'coins_spent' => $coinsSpent, 'updated_at' => now()]);

            return;
        }
        $query->incrementEach(['coins_spent' => $coinsSpent], ['updated_at' => now()]);
    }

    private static function todayLocalDate(): string
    {
        $timezone = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';

        return Carbon::now($timezone)->toDateString();
    }
}
