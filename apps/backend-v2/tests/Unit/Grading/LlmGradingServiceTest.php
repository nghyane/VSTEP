<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Ai\AiClient;
use App\Services\Ai\LlmTaskFulfillmentAssessor;
use App\Services\Ai\LlmWritingFeedbackGenerator;
use Tests\TestCase;

final class LlmGradingServiceTest extends TestCase
{
    private LlmTaskFulfillmentAssessor $extractor;

    private LlmWritingFeedbackGenerator $feedback;

    protected function setUp(): void
    {
        parent::setUp();
        $fakeAi = $this->makeFakeAi();
        $this->extractor = new LlmTaskFulfillmentAssessor($fakeAi);
        $this->feedback = new LlmWritingFeedbackGenerator($fakeAi);
    }

    public function test_extract_evidence_returns_flat_structure(): void
    {
        $result = $this->extractor->assess(
            text: 'I like reading books because it helps me relax.',
            promptText: 'Write about your hobby.',
            requirements: ['State your hobby', 'Give a reason'],
            grammarErrors: [],
            ruleAnalysis: $this->fakeRuleAnalysis(),
        );

        $this->assertArrayHasKey('points_covered', $result);
        $this->assertArrayHasKey('points_required', $result);
        $this->assertArrayHasKey('has_clear_position', $result);
        $this->assertArrayHasKey('has_irrelevant_content', $result);
    }

    public function test_extract_evidence_fallback_on_empty_llm_output(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [];
            }
        };

        $extractor = new LlmTaskFulfillmentAssessor($fakeAi);

        $result = $extractor->assess(
            text: 'Test.',
            promptText: 'Test.',
            requirements: ['X'],
            grammarErrors: [],
            ruleAnalysis: $this->fakeRuleAnalysis(),
        );

        $this->assertSame(0, $result['points_covered']);
        $this->assertSame(1, $result['points_required']);
    }

    public function test_generate_feedback_returns_arrays(): void
    {
        $result = $this->feedback->generate(
            text: 'I like reading.',
            promptText: 'Write about hobbies.',
            metrics: $this->fakeMetrics(),
            grammarErrors: [],
        );

        $this->assertIsArray($result['strengths']);
        $this->assertIsArray($result['improvements']);
        $this->assertIsArray($result['rewrites']);
    }

    public function test_generate_feedback_fallback_on_empty_llm_output(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [];
            }
        };

        $generator = new LlmWritingFeedbackGenerator($fakeAi);

        $result = $generator->generate(
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

    private function makeFakeAi(): AiClient
    {
        return new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [
                    'requirements_met' => [true, true, false],
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
                'avg_word_length' => 4.5,
            ],
            'syntax' => null,
            'flags' => [],
        ];
    }
}
