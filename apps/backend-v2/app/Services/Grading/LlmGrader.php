<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;

interface LlmGrader
{
    /**
     * @param  array<int,array<string,mixed>>  $grammarErrors
     * @param  array{caps: array<string,float|null>, metrics: array<string,mixed>, flags: list<string>}  $ruleAnalysis
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>, rewrites: list<array<string,mixed>>, annotations: list<array<string,mixed>>}
     */
    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis, GradingRubric $rubric): array;

    /**
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>}
     */
    public function gradeSpeaking(string $transcript, GradingRubric $rubric): array;
}
