<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\Grading\SpeakingScoringFormula;
use Tests\TestCase;

final class SpeakingScoringFormulaTest extends TestCase
{
    private SpeakingScoringFormula $formula;

    protected function setUp(): void
    {
        parent::setUp();
        $this->formula = $this->app->make(SpeakingScoringFormula::class);
    }

    /* ─── Grammar ─── */

    public function test_grammar_two_types_no_errors(): void
    {
        $syntax = ['count' => 2, 'types' => ['conditional', 'relative_clause'], 'details' => []];
        // (6 + 7) / 2 = 6.5
        $this->assertSame(6.5, $this->formula->grammar($syntax, 0, 10));
    }

    public function test_grammar_four_types(): void
    {
        $syntax = ['count' => 4, 'types' => ['conditional', 'relative_clause', 'passive_voice', 'complex_conjunction'], 'details' => []];
        // 4 types → band 7 (>=3, <5), accuracy max 9 (3-4 range)
        // (7 + 9) / 2 = 8.0
        $this->assertSame(8.0, $this->formula->grammar($syntax, 0, 10));
    }

    /* ─── Vocabulary ─── */

    public function test_vocabulary_mid_range(): void
    {
        $score = $this->formula->vocabulary(['unique_ratio' => 0.5, 'avg_word_length' => 4.8]);
        // base=3 + unique_bonus(0.55→?) wait, 0.5 < 0.55 and < 0.45? Actually 0.5 >= 0.45 → bonus 1
        // length: 4.8 >= 4.5 → bonus 1
        // 3 + 1 + 1 = 5
        $this->assertSame(5.0, $score);
    }

    /* ─── Fluency ─── */

    public function test_fluency_normal_speaker(): void
    {
        // 100 wpm = bonus 2 (≥90), pauses 10 in 100 words = 10% → just over 8% → penalty 1
        // base=3 + 2 - 1 = 4
        $this->assertSame(4.0, $this->formula->fluency(100.0, 10, 100));
    }

    public function test_fluency_slow_speaker(): void
    {
        // 50 wpm = bonus 0 (below 60), pauses 5 in 50 words = 10% → penalty 1
        // 3 + 0 - 1 = 2
        $this->assertSame(2.0, $this->formula->fluency(50.0, 5, 50));
    }

    /* ─── Discourse ─── */

    public function test_discourse_well_structured(): void
    {
        // 8 linking words ×0.5 = 4, capped at 3
        // sentence variety 7 → bonus 2
        // base=1 + 3 + 2 = 6
        $this->assertSame(6.0, $this->formula->discourse(8, 7.0));
    }

    /* ─── Pronunciation ─── */

    public function test_pronunciation_clamps(): void
    {
        $this->assertSame(7.5, $this->formula->pronunciation(7.5));
        $this->assertSame(1.0, $this->formula->pronunciation(0.0));
        $this->assertSame(10.0, $this->formula->pronunciation(15.0));
    }
}
