<?php

declare(strict_types=1);

namespace App\Models;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentTaskType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'skill', 'task_type', 'version', 'title', 'criteria', 'evidence_schema',
    'scoring_policy', 'is_active', 'effective_from',
])]
final class AssessmentRubric extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => AssessmentSkill::class,
            'task_type' => AssessmentTaskType::class,
            'version' => 'integer',
            'criteria' => 'array',
            'evidence_schema' => 'array',
            'scoring_policy' => 'array',
            'is_active' => 'boolean',
            'effective_from' => 'immutable_datetime',
        ];
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AssessmentAttempt::class, 'rubric_id');
    }
}
