<?php

declare(strict_types=1);

namespace App\Assessment\Scoring;

final class ScoreNormalizer
{
    public function clamp(float $score): float
    {
        return max(0.0, min(10.0, $score));
    }

    public function halfBand(float $score): float
    {
        return round($this->clamp($score) * 2) / 2;
    }
}
