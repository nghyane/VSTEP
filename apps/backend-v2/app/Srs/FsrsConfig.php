<?php

declare(strict_types=1);

namespace App\Srs;

/**
 * FSRS v6 configuration + Anki-style learning steps.
 *
 * w[0..20]: FSRS weights
 * learningSteps/relearningSteps: minutes (Anki scheduling layer)
 */
final class FsrsConfig
{
    /**
     * @param  array<int,float>  $w  21 weights
     * @param  array<int,int>  $learningSteps  minutes
     * @param  array<int,int>  $relearningSteps  minutes
     */
    public function __construct(
        public readonly array $w = [
            0.212, 1.2931, 2.3065, 8.2956,
            6.4133, 0.8334, 3.0194, 0.001,
            1.8722, 0.1666, 0.796, 1.4835,
            0.0614, 0.2629, 1.6483, 0.6014,
            1.8729, 0.5425, 0.0912, 0.0658,
            0.1542,
        ],
        public readonly float $desiredRetention = 0.9,
        public readonly int $maxInterval = 36500,
        public readonly array $learningSteps = [1, 10],
        public readonly array $relearningSteps = [10],
    ) {}

    public static function default(): self
    {
        return new self;
    }
}
