<?php

declare(strict_types=1);

namespace App\Assessment\Scoring;

use App\Assessment\Data\CriterionScore;
use App\Assessment\Data\ScoreBag;
use InvalidArgumentException;

final readonly class WeightedOverallScorer
{
    public function __construct(
        private ScoreNormalizer $normalizer = new ScoreNormalizer,
        private ContentCapPolicy $contentCapPolicy = new ContentCapPolicy,
        private CalculationTraceBuilder $traceBuilder = new CalculationTraceBuilder,
    ) {}

    /**
     * @param  list<CriterionScore>  $criterionScores
     * @param  array<string,mixed>  $policy
     */
    public function score(array $criterionScores, array $policy = []): ScoreBag
    {
        if ($criterionScores === []) {
            throw new InvalidArgumentException('At least one criterion score is required.');
        }

        $totalWeight = array_sum(array_map(
            fn (CriterionScore $criterionScore): float => $criterionScore->weight,
            $criterionScores,
        ));

        if ($totalWeight <= 0.0) {
            throw new InvalidArgumentException('Total criterion weight must be greater than zero.');
        }

        $weightedScore = array_sum(array_map(
            fn (CriterionScore $criterionScore): float => $this->normalizer->clamp($criterionScore->score) * $criterionScore->weight,
            $criterionScores,
        ));
        $rawScore = $weightedScore / $totalWeight;
        $overallBand = $this->normalizer->halfBand($rawScore);

        $capped = $this->contentCapPolicy->apply($overallBand, $criterionScores, $policy);
        $overallBand = $capped['score'];
        $capsApplied = $capped['caps'];

        return new ScoreBag(
            criterionScores: $criterionScores,
            overallBand: $overallBand,
            capsApplied: $capsApplied,
            calculationTrace: $this->traceBuilder->build($criterionScores, $rawScore, $overallBand, $capsApplied),
        );
    }
}
