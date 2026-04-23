<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

#[Fillable([
    'profile_id',
    'date_local',
    'active',
])]
class ProfileStreakLog extends Model
{
    use HasFactory;

    protected $table = 'profile_streak_logs';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected function casts(): array
    {
        return [
            'date_local' => 'date',
            'active' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    /**
     * Mark today as active. Creates the log record if it doesn't exist,
     * then updates ProfileStreakState accordingly.
     */
    public static function recordActivity(string $profileId): void
    {
        $today = Carbon::today();
        $todayStr = $today->toDateString();

        // Upsert streak log
        DB::table('profile_streak_logs')->updateOrInsert(
            [
                'profile_id' => $profileId,
                'date_local' => $todayStr,
            ],
            [
                'active' => true,
                'created_at' => now(),
            ],
        );

        // Update streak state
        $streakState = ProfileStreakState::where('profile_id', $profileId)->first();

        if ($streakState === null) {
            // First time ever — create state
            ProfileStreakState::create([
                'profile_id' => $profileId,
                'current_streak' => 1,
                'longest_streak' => 1,
                'last_active_date_local' => $todayStr,
            ]);

            return;
        }

        $lastActive = $streakState->last_active_date_local !== null
            ? Carbon::parse($streakState->last_active_date_local)
            : null;

        if ($lastActive === null || $lastActive->lt($today)) {
            // Last active was before today — calculate streak
            if ($lastActive !== null && $lastActive->eq($today->copy()->subDay())) {
                // Consecutive day — increment
                $streakState->current_streak++;
            } else {
                // Gap > 1 day — reset
                $streakState->current_streak = 1;
            }

            $streakState->longest_streak = max($streakState->longest_streak, $streakState->current_streak);
            $streakState->last_active_date_local = $todayStr;
            $streakState->save();
        }
        // If last_active == today, already recorded — no-op
    }
}
