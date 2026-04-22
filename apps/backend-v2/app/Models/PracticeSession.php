<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Root session cho mọi drill (vocab/grammar/listening/reading/writing/speaking).
 * module quyết định attempt table nào map tới.
 */
#[Fillable([
    'profile_id',
    'module',
    'content_ref_type',
    'content_ref_id',
    'started_at',
    'ended_at',
    'duration_seconds',
    'support_levels_used',
])]
class PracticeSession extends BaseModel
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'support_levels_used' => 'array',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function contentRef(): MorphTo
    {
        return $this->morphTo('content_ref');
    }

    public function drillAttempts(): HasMany
    {
        return $this->hasMany(PracticeSpeakingDrillAttempt::class, 'session_id');
    }
}
