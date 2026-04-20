<?php

declare(strict_types=1);

namespace App\Srs;

/**
 * SRS config — port rút gọn của Anki default.
 * Reference: FE src/lib/srs/defaults.ts + Anki rslib.
 *
 * Unit:
 * - learningSteps/relearningSteps: phút
 * - graduatingInterval*: ngày
 */
final class SrsConfig
{
    /**
     * @param  array<int,int>  $learningSteps
     * @param  array<int,int>  $relearningSteps
     */
    public function __construct(
        public readonly array $learningSteps = [1, 10],
        public readonly array $relearningSteps = [10],
        public readonly int $graduatingIntervalGood = 1,
        public readonly int $graduatingIntervalEasy = 4,
        public readonly float $initialEaseFactor = 2.5,
        public readonly float $minEaseFactor = 1.3,
        public readonly float $easeDeltaAgain = -0.2,
        public readonly float $easeDeltaHard = -0.15,
        public readonly float $easeDeltaEasy = 0.15,
        public readonly float $hardMultiplier = 1.2,
        public readonly float $easyMultiplier = 1.3,
        public readonly float $intervalMultiplier = 1.0,
        public readonly int $maxReviewIntervalDays = 36500,
        public readonly float $lapseMultiplier = 0.0,
        public readonly int $minLapseIntervalDays = 1,
    ) {}

    public static function default(): self
    {
        return new self;
    }
}
