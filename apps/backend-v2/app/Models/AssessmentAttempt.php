<?php

declare(strict_types=1);

namespace App\Models;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'profile_id', 'rubric_id', 'skill', 'task_type', 'source_type', 'source_id',
    'prompt', 'response_payload', 'submitted_at',
])]
final class AssessmentAttempt extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => AssessmentSkill::class,
            'task_type' => AssessmentTaskType::class,
            'source_type' => AssessmentSourceType::class,
            'prompt' => 'array',
            'response_payload' => 'array',
            'submitted_at' => 'immutable_datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(AssessmentRubric::class, 'rubric_id');
    }

    public function job(): HasOne
    {
        return $this->hasOne(AssessmentJob::class, 'attempt_id');
    }

    public function evidence(): HasOne
    {
        return $this->hasOne(AssessmentEvidence::class, 'attempt_id');
    }

    public function result(): HasOne
    {
        return $this->hasOne(AssessmentResult::class, 'attempt_id');
    }
}
