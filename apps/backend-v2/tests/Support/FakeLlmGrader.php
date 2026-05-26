<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Models\GradingRubric;
use App\Services\Grading\LlmGrader;

/**
 * Test fake — bypass real LLM endpoint. Returns deterministic scores
 * so grading tests are reproducible without network or API quota.
 */
final class FakeLlmGrader implements LlmGrader
{
    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis, GradingRubric $rubric): array
    {
        return [
            'rubric_scores' => ['task_fulfillment' => 7.5, 'organization' => 7.5, 'vocabulary' => 7.5, 'grammar' => 7.5],
            'overall_band' => 7.5,
            'strengths' => ['Trả lời đúng yêu cầu đề bài'],
            'improvements' => [['message' => 'Dùng thêm từ nối', 'explanation' => 'Sử dụng however, moreover.']],
            'rewrites' => [],
            'annotations' => [],
        ];
    }

    public function gradeSpeaking(string $transcript, GradingRubric $rubric, ?array $pronunciationData = null): array
    {
        return [
            'rubric_scores' => ['grammar' => 7.5, 'vocabulary' => 7.5, 'pronunciation' => 7.5, 'fluency' => 7.5, 'discourse_management' => 7.5],
            'overall_band' => 7.5,
            'strengths' => ['Phát âm tự nhiên'],
            'improvements' => [['message' => 'Mở rộng từ vựng', 'explanation' => 'Sử dụng từ đồng nghĩa.']],
        ];
    }

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
            'strengths' => ['Trả lời đúng yêu cầu đề bài'],
            'improvements' => [['message' => 'Dùng thêm từ nối', 'explanation' => 'Sử dụng however, moreover.']],
            'rewrites' => [],
        ];
    }
}
