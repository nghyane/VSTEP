<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\Grading\LlmGrader;

/**
 * Test fake — bypass real LLM endpoint. Returns deterministic evidence + feedback.
 */
final class FakeLlmGrader implements LlmGrader
{
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis, int $part = 2): array
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
        ];
    }

    public function generateFeedback(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null): array
    {
        return [
            'strengths' => ['Tra loi dung yeu cau de bai'],
            'improvements' => ['Dung them tu noi'],
            'rewrites' => [],
        ];
    }
}
