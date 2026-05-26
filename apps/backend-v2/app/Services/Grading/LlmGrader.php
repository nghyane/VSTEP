<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;

interface LlmGrader
{
    /**
     * @param  array<int,array<string,mixed>>  $grammarErrors
     * @param  array{metrics: array<string,mixed>, flags: list<string>}  $ruleAnalysis
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>, rewrites: list<array<string,mixed>>, annotations: list<array<string,mixed>>}
     */
    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis, GradingRubric $rubric): array;

    /**
     * @param  array{accuracy_score?: int}|null  $pronunciationData  STT confidence data
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>}
     */
    public function gradeSpeaking(string $transcript, GradingRubric $rubric, ?array $pronunciationData = null): array;

    /**
     * Extract structured evidence from writing — LLM observes, formula scores.
     *
     * @param  list<string>  $requirements  Task-specific requirements to check
     * @param  array{metrics: array<string,mixed>, syntax: array, flags: list<string>}  $ruleAnalysis
     * @return array{evidence: array, strengths: list<string>, improvements: list<array>, rewrites: list<array>}
     */
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis): array;
}
