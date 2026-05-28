<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface TaskFulfillmentAssessor
{
    /**
     * Assess how well the writing text fulfills task requirements.
     *
     * @param  list<string>  $requirements
     * @param  list<array<string,mixed>>  $grammarErrors
     * @param  array{metrics: array<string,mixed>, syntax: array|null, flags: list<string>}  $ruleAnalysis
     * @return array{points_covered: float, points_required: float, has_clear_position: bool, has_irrelevant_content: bool}
     */
    public function assess(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis, int $part = 2): array;
}
