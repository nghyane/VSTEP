<?php

declare(strict_types=1);

namespace App\Assessment\Services;

use App\Assessment\Contracts\AssessmentStrategy;
use App\Assessment\Enums\AssessmentTaskType;
use App\Services\Grading\RubricResolver;
use App\Services\Grading\SpeakingScoringFormula;
use App\Services\Grading\WritingScoringFormula;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

final class AssessmentManager
{
    /** @param array<string, class-string<AssessmentStrategy>> $strategyClasses */
    public function __construct(
        private readonly Container $container,
        private readonly RubricResolver $rubricResolver,
        private readonly array $strategyClasses,
    ) {}

    public function strategy(AssessmentTaskType $taskType): AssessmentStrategy
    {
        $strategyClass = $this->strategyClasses[$taskType->value]
            ?? throw new InvalidArgumentException("No assessment strategy registered for {$taskType->value}");

        $strategy = $this->container->make($strategyClass);

        if (! $strategy instanceof AssessmentStrategy) {
            throw new InvalidArgumentException("Assessment strategy {$strategyClass} is invalid.");
        }

        return $strategy;
    }

    public function writingFormula(): WritingScoringFormula
    {
        return new WritingScoringFormula($this->rubricResolver->active('writing'));
    }

    public function speakingFormula(): SpeakingScoringFormula
    {
        return new SpeakingScoringFormula($this->rubricResolver);
    }
}
