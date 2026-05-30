<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Writing submission trong exam session.
 */
#[Fillable([
    'session_id',
    'profile_id',
    'task_id',
    'text',
    'word_count',
    'submitted_at',
])]
class ExamWritingSubmission extends BaseModel
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

    public function task(): BelongsTo
    {
        return $this->belongsTo(ExamVersionWritingTask::class, 'task_id');
    }

    public function assessmentAttempt(): HasOne
    {
        return $this->hasOne(AssessmentAttempt::class, 'source_id')
            ->where('source_type', 'exam');
    }
}
