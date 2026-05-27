<?php

declare(strict_types=1);

namespace App\Services\Grading;

interface LlmGrader
{
    /**
     * Extract task fulfillment evidence ONLY (fast — requirements check).
     *
     * @param  list<string>                              $requirements
     * @param  list<array<string,mixed>>                 $grammarErrors
     * @param  array{metrics: array<string,mixed>, syntax: array, flags: list<string>}  $ruleAnalysis
     * @return array{evidence: array}
     */
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis): array;

    /**
     * Generate feedback: strengths, improvements, rewrites (slower — requires Vietnamese output).
     *
     * @param  array{current: string, target: string}|null  $bandContext
     * @return array{strengths: list<string>, improvements: list<string>, rewrites: list<string>}
     */
    public function generateFeedback(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null): array;
}
