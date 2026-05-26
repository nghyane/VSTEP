<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Models\ScoringPolicy;
use App\Services\RuleBasedScoringService;
use Tests\TestCase;

/**
 * RuleBasedScoringService has no dependencies — pure deterministic scoring.
 * Tests metrics computation, cap evaluation, and LLM score reconciliation.
 */
final class RuleBasedScoringServiceTest extends TestCase
{
    private RuleBasedScoringService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RuleBasedScoringService;
    }

    public function test_analyze_computes_metrics(): void
    {
        $text = "I like reading books. Reading is good for you. It helps you learn new things.";
        $errors = [
            ['message' => 'Missing article', 'category' => 'Grammar', 'offset' => 0, 'length' => 1, 'rule_id' => 'RULE1', 'replacements' => []],
        ];

        $policy = $this->policyWithCaps([]);
        $result = $this->service->analyze($text, $errors, $policy);

        $this->assertSame(15, $result['metrics']['word_count']);
        $this->assertSame(3, $result['metrics']['sentence_count']);
        $this->assertSame(1, $result['metrics']['paragraph_count']);
        $this->assertGreaterThan(0, $result['metrics']['unique_ratio']);
        $this->assertIsFloat($result['metrics']['errors_per_sentence']);
    }

    public function test_analyze_detects_linking_words(): void
    {
        $text = 'However, this is good. Therefore, we should try it.';
        $policy = $this->policyWithCaps([]);
        $result = $this->service->analyze($text, [], $policy);

        $this->assertSame(2, $result['metrics']['linking_word_count']);
    }

    public function test_analyze_no_errors_returns_zero(): void
    {
        $text = 'A simple text.';
        $policy = $this->policyWithCaps([]);
        $result = $this->service->analyze($text, [], $policy);

        $this->assertSame(0, $result['metrics']['grammar_error_count']);
        $this->assertSame(0, $result['metrics']['total_error_count']);
    }

    public function test_flags_short_text(): void
    {
        $text = 'Hello world.';
        $policy = $this->policyWithCaps([]);
        $result = $this->service->analyze($text, [], $policy);

        $this->assertContains('severely_under_word_count', $result['flags']);
    }

    public function test_flags_high_error_rate(): void
    {
        $text = 'A short text with errors for the test.';
        $errors = array_fill(0, 4, [
            'message' => 'error', 'category' => 'Grammar', 'offset' => 0, 'length' => 1, 'rule_id' => 'X', 'replacements' => [],
        ]);
        $policy = $this->policyWithCaps([]);
        $result = $this->service->analyze($text, $errors, $policy);

        $this->assertContains('high_error_rate', $result['flags']);
    }

    public function test_reconcile_caps_llm_scores(): void
    {
        $llmScores = ['grammar' => 9.0, 'vocabulary' => 8.0];
        $caps = ['grammar' => 6.0, 'vocabulary' => null];

        $result = $this->service->reconcile($llmScores, $caps);

        $this->assertSame(6.0, $result['grammar']);
        $this->assertSame(8.0, $result['vocabulary']);
    }

    public function test_reconcile_no_caps_leaves_scores_unchanged(): void
    {
        $llmScores = ['grammar' => 7.5, 'vocabulary' => 8.0];
        $result = $this->service->reconcile($llmScores, []);

        $this->assertSame(7.5, $result['grammar']);
        $this->assertSame(8.0, $result['vocabulary']);
    }

    public function test_cap_evaluated_from_policy_rules(): void
    {
        $text = 'Very short.';
        $policy = $this->policyWithCaps([
            'grammar' => [
                ['metric' => 'word_count', 'op' => '<', 'value' => 10, 'max' => 4.0],
            ],
        ]);

        $result = $this->service->analyze($text, [], $policy);
        $this->assertSame(4.0, $result['caps']['grammar']);
    }

    public function test_compound_rule_all_conditions_must_match(): void
    {
        $text = "Good morning. Today is nice. Let's go out.";
        $policy = $this->policyWithCaps([
            'coherence' => [
                [
                    'all' => [
                        ['metric' => 'linking_word_count', 'op' => '==', 'value' => 0],
                        ['metric' => 'sentence_count', 'op' => '>', 'value' => 2],
                    ],
                    'max' => 3.0,
                ],
            ],
        ]);

        $result = $this->service->analyze($text, [], $policy);
        $this->assertSame(3.0, $result['caps']['coherence']);
    }

    private function policyWithCaps(array $caps): ScoringPolicy
    {
        return new ScoringPolicy(['rules' => ['caps' => $caps]]);
    }
}
