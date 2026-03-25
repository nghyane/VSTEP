<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VstepBand;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'target_band', 'current_estimated_band', 'deadline', 'daily_study_time_minutes'])]
class UserGoal extends BaseModel
{
    protected $appends = ['days_remaining', 'achieved', 'on_track'];

    protected function casts(): array
    {
        return [
            'target_band' => VstepBand::class,
            'current_estimated_band' => VstepBand::class,
            'deadline' => 'date',
            'daily_study_time_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function daysRemaining(): Attribute
    {
        return Attribute::get(fn () => $this->deadline
            ? max(0, (int) now()->diffInDays($this->deadline, false))
            : null);
    }

    /**
     * True when all 4 skills have reached the target band's minimum level.
     */
    protected function achieved(): Attribute
    {
        return Attribute::get(function () {
            if (! $this->target_band) {
                return false;
            }

            $minLevel = $this->target_band->minLevel();
            $skills = UserProgress::where('user_id', $this->user_id)->get();

            if ($skills->count() < 4) {
                return false;
            }

            return $skills->every(
                fn (UserProgress $p) => $p->current_level->score() >= $minLevel->score(),
            );
        });
    }

    /**
     * null = no deadline, true = progressing + time left, false = behind or expired.
     */
    protected function onTrack(): Attribute
    {
        return Attribute::get(function () {
            if ($this->days_remaining === null) {
                return null;
            }

            if ($this->days_remaining === 0) {
                return false;
            }

            if (! $this->target_band) {
                return null;
            }

            $minLevel = $this->target_band->minLevel();
            $skills = UserProgress::where('user_id', $this->user_id)->get();

            if ($skills->isEmpty()) {
                return false;
            }

            $totalGap = $skills->sum(
                fn (UserProgress $p) => max(0, $minLevel->score() - $p->current_level->score()),
            );

            return $totalGap === 0 || $this->days_remaining > $totalGap * 7;
        });
    }
}
