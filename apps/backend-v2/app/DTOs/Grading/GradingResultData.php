<?php

declare(strict_types=1);

namespace App\DTOs\Grading;

/**
 * Base grading result data. Each strategy emits a concrete subclass with
 * skill-specific fields. Service layer treats this as opaque — only the
 * persistResult() of strategy knows how to store it.
 */
abstract class GradingResultData
{
    /**
     * @param  array<string,float>  $rubricScores
     * @param  array<int,string>  $strengths
     * @param  array<int,array{message:string,explanation:string}>  $improvements
     */
    public function __construct(
        public readonly array $rubricScores,
        public readonly float $overallBand,
        public readonly array $strengths,
        public readonly array $improvements,
        public readonly ?string $rubricId = null,
    ) {}

    /**
     * Map to model attributes for persist. Subclass adds skill-specific fields.
     *
     * @return array<string,mixed>
     */
    abstract public function toModelAttributes(): array;
}
