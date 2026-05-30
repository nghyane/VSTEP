<?php

declare(strict_types=1);

namespace App\Assessment\Data;

final readonly class ScoreBag
{
    /**
     * @param  list<CriterionScore>  $criterionScores
     * @param  array<string,mixed>  $capsApplied
     * @param  array<string,mixed>  $calculationTrace
     */
    public function __construct(
        public array $criterionScores,
        public float $overallBand,
        public array $capsApplied = [],
        public array $calculationTrace = [],
    ) {}
}
