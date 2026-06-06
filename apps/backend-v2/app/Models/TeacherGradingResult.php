<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'request_id',
    'attempt_id',
    'teacher_id',
    'rubric_id',
    'criterion_scores',
    'overall_band',
    'feedback',
    'calculation_trace',
    'ai_result_snapshot',
    'submitted_at',
])]
class TeacherGradingResult extends BaseModel
{
    protected function casts(): array
    {
        return [
            'criterion_scores' => 'array',
            'overall_band' => 'float',
            'feedback' => 'array',
            'calculation_trace' => 'array',
            'ai_result_snapshot' => 'array',
            'submitted_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(TeacherGradingRequest::class, 'request_id');
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AssessmentAttempt::class, 'attempt_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(AssessmentRubric::class, 'rubric_id');
    }
}
