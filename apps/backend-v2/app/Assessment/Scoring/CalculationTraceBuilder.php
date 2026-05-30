<?php

declare(strict_types=1);

namespace App\Assessment\Scoring;

use App\Assessment\Data\CriterionScore;

final class CalculationTraceBuilder
{
    /**
     * @param  list<CriterionScore>  $criterionScores
     * @param  array<string,mixed>  $capsApplied
     * @return array<string,mixed>
     */
    public function build(array $criterionScores, float $rawScore, float $overallBand, array $capsApplied): array
    {
        return [
            'method' => 'weighted_average',
            'raw_score' => $rawScore,
            'overall_band' => $overallBand,
            'total_weight' => array_sum(array_map(
                fn (CriterionScore $criterionScore): float => $criterionScore->weight,
                $criterionScores,
            )),
            'criteria' => array_map(
                fn (CriterionScore $criterionScore): array => [
                    'key' => $criterionScore->key->value,
                    'score' => $criterionScore->score,
                    'weight' => $criterionScore->weight,
                    'weighted_score' => $criterionScore->score * $criterionScore->weight,
                ],
                $criterionScores,
            ),
            'caps_applied' => $capsApplied,
        ];
    }
}
