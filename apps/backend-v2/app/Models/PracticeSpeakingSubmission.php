<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'session_id',
    'profile_id',
    'task_ref_type',
    'task_ref_id',
    'audio_url',
    'duration_seconds',
    'transcript',
    'submitted_at',
])]
class PracticeSpeakingSubmission extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PracticeSession::class);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
