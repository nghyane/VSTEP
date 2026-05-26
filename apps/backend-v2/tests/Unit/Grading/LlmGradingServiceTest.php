<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Models\GradingRubric;
use App\Services\Grading\LlmGradingService;
use Tests\Support\FakeAiClient;
use Tests\TestCase;

/**
 * LlmGradingService unit tests — no database, uses FakeAiClient.
 * Tests the normalization, fallback, and grading logic.
 */
final class LlmGradingServiceTest extends TestCase
{
    private LlmGradingService $grader;
    private GradingRubric $rubric;

    protected function setUp(): void
    {
        parent::setUp();
        $this->grader = new LlmGradingService(new FakeAiClient);
        $this->rubric = $this->makeWritingRubric();
    }

    public function test_grade_writing_returns_normalized_scores(): void
    {
        $result = $this->grader->gradeWriting(
            text: 'I like reading books.',
            promptText: 'Write about reading.',
            grammarErrors: [],
            ruleAnalysis: ['caps' => ['grammar' => null, 'task_fulfillment' => null, 'vocabulary' => null, 'organization' => null], 'metrics' => $this->fakeMetrics(), 'flags' => []],
            rubric: $this->rubric,
        );

        $this->assertArrayHasKey('rubric_scores', $result);
        $this->assertArrayHasKey('task_fulfillment', $result['rubric_scores']);
        $this->assertArrayHasKey('organization', $result['rubric_scores']);
        $this->assertArrayHasKey('grammar', $result['rubric_scores']);
        $this->assertArrayHasKey('vocabulary', $result['rubric_scores']);
        $this->assertArrayHasKey('overall_band', $result);
        $this->assertArrayHasKey('strengths', $result);
        $this->assertArrayHasKey('improvements', $result);
    }

    public function test_grade_writing_clamps_to_max_score(): void
    {
        // FakeAiClient returns scores with task_fulfillment=7.5, max_score=10
        $result = $this->grader->gradeWriting(
            text: 'I like reading books.',
            promptText: 'Write.',
            grammarErrors: [],
            ruleAnalysis: ['caps' => ['grammar' => null, 'task_fulfillment' => null, 'vocabulary' => null, 'organization' => null], 'metrics' => $this->fakeMetrics(), 'flags' => []],
            rubric: $this->rubric,
        );

        foreach ($result['rubric_scores'] as $score) {
            $this->assertGreaterThanOrEqual(0.0, $score);
            $this->assertLessThanOrEqual(10.0, $score);
        }
    }

    public function test_grade_speaking_returns_normalized_result(): void
    {
        $speakingRubric = $this->makeSpeakingRubric();
        $result = $this->grader->gradeSpeaking(
            transcript: 'I went to school today.',
            rubric: $speakingRubric,
        );

        $this->assertArrayHasKey('rubric_scores', $result);
        $this->assertArrayHasKey('overall_band', $result);
        $this->assertArrayHasKey('strengths', $result);
        $this->assertArrayHasKey('improvements', $result);
    }

    public function test_grade_speaking_passes_pronunciation_data(): void
    {
        $speakingRubric = $this->makeSpeakingRubric();
        $result = $this->grader->gradeSpeaking(
            transcript: 'Hello world.',
            rubric: $speakingRubric,
            pronunciationData: ['accuracy_score' => 85],
        );

        $this->assertIsArray($result['rubric_scores']);
    }

    public function test_throws_on_invalid_ai_response(): void
    {
        // LLM returns empty → missing rubric_scores → throws
        $fakeAi = new class implements \App\Ai\AiClient {
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

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('LLM returned invalid structured output');
        $grader->gradeSpeaking(transcript: 'test.', rubric: $this->makeSpeakingRubric());
    }

    private function makeWritingRubric(): GradingRubric
    {
        return new GradingRubric([
            'skill' => 'writing',
            'criteria' => [
                ['key' => 'task_fulfillment', 'name' => 'Task Fulfillment', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'organization', 'name' => 'Organization', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'grammar', 'name' => 'Grammar', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'vocabulary', 'name' => 'Vocabulary', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
            ],
        ]);
    }

    private function makeSpeakingRubric(): GradingRubric
    {
        return new GradingRubric([
            'skill' => 'speaking',
            'criteria' => [
                ['key' => 'grammar', 'name' => 'Grammar', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'vocabulary', 'name' => 'Vocabulary', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'pronunciation', 'name' => 'Pronunciation', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'fluency', 'name' => 'Fluency', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
                ['key' => 'discourse_management', 'name' => 'Discourse Management', 'max_score' => 10, 'weight' => 1.0, 'band_descriptors' => $this->fakeDescriptors()],
            ],
        ]);
    }

    /** @return array<string,string> */
    private function fakeDescriptors(): array
    {
        return [
            '10' => 'Excellent.',
            '7' => 'Good.',
            '5' => 'Adequate.',
            '0' => 'No attempt.',
        ];
    }

    /** @return array<string,mixed> */
    private function fakeMetrics(): array
    {
        return [
            'word_count' => 50,
            'sentence_count' => 5,
            'paragraph_count' => 2,
            'unique_ratio' => 0.6,
            'avg_sentence_length' => 10.0,
            'grammar_error_count' => 1,
            'total_error_count' => 2,
            'errors_per_sentence' => 0.4,
            'linking_word_count' => 2,
        ];
    }
}
