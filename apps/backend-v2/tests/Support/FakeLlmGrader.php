<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\Grading\LlmGrader;

/**
 * Test fake — bypass real LLM endpoint. Returns deterministic evidence
 * so grading tests are reproducible without network or API quota.
 */
final class FakeLlmGrader implements LlmGrader
{
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis): array
    {
        return [
            'evidence' => [
                'task_fulfillment' => [
                    'points_covered' => 3,
                    'points_required' => 3,
                    'has_clear_position' => true,
                    'has_irrelevant_content' => false,
                ],
            ],
            'strengths' => ['Tra loi dung yeu cau de bai'],
            'improvements' => [['message' => 'Dung them tu noi', 'explanation' => 'Su dung however, moreover.']],
            'rewrites' => [],
        ];
    }
}
