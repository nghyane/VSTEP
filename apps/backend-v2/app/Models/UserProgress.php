<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProgress extends Model
{
    use HasUuids;

    protected $table = 'user_progress';

    protected $fillable = [
        'user_id',
        'skill',
        'current_level',
        'target_level',
        'scaffold_level',
        'streak_count',
        'streak_direction',
        'attempt_count',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
