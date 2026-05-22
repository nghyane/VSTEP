<?php

declare(strict_types=1);

namespace App\Services\Grading;

final class GradingStrategyResolver
{
    /**
     * @param  list<GradingStrategy>  $strategies
     */
    public function __construct(private readonly array $strategies) {}

    public function for(string $submissionType): GradingStrategy
    {
        foreach ($this->strategies as $strategy) {
            if (in_array($submissionType, $strategy->supports(), true)) {
                return $strategy;
            }
        }

        throw new \InvalidArgumentException("No grading strategy registered for submission type: {$submissionType}");
    }
}
