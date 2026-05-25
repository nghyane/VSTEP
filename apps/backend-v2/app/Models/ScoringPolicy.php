<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Scoring policy — cap rules and thresholds linked to a rubric.
 *
 * Rules are evaluated by RuleBasedScoringService at grading time.
 * Immutable reference data, versioned per rubric.
 */
#[Fillable(['rubric_id', 'version', 'name', 'rules', 'is_active'])]
class ScoringPolicy extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'rules' => 'array',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(GradingRubric::class, 'rubric_id');
    }
}
