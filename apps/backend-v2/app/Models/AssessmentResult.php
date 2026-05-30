<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'attempt_id', 'rubric_id', 'criterion_scores', 'overall_band', 'caps_applied',
    'calculation_trace', 'insights', 'feedback',
])]
final class AssessmentResult extends BaseModel
{
    protected function casts(): array
    {
        return [
            'criterion_scores' => 'array',
            'overall_band' => 'float',
            'caps_applied' => 'array',
            'calculation_trace' => 'array',
            'insights' => 'array',
            'feedback' => 'array',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AssessmentAttempt::class, 'attempt_id');
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(AssessmentRubric::class, 'rubric_id');
    }
}
