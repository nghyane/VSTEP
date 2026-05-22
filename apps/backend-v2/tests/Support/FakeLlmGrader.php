<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\Grading\LlmGrader;

/**
 * Test fake — bypass real LLM endpoint. Returns deterministic scores
 * so grading tests are reproducible without network or API quota.
 */
final class FakeLlmGrader implements LlmGrader
{
    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis): array
    {
        return [
            'rubric_scores' => ['task_achievement' => 3.0, 'coherence' => 3.0, 'lexical' => 3.0, 'grammar' => 3.0],
            'overall_band' => 7.5,
            'strengths' => ['Clear task response'],
            'improvements' => [['message' => 'More linking words', 'explanation' => 'Use however, moreover.']],
            'rewrites' => [],
            'annotations' => [],
        ];
    }

    public function gradeSpeaking(string $transcript): array
    {
        return [
            'rubric_scores' => ['fluency' => 3.0, 'pronunciation' => 3.0, 'content' => 3.0, 'vocab' => 3.0, 'grammar' => 3.0],
            'overall_band' => 7.5,
            'strengths' => ['Natural delivery'],
            'improvements' => [['message' => 'Expand vocabulary', 'explanation' => 'Use synonyms.']],
        ];
    }
}
