<?php

declare(strict_types=1);

namespace App\Assessment\Services;

use App\Assessment\Contracts\AssessmentStrategy;
use App\Assessment\Enums\AssessmentTaskType;
use InvalidArgumentException;

final class StrategyRegistry
{
    /** @var array<string, AssessmentStrategy> */
    private array $strategies = [];

    /** @param iterable<AssessmentStrategy> $strategies */
    public function __construct(iterable $strategies = [])
    {
        foreach ($strategies as $strategy) {
            $this->strategies[$strategy->taskType()->value] = $strategy;
        }
    }

    public function for(AssessmentTaskType $taskType): AssessmentStrategy
    {
        return $this->strategies[$taskType->value]
            ?? throw new InvalidArgumentException("No assessment strategy registered for {$taskType->value}");
    }
}
