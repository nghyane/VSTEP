<?php

declare(strict_types=1);

namespace App\Models;

use App\DTOs\Grading\Params\DiscourseParams;
use App\DTOs\Grading\Params\FluencyParams;
use App\DTOs\Grading\Params\GrammarParams;
use App\DTOs\Grading\Params\OrganizationParams;
use App\DTOs\Grading\Params\PronunciationParams;
use App\DTOs\Grading\Params\TaskFulfillmentParams;
use App\DTOs\Grading\Params\VocabularyParams;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Immutable grading rubric — reference data from Bo GD&DT.
 *
 * One active rubric per skill at any time. Criteria contain band descriptors
 * and formula parameters. Typed accessors parse DB JSON into DTOs for
 * type-safe consumption by scoring formulas.
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

    /** @return list<string> */
    public function criteriaKeys(): array
    {
        return array_column($this->criteria, 'key');
    }

    /** @return array<string,mixed> */
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

    /** @param  array<string,float>  $scores */
    public function computeOverallBand(array $scores): float
    {
        $weightedSum = 0.0;
        $totalWeight = 0.0;

        foreach ($this->criteria as $criterion) {
            $key = $criterion['key'] ?? '';
            $weight = (float) ($criterion['weight'] ?? 1.0);

            if (isset($scores[$key])) {
                $normalized = $scores[$key] / 10; // scale to 0–1
                $weightedSum += $normalized * $weight;
                $totalWeight += $weight;
            }
        }

        if ($totalWeight <= 0) {
            return 5.0;
        }

        $raw = ($weightedSum / $totalWeight) * 10;

        return round($raw * 2) / 2;
    }

    // ── Typed param accessors ──────────────────────────────────────

    public function taskFulfillmentParams(): TaskFulfillmentParams
    {
        return TaskFulfillmentParams::fromArray($this->criterionParams('task_fulfillment'));
    }

    public function organizationParams(): OrganizationParams
    {
        return OrganizationParams::fromArray($this->criterionParams('organization'));
    }

    public function grammarParams(): GrammarParams
    {
        return GrammarParams::fromArray($this->criterionParams('grammar'));
    }

    public function vocabularyParams(): VocabularyParams
    {
        return VocabularyParams::fromArray($this->criterionParams('vocabulary'));
    }

    public function fluencyParams(): FluencyParams
    {
        return FluencyParams::fromArray($this->criterionParams('fluency'));
    }

    public function discourseParams(): DiscourseParams
    {
        return DiscourseParams::fromArray($this->criterionParams('discourse_management'));
    }

    public function pronunciationParams(): PronunciationParams
    {
        return PronunciationParams::fromArray($this->criterionParams('pronunciation'));
    }

    /** @return array<string,mixed> */
    private function criterionParams(string $key): array
    {
        foreach ($this->criteria as $criterion) {
            if (($criterion['key'] ?? '') === $key) {
                return $criterion['params'] ?? [];
            }
        }

        return [];
    }

    /**
     * Get sub-signal params for a criterion (e.g., spelling under vocabulary).
     *
     * @return array<string,mixed>
     */
    public function subSignalParams(string $criterionKey, string $signalKey): array
    {
        $params = $this->criterionParams($criterionKey);

        return $params['sub_signals'][$signalKey] ?? [];
    }
}
