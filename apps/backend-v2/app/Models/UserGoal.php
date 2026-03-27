<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VstepBand;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'target_band', 'current_estimated_band', 'deadline', 'daily_study_time_minutes'])]
class UserGoal extends BaseModel
{
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
}
