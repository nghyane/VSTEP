<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'job_id', 'submission_type', 'submission_id', 'version', 'is_active',
    'rubric_scores', 'overall_band', 'strengths', 'improvements',
    'pronunciation_report', 'transcript',
])]
class SpeakingGradingResult extends BaseModel
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'rubric_scores' => 'array', 'strengths' => 'array',
            'improvements' => 'array', 'pronunciation_report' => 'array',
            'is_active' => 'boolean', 'overall_band' => 'float',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(GradingJob::class, 'job_id');
    }
}
