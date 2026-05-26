<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\Grading\WritingScoringFormula;
use Tests\TestCase;

final class WritingScoringFormulaTest extends TestCase
{
    private WritingScoringFormula $formula;

    protected function setUp(): void
    {
        parent::setUp();
        $this->formula = $this->app->make(WritingScoringFormula::class);
    }

    /* ─── Grammar ─── */

    public function test_grammar_no_structures_no_errors(): void
    {
        // 0 types → band 5, no errors → accuracy capped at 7 (max for <3 types)
        // (5 + 7) / 2 = 6.0
        $syntax = ['count' => 0, 'types' => [], 'details' => []];
        $score = $this->formula->grammar($syntax, 0, 10);
        $this->assertSame(6.0, $score);
    }

    public function test_grammar_two_types_no_errors(): void
    {
        // 2 types → band 6, no errors → accuracy capped at 7
        // (6 + 7) / 2 = 6.5
        $syntax = ['count' => 2, 'types' => ['conditional', 'relative_clause'], 'details' => []];
        $score = $this->formula->grammar($syntax, 0, 10);
        $this->assertSame(6.5, $score);
    }

    public function test_grammar_five_types_with_errors(): void
    {
        // 5 types → band 8, 2 errors / 10 sentences * 5 = 1.0 penalty
        // accuracy = min(10, 10-1.0) = 9.0
        // (8 + 9) / 2 = 8.5
        $syntax = ['count' => 5, 'types' => ['conditional', 'relative_clause', 'passive_voice', 'complex_conjunction', 'subjunctive'], 'details' => []];
        $score = $this->formula->grammar($syntax, 2, 10);
        $this->assertSame(8.5, $score);
    }

    public function test_grammar_clamps_to_min(): void
    {
        // 0 types, many errors → should not go below 1
        $syntax = ['count' => 0, 'types' => [], 'details' => []];
        $score = $this->formula->grammar($syntax, 50, 5); // errors/sentence = 10 → penalty = 10
        $this->assertGreaterThanOrEqual(1.0, $score);
        $this->assertLessThanOrEqual(10.0, $score);
    }

    /* ─── Vocabulary ─── */

    public function test_vocabulary_low_unique(): void
    {
        $score = $this->formula->vocabulary([
            'unique_ratio' => 0.3,
            'avg_word_length' => 4.0,
        ]);
        // 3 + 0 + 0 = 3, clampRound → 3.0
        $this->assertSame(3.0, $score);
    }

    public function test_vocabulary_high_unique_long_words(): void
    {
        $score = $this->formula->vocabulary([
            'unique_ratio' => 0.7,
            'avg_word_length' => 5.8,
        ]);
        // 3 + 3 + 2 = 8, cap at 8 → 8.0
        $this->assertSame(8.0, $score);
    }

    public function test_vocabulary_capped_at_8(): void
    {
        // Even with perfect metrics, max is 8
        $score = $this->formula->vocabulary([
            'unique_ratio' => 0.9,
            'avg_word_length' => 6.5,
        ]);
        $this->assertLessThanOrEqual(8.0, $score);
    }

    /* ─── Task Fulfillment ─── */

    public function test_task_fulfillment_all_met(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 4,
            'points_required' => 4,
            'has_clear_position' => true,
            'has_irrelevant_content' => false,
        ]);
        // (4/4)*7 + 1 = 8.0
        $this->assertSame(8.0, $score);
    }

    public function test_task_fulfillment_half_met_no_position(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 2,
            'points_required' => 4,
            'has_clear_position' => false,
            'has_irrelevant_content' => false,
        ]);
        // (2/4)*7 + 0 = 3.5
        $this->assertSame(3.5, $score);
    }

    public function test_task_fulfillment_irrelevant_penalty(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 3,
            'points_required' => 3,
            'has_clear_position' => true,
            'has_irrelevant_content' => true,
        ]);
        // (3/3)*7 + 1 - 2 = 6.0
        $this->assertSame(6.0, $score);
    }

    /* ─── Organization ─── */

    public function test_organization_well_structured(): void
    {
        // 3 paragraphs, 6 linking words, 12 sentences, variety 7
        $score = $this->formula->organization(3, 6, 12, 7.0);
        // 1 + 4 + 3 + 2 = 10, clamp → 10.0
        $this->assertSame(10.0, $score);
    }

    public function test_organization_single_paragraph(): void
    {
        // 1 paragraph, 2 linking words, 15 sentences, variety 3
        $score = $this->formula->organization(1, 2, 15, 3.0);
        // 1 + 1 + 1 + 0 - 1 = 2.0
        $this->assertSame(2.0, $score);
    }

    public function test_organization_two_paragraphs_medium(): void
    {
        // 2 paragraphs, 4 linking words, 8 sentences, variety 5
        $score = $this->formula->organization(2, 4, 8, 5.0);
        // 1 + 3 + 2 + 1 = 7.0
        $this->assertSame(7.0, $score);
    }
}
