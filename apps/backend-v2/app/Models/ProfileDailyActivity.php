<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

#[Fillable([
    'profile_id',
    'date_local',
    'drill_session_count',
    'drill_duration_seconds',
    'mcq_count',
    'mcq_correct_count',
    'reading_exercise_count',
    'listening_exercise_count',
    'writing_submission_count',
    'speaking_submission_count',
    'vocab_review_count',
    'exam_session_count',
    'total_duration_seconds',
    'coins_earned',
    'coins_spent',
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

    /**
     * Activity types hợp lệ khi gọi increment().
     * Map: type → [count_column, duration_column?]
     */
    public const ACTIVITY_TYPES = [
        'mcq' => ['count' => 'mcq_count'],
        'reading' => ['count' => 'reading_exercise_count'],
        'listening' => ['count' => 'listening_exercise_count'],
        'writing' => ['count' => 'writing_submission_count'],
        'speaking_drill' => ['count' => 'speaking_drill_session_count', 'duration' => 'speaking_drill_duration_seconds'],
        'speaking_submission' => ['count' => 'speaking_submission_count'],
        'vocab_review' => ['count' => 'vocab_review_count'],
        'exam_session' => ['count' => 'exam_session_count'],
    ];

    /**
     * Atomic increment cho daily activity row của (profile_id, date_local).
     * Upsert nếu row chưa tồn tại.
     */
    public static function addActivity(
        string $profileId,
        string $activityType,
        int $count = 1,
        int $durationSeconds = 0,
        int $coinsEarned = 0,
    ): void {
        $typeConfig = self::ACTIVITY_TYPES[$activityType]
            ?? throw new \InvalidArgumentException("Unknown activity type: {$activityType}");

        $date = Carbon::now()->toDateString();

        // Try atomic increment on existing row
        $affected = DB::table('profile_daily_activity')
            ->where('profile_id', $profileId)
            ->where('date_local', $date)
            ->increment($typeConfig['count'], $count);

        // If row didn't exist, insert it
        if ($affected === 0) {
            DB::table('profile_daily_activity')->insert([
                'profile_id' => $profileId,
                'date_local' => $date,
                $typeConfig['count'] => $count,
                'total_duration_seconds' => $durationSeconds,
                'coins_earned' => $coinsEarned,
                'updated_at' => now(),
                ...(isset($typeConfig['duration'])
                    ? [$typeConfig['duration'] => $durationSeconds]
                    : []),
            ]);
        } else {
            // Update duration, coins, timestamp for existing row
            DB::table('profile_daily_activity')
                ->where('profile_id', $profileId)
                ->where('date_local', $date)
                ->update([
                    'total_duration_seconds' => DB::raw("total_duration_seconds + {$durationSeconds}"),
                    'coins_earned' => DB::raw("coins_earned + {$coinsEarned}"),
                    'updated_at' => now(),
                    ...(isset($typeConfig['duration'])
                        ? [$typeConfig['duration'] => DB::raw("{$typeConfig['duration']} + {$durationSeconds}")]
                        : []),
                ]);
        }
    }

    /**
     * Track spending (xu tiêu) cho ngày hiện tại.
     */
    public static function trackSpending(string $profileId, int $coinsSpent): void
    {
        $date = Carbon::now()->toDateString();

        $affected = DB::table('profile_daily_activity')
            ->where('profile_id', $profileId)
            ->where('date_local', $date)
            ->increment('coins_spent', $coinsSpent);

        if ($affected === 0) {
            DB::table('profile_daily_activity')->insert([
                'profile_id' => $profileId,
                'date_local' => $date,
                'coins_spent' => $coinsSpent,
                'updated_at' => now(),
            ]);
        }
    }
}
