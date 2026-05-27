<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Ai\AiClient;
use App\Services\Grading\LlmGradingService;
use Tests\TestCase;

/**
 * LlmGradingService unit tests — no database, uses inline FakeAiClient.
 * Tests evidence extraction, normalization, and fallback.
 */
final class LlmGradingServiceTest extends TestCase
{
    private LlmGradingService $grader;

    protected function setUp(): void
    {
        parent::setUp();
        $this->grader = new LlmGradingService($this->makeFakeAi());
    }

    /** extractEvidence tra ve evidence, strengths, improvements, rewrites. */
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
        $this->assertArrayHasKey('has_clear_position', $result['evidence']['task_fulfillment']);
        $this->assertArrayHasKey('has_irrelevant_content', $result['evidence']['task_fulfillment']);
        $this->assertIsArray($result['strengths']);
        $this->assertIsArray($result['improvements']);
        $this->assertIsArray($result['rewrites']);
    }

    /** requirements_met <= requirements_total (LLM dem chinh xac). */
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

    /** requirements_total mac dinh = count($requirements) khi LLM tra ve. */
    public function test_extract_evidence_uses_requirement_count(): void
    {
        $result = $this->grader->extractEvidence(
            text: 'Test text.',
            promptText: 'Test prompt.',
            requirements: ['A', 'B', 'C'],
            grammarErrors: [],
            ruleAnalysis: $this->fakeRuleAnalysis(),
        );

        $this->assertSame(3, $result['evidence']['task_fulfillment']['points_required']);
    }

    /** LLM returns empty -> values fallback to 0/1/false defaults. */
    public function test_extract_evidence_fallback_on_empty_llm_output(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [];
            }

            public function text(string $service, string $prompt, ?string $instructions = null): string
            {
                return '';
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

        $this->assertSame(0, $result['evidence']['task_fulfillment']['points_covered']);
        $this->assertSame(1, $result['evidence']['task_fulfillment']['points_required']);
        $this->assertFalse($result['evidence']['task_fulfillment']['has_clear_position']);
        $this->assertFalse($result['evidence']['task_fulfillment']['has_irrelevant_content']);
        $this->assertSame([], $result['strengths']);
        $this->assertSame([], $result['improvements']);
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

            public function text(string $service, string $prompt, ?string $instructions = null): string
            {
                return '';
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
