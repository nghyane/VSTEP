<?php

declare(strict_types=1);

namespace App\Models;

use App\Assessment\Enums\AssessmentJobStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'attempt_id', 'status', 'attempts', 'progress', 'last_error', 'started_at', 'completed_at',
])]
final class AssessmentJob extends BaseModel
{
    protected function casts(): array
    {
        return [
            'status' => AssessmentJobStatus::class,
            'attempts' => 'integer',
            'progress' => 'array',
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AssessmentAttempt::class, 'attempt_id');
    }
}
