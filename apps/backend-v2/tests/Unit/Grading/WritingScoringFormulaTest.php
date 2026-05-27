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

    /* ─── Grammar ───
     * G = clampRound((structureBand + accuracy) / 2)
     * structureBand: 0→5, 1→6, 3→7, 5→8, 6→9, 7→10
     * accuracy = min(maxAcc, max(0, 10 - errors/sentences × 5))
     * maxAcc: 0-2 types→7, 3-4→9, 5+→10
     */

    /** 0 kiểu cấu trúc → band=5, không lỗi → accuracy max=7. (5+7)/2 = 6.0. */
    public function test_grammar_no_structures_no_errors(): void
    {
        $syntax = ['count' => 0, 'types' => [], 'details' => []];
        $score = $this->formula->grammar($syntax, 0, 10);
        $this->assertSame(6.0, $score);
    }

    /** 2 kiểu cấu trúc → band=6, không lỗi → accuracy=7. (6+7)/2 = 6.5. */
    public function test_grammar_two_types_no_errors(): void
    {
        $syntax = ['count' => 2, 'types' => ['conditional', 'relative_clause'], 'details' => []];
        $score = $this->formula->grammar($syntax, 0, 10);
        $this->assertSame(6.5, $score);
    }

    /** 5 kiểu → band=8, 2 lỗi/10 câu ×5 = 1.0 penalty → accuracy=9. (8+9)/2 = 8.5. */
    public function test_grammar_five_types_with_errors(): void
    {
        $syntax = ['count' => 5, 'types' => ['conditional', 'relative_clause', 'passive_voice', 'complex_conjunction', 'subjunctive'], 'details' => []];
        $score = $this->formula->grammar($syntax, 2, 10);
        $this->assertSame(8.5, $score);
    }

    /** 0 kiểu, 50 lỗi/5 câu = 10 lỗi/câu ×5 = 50 → accuracy=0. (5+0)/2=2.5, clamp ≥1. */
    public function test_grammar_clamps_to_min(): void
    {
        $syntax = ['count' => 0, 'types' => [], 'details' => []];
        $score = $this->formula->grammar($syntax, 50, 5);
        $this->assertGreaterThanOrEqual(1.0, $score);
        $this->assertLessThanOrEqual(10.0, $score);
    }

    /* ─── Vocabulary ───
     * V = min(cap, clampRound(base + B_u + B_l + B_r + B_c))
     * B_u: unique_ratio >0.45→1, >0.55→2, >0.65→3
     * B_l: avg_word_len >4.5→1, >5.5→2
     * B_r: readability >8→1, >10→2
     * B_c: complex_vocab >2→1, >5→2
     * cap = 8
     */

    /** unique_ratio=0.3 → B_u=0, word_len=4.0 → B_l=0. base=3 → 3.0. */
    public function test_vocabulary_low_unique(): void
    {
        $score = $this->formula->vocabulary([
            'unique_ratio' => 0.3,
            'avg_word_length' => 4.0,
        ]);
        $this->assertSame(3.0, $score);
    }

    /** unique_ratio=0.7 → B_u=3, word_len=5.8 → B_l=2. base=3+3+2=8, bị cap ở 8. */
    public function test_vocabulary_high_unique_long_words(): void
    {
        $score = $this->formula->vocabulary([
            'unique_ratio' => 0.7,
            'avg_word_length' => 5.8,
        ]);
        $this->assertSame(8.0, $score);
    }

    /** unique_ratio=0.9 → B_u=3, word_len=6.5 → B_l=2. 3+3+2=8 → cap 8. */
    public function test_vocabulary_capped_at_8(): void
    {
        $score = $this->formula->vocabulary([
            'unique_ratio' => 0.9,
            'avg_word_length' => 6.5,
        ]);
        $this->assertLessThanOrEqual(8.0, $score);
    }

    /* ─── Task Fulfillment ───
     * T = clampRound((covered/required) × M + position - irrelevant)
     * M = coverage_multiplier = 7
     * position_bonus = 1
     * irrelevant_penalty = 2
     */

    /** 4/4 yêu cầu: (4/4)×7=7, có quan điểm +1, không lạc đề → 8.0. */
    public function test_task_fulfillment_all_met(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 4,
            'points_required' => 4,
            'has_clear_position' => true,
            'has_irrelevant_content' => false,
        ]);
        $this->assertSame(8.0, $score);
    }

    /** 2/4 yêu cầu: (2/4)×7=3.5, không quan điểm, không lạc đề → 3.5. */
    public function test_task_fulfillment_half_met_no_position(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 2,
            'points_required' => 4,
            'has_clear_position' => false,
            'has_irrelevant_content' => false,
        ]);
        $this->assertSame(3.5, $score);
    }

    /** 3/3 yêu cầu: (3/3)×7=7, có quan điểm +1, lạc đề -2 → 6.0. */
    public function test_task_fulfillment_irrelevant_penalty(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 3,
            'points_required' => 3,
            'has_clear_position' => true,
            'has_irrelevant_content' => true,
        ]);
        $this->assertSame(6.0, $score);
    }

    /* ─── Organization ───
     * O = clampRound(base + para + linking + variety - compact)
     * base = 1
     * para: 1→1, 2→3, 3+→4
     * linking = min(cap=3, count × 0.5)
     * variety: >4→1, >6→2
     * compact: 1 đoạn + >8 câu → -1
     */

    /** 3 đoạn → +4, 6 linking từ ×0.5=3, variety=7→+2. 1+4+3+2 = 10. */
    public function test_organization_well_structured(): void
    {
        $score = $this->formula->organization(3, 6, 12, 7.0);
        $this->assertSame(10.0, $score);
    }

    /** 1 đoạn → +1, 2 linking từ ×0.5=1, variety=3→0, 15 câu >8 → -1. 1+1+1+0-1 = 2. */
    public function test_organization_single_paragraph(): void
    {
        $score = $this->formula->organization(1, 2, 15, 3.0);
        $this->assertSame(2.0, $score);
    }

    /** 2 đoạn → +3, 4 linking từ ×0.5=2, variety=5→+1. 1+3+2+1 = 7. */
    public function test_organization_two_paragraphs_medium(): void
    {
        $score = $this->formula->organization(2, 4, 8, 5.0);
        $this->assertSame(7.0, $score);
    }

    /** 1 đoạn, 10 câu (>ngưỡng 8) → phạt compact -1. Điểm base + para(1) - 1 = 1.0. */
    public function test_organization_compact_penalty_applies(): void
    {
        $score = $this->formula->organization(1, 0, 10, 0.0);
        $this->assertSame(1.0, $score);
    }

    /** 2 đoạn, 10 câu → không bị phạt compact (chỉ áp dụng cho 1 đoạn). */
    public function test_organization_compact_penalty_not_applied_two_paragraphs(): void
    {
        $score = $this->formula->organization(2, 0, 10, 0.0);
        $this->assertSame(4.0, $score);
    }

    /* ─── Task Fulfillment — edge cases ─── */

    /** Không đáp ứng yêu cầu nào (0/3) → điểm bị clamp về sàn 1.0. */
    public function test_task_fulfillment_zero_covered(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 0,
            'points_required' => 3,
            'has_clear_position' => false,
            'has_irrelevant_content' => false,
        ]);
        $this->assertSame(1.0, $score);
    }

    /** Vừa lạc đề vừa không đáp ứng yêu cầu → điểm âm bị clamp về 1.0. */
    public function test_task_fulfillment_all_missed_with_irrelevant(): void
    {
        $score = $this->formula->taskFulfillment([
            'points_covered' => 0,
            'points_required' => 3,
            'has_clear_position' => false,
            'has_irrelevant_content' => true,
        ]);
        $this->assertSame(1.0, $score);
    }

    /* ─── Vocabulary — edge cases ─── */

    /** Metrics rỗng → tất cả bonus = 0, điểm về base=3. */
    public function test_vocabulary_empty_metrics(): void
    {
        $score = $this->formula->vocabulary([]);
        $this->assertSame(3.0, $score);
    }

    /* ─── Grammar — edge cases ─── */

    /** sentenceCount=0 → guard chia 0, errorPenalty = 0. Vẫn tính được structureBand. */
    public function test_grammar_zero_sentences(): void
    {
        $syntax = ['count' => 0, 'types' => [], 'details' => []];
        $score = $this->formula->grammar($syntax, 5, 0);
        $this->assertSame(6.0, $score);
    }
}
