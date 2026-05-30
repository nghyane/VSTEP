<?php

declare(strict_types=1);

namespace App\Assessment\Data;

use App\Assessment\Enums\CriterionKey;

final readonly class CriterionScore
{
    /** @param array<string,mixed> $evidenceUsed, $trace */
    public function __construct(
        public CriterionKey $key,
        public float $score,
        public float $weight,
        public array $evidenceUsed = [],
        public array $trace = [],
    ) {}
}
