<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Data\CriterionScore;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\SignalBag;

interface CriterionScorer
{
    /** @param array<string,mixed> $policy */
    public function score(EvidenceBag $evidence, SignalBag $signals, array $policy): CriterionScore;
}
