<?php

declare(strict_types=1);

namespace App\Services\Grading;

interface LlmGrader
{
    /**
     * Extract structured evidence from text — LLM observes, formula scores.
     *
     * LLM does NOT assign scores. It counts observable facts:
     *   - requirements_met / requirements_total
     *   - has_clear_position (boolean)
     *   - has_irrelevant_content (boolean)
     *
     * Formula computes scores deterministically from evidence + objective metrics.
     *
     * @param  list<string>                              $requirements   Task requirements to check
     * @param  list<array<string,mixed>>                 $grammarErrors  LanguageTool matches (empty for speaking)
     * @param  array{metrics: array<string,mixed>, syntax: array, flags: list<string>}  $ruleAnalysis
     * @return array{evidence: array, strengths: list<string>, improvements: list<array>, rewrites: list<array>}
     */
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis): array;
}
