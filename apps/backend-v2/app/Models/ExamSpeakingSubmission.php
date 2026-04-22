<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Speaking submission trong exam session.
 * 1 submission → N grading results (versioning).
 */
#[Fillable([
    'session_id',
    'profile_id',
    'part_id',
    'audio_url',
    'duration_seconds',
    'transcript',
    'submitted_at',
])]
class ExamSpeakingSubmission extends BaseModel
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
        return $this->belongsTo(ExamSession::class);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function part(): BelongsTo
    {
        return $this->belongsTo(ExamVersionSpeakingPart::class, 'part_id');
    }
}
