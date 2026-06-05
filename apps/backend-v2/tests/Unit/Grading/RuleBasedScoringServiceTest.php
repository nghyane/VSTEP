<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\RuleBasedScoringService;
use Tests\TestCase;

/**
 * RuleBasedScoringService has no dependencies — pure deterministic metrics.
 * Tests metrics computation and flag detection for LLM context.
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
        $text = 'I like reading books. Reading is good for you. It helps you learn new things.';
        $errors = [
            ['message' => 'Missing article', 'category' => 'Grammar', 'offset' => 0, 'length' => 1, 'rule_id' => 'RULE1', 'replacements' => []],
        ];

        $result = $this->service->analyze($text, $errors);

        $this->assertSame(15, $result['metrics']['word_count']);
        $this->assertSame(3, $result['metrics']['sentence_count']);
        $this->assertSame(1, $result['metrics']['paragraph_count']);
        $this->assertGreaterThan(0, $result['metrics']['unique_ratio']);
        $this->assertIsFloat($result['metrics']['errors_per_sentence']);
    }

    public function test_analyze_detects_linking_words(): void
    {
        $text = 'However, this is good. Therefore, we should try it.';
        $result = $this->service->analyze($text, []);

        $this->assertSame(2, $result['metrics']['linking_word_count']);
    }

    public function test_analyze_detects_task_one_linking_phrases(): void
    {
        $text = 'Unfortunately, I missed the party. As a result, I felt bad. To make up for it, let us meet. Once again, I am sorry. Hopefully, you can come.';
        $result = $this->service->analyze($text, []);

        $this->assertSame(5, $result['metrics']['linking_word_count']);
        $this->assertContains('unfortunately', array_column($result['metrics']['lexical_signal_matches'], 'phrase'));
    }

    public function test_analyze_counts_task_one_lexical_collocations(): void
    {
        $text = 'Please accept my sincere apology. It was an important occasion, and I felt extremely regretful because everything happened unexpectedly. I prepared a belated birthday present to make up for letting you down.';
        $result = $this->service->analyze($text, []);

        $this->assertSame(7, $result['metrics']['complex_vocab_count']);
    }

    public function test_analyze_no_errors_returns_zero(): void
    {
        $text = 'A simple text.';
        $result = $this->service->analyze($text, []);

        $this->assertSame(0, $result['metrics']['grammar_error_count']);
        $this->assertSame(0, $result['metrics']['total_error_count']);
    }

    public function test_analyze_counts_blank_text_as_zero_words(): void
    {
        $result = $this->service->analyze(" \n\t ", []);

        $this->assertSame(0, $result['metrics']['word_count']);
        $this->assertSame(0, $result['metrics']['sentence_count']);
        $this->assertSame(0, $result['metrics']['paragraph_count']);
        $this->assertSame(0.0, $result['metrics']['unique_ratio']);
        $this->assertSame(0, $result['metrics']['avg_word_length']);
    }

    public function test_flags_short_text(): void
    {
        $text = 'Hello world.';
        $result = $this->service->analyze($text, []);

        $this->assertContains('severely_under_word_count', $result['flags']);
    }

    public function test_flags_high_error_rate(): void
    {
        $text = 'A short text with errors for the test.';
        $errors = array_fill(0, 4, [
            'message' => 'error', 'category' => 'Grammar', 'offset' => 0, 'length' => 1, 'rule_id' => 'X', 'replacements' => [],
        ]);
        $result = $this->service->analyze($text, $errors);

        $this->assertContains('high_error_rate', $result['flags']);
    }

    public function test_tone_detection_uses_word_boundaries(): void
    {
        $result = $this->service->analyze('Technology resources can support learners.', []);

        $this->assertSame(0, $result['metrics']['tone_signals']['informal_count']);
    }
}
