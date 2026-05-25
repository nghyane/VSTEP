<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Immutable grading rubric — reference data from Bộ GD&ĐT.
 *
 * One active rubric per skill at any time (partial unique index).
 * Criteria contain band descriptors used to render LLM prompts
 * and validate structured output keys.
 */
#[Fillable([
    'skill', 'version', 'name', 'source_reference',
    'criteria', 'scoring_formula', 'is_active', 'effective_from',
])]
class GradingRubric extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'criteria' => 'array',
            'is_active' => 'boolean',
            'effective_from' => 'date',
            'created_at' => 'datetime',
        ];
    }

    public function policies(): HasMany
    {
        return $this->hasMany(ScoringPolicy::class, 'rubric_id');
    }

    public function activePolicy(): HasOne
    {
        return $this->hasOne(ScoringPolicy::class, 'rubric_id')
            ->where('is_active', true);
    }

    /**
     * Criteria keys for this rubric (e.g. ['task_achievement', 'coherence', ...]).
     *
     * @return list<string>
     */
    public function criteriaKeys(): array
    {
        return array_column($this->criteria, 'key');
    }

    /**
     * Build JSON schema for LLM structured output from criteria.
     *
     * @return array<string,mixed>
     */
    public function toRubricScoresSchema(): array
    {
        $properties = [];
        foreach ($this->criteria as $criterion) {
            $properties[$criterion['key']] = ['type' => 'number'];
        }

        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => $this->criteriaKeys(),
            'additionalProperties' => false,
        ];
    }

    /**
     * Compute overall band from rubric scores using this rubric's formula.
     *
     * @param  array<string,float>  $scores
     */
    public function computeOverallBand(array $scores): float
    {
        $maxPossible = array_sum(array_column($this->criteria, 'max_score'));
        if ($maxPossible <= 0) {
            return 5.0;
        }

        $raw = (array_sum($scores) / $maxPossible) * 10;

        return round($raw * 2) / 2;
    }
}
