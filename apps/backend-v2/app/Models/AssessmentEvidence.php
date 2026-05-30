<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'attempt_id', 'rubric_id', 'signals', 'evidence', 'validation', 'extraction_trace',
])]
final class AssessmentEvidence extends BaseModel
{
    protected function casts(): array
    {
        return [
            'signals' => 'array',
            'evidence' => 'array',
            'validation' => 'array',
            'extraction_trace' => 'array',
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
