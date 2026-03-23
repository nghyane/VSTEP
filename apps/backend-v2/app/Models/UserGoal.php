<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserGoal extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'target_band',
        'current_estimated_band',
        'deadline',
        'daily_study_time_minutes',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'daily_study_time_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
