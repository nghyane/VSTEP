<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Ai\AiClient;
use App\Services\Grading\LlmGradingService;
use Tests\TestCase;

/**
 * LlmGradingService unit tests — no database, uses inline FakeAiClient.
 */
final class LlmGradingServiceTest extends TestCase
{
    private LlmGradingService $grader;

    protected function setUp(): void
    {
        parent::setUp();
        $this->grader = new LlmGradingService($this->makeFakeAi());
    }

    /** extractEvidence returns evidence only (no feedback). */
    public function test_extract_evidence_returns_structured_output(): void
    {
        $result = $this->grader->extractEvidence(
            text: 'I like reading books because it helps me relax.',
            promptText: 'Write about your hobby.',
            requirements: ['State your hobby', 'Give a reason'],
            grammarErrors: [],
            ruleAnalysis: $this->fakeRuleAnalysis(),
        );

        $this->assertArrayHasKey('evidence', $result);
        $this->assertArrayHasKey('task_fulfillment', $result['evidence']);
        $this->assertArrayHasKey('points_covered', $result['evidence']['task_fulfillment']);
        $this->assertArrayHasKey('points_required', $result['evidence']['task_fulfillment']);
    }

    /** evidence met <= total. */
    public function test_extract_evidence_met_not_exceed_total(): void
    {
        $result = $this->grader->extractEvidence(
            text: 'I like books.',
            promptText: 'Write.',
            requirements: ['Req 1', 'Req 2'],
            grammarErrors: [],
            ruleAnalysis: $this->fakeRuleAnalysis(),
        );

        $covered = $result['evidence']['task_fulfillment']['points_covered'];
        $required = $result['evidence']['task_fulfillment']['points_required'];

        $this->assertLessThanOrEqual($required, $covered);
    }

    /** LLM returns empty -> values fallback to 0/1/false. */
    public function test_extract_evidence_fallback_on_empty_llm_output(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [];
            }

        };

        $grader = new LlmGradingService($fakeAi);

        $result = $grader->extractEvidence(
            text: 'Test.',
            promptText: 'Test.',
            requirements: ['X'],
            grammarErrors: [],
            ruleAnalysis: $this->fakeRuleAnalysis(),
        );

        $this->assertSame(0.0, $result['evidence']['task_fulfillment']['points_covered']);
        $this->assertSame(1.0, $result['evidence']['task_fulfillment']['points_required']);
    }

    /** generateFeedback returns strengths, improvements, rewrites. */
    public function test_generate_feedback_returns_structured_output(): void
    {
        $result = $this->grader->generateFeedback(
            text: 'I like reading.',
            promptText: 'Write about hobbies.',
            metrics: $this->fakeMetrics(),
            grammarErrors: [],
        );

        $this->assertIsArray($result['strengths']);
        $this->assertIsArray($result['improvements']);
        $this->assertIsArray($result['rewrites']);
    }

    /** generateFeedback with empty LLM output returns empty arrays. */
    public function test_generate_feedback_fallback_on_empty_llm_output(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [];
            }

        };

        $grader = new LlmGradingService($fakeAi);

        $result = $grader->generateFeedback(
            text: 'Test.',
            promptText: 'Test.',
            metrics: $this->fakeMetrics(),
            grammarErrors: [],
        );

        $this->assertSame([], $result['strengths']);
        $this->assertSame([], $result['improvements']);
        $this->assertSame([], $result['rewrites']);
    }

    /** @return array<string,mixed> */
    private function fakeMetrics(): array
    {
        return [
            'word_count' => 3,
            'sentence_count' => 1,
            'paragraph_count' => 1,
            'linking_word_count' => 0,
            'unique_ratio' => 0.5,
            'avg_word_length' => 4.0,
            'avg_sentence_length' => 3.0,
        ];
    }

    /** @return AiClient */
    private function makeFakeAi(): AiClient
    {
        return new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [
                    'requirements_met' => 2,
                    'requirements_total' => 3,
                    'has_clear_position' => true,
                    'has_irrelevant_content' => false,
                    'strengths' => ['Tot'],
                    'improvements' => ['Can improve'],
                    'rewrites' => [],
                ];
            }

        };
    }

    /** @return array{metrics: array<string,mixed>, syntax: null, flags: list<string>} */
    private function fakeRuleAnalysis(): array
    {
        return [
            'metrics' => [
                'word_count' => 10,
                'sentence_count' => 2,
                'paragraph_count' => 1,
                'linking_word_count' => 1,
                'unique_ratio' => 0.5,
            ],
            'syntax' => null,
            'flags' => [],
        ];
    }
}
