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

    /* ─── Grammar ───
     * G = clampRound((structureBand + accuracy) / 2)
     * structureBand: 0→5, 1→6, 3→7, 5→8, 6→9, 7→10
     * accuracy = min(maxAcc, max(0, 10 - errors/sentences × 5))
     * maxAcc: 0-2 types→7, 3-4→9, 5+→10
     */

    /** 2 kiểu cấu trúc → band=6, không lỗi → accuracy=7. (6+7)/2 = 6.5. */
    public function test_grammar_two_types_no_errors(): void
    {
        $syntax = ['count' => 2, 'types' => ['conditional', 'relative_clause'], 'details' => []];
        $this->assertSame(6.5, $this->formula->grammar($syntax, 0, 10));
    }

    /** 4 kiểu cấu trúc → band=7 (>=3,<5), accuracy max=9. (7+9)/2 = 8.0. */
    public function test_grammar_four_types(): void
    {
        $syntax = ['count' => 4, 'types' => ['conditional', 'relative_clause', 'passive_voice', 'complex_conjunction'], 'details' => []];
        $this->assertSame(8.0, $this->formula->grammar($syntax, 0, 10));
    }

    /* ─── Vocabulary ───
     * V = min(cap, clampRound(base + B_u + B_l + B_r + B_c))
     * B_u: unique_ratio >0.45→1, >0.55→2, >0.65→3
     * B_l: avg_word_len >4.5→1, >5.5→2
     * B_r: readability >8→1, >10→2 (không dùng trong test này)
     * B_c: complex_vocab >2→1, >5→2 (không dùng trong test này)
     */

    /** unique_ratio=0.5 → B_u=1, avg_word_len=4.8 → B_l=1. base=3+1+1=5. */
    public function test_vocabulary_mid_range(): void
    {
        $score = $this->formula->vocabulary(['unique_ratio' => 0.5, 'avg_word_length' => 4.8]);
        $this->assertSame(5.0, $score);
    }

    /* ─── Fluency ───
     * F = clampRound(base + rateBonus - pausePenalty)
     * rateBonus: wpm ≥60→1, ≥90→2, ≥120→3, ≥150→4
     * pausePenalty: pauses/100words >8→1, >15→2
     */

    /** 100 wpm → bonus=2, 10 pauses/100 từ = 10% >8% → penalty=1. base=3+2-1=4. */
    public function test_fluency_normal_speaker(): void
    {
        $this->assertSame(4.0, $this->formula->fluency(100.0, 10, 100));
    }

    /** 50 wpm → bonus=0 (<60), 5 pauses/50 từ = 10% >8% → penalty=1. base=3+0-1=2. */
    public function test_fluency_slow_speaker(): void
    {
        $this->assertSame(2.0, $this->formula->fluency(50.0, 5, 50));
    }

    /* ─── Discourse ───
     * D = clampRound((base + B_l + B_v) × contentFactor)
     * B_l = min(cap, linkingWords × factor)  — cap=3, factor=0.5
     * B_v: variety >4→1, >6→2
     * contentFactor ∈ [0.5, 1.0], default=1.0
     */

    /** 8 linking từ ×0.5=4 → cap 3, variety=7→bonus=2. base=1+3+2=6 × 1.0 = 6. */
    public function test_discourse_well_structured(): void
    {
        $this->assertSame(6.0, $this->formula->discourse(8, 7.0));
    }

    /* ─── Discourse — content factor ─── */

    /** Khi contentFactor=0.5: điểm structural=6.0 bị giảm 50% → 3.0. */
    public function test_discourse_content_factor_point_five(): void
    {
        $this->assertSame(3.0, $this->formula->discourse(8, 7.0, 0.5));
    }

    /** Khi contentFactor=1.0: điểm giữ nguyên (bài đúng trọng tâm). */
    public function test_discourse_content_factor_one(): void
    {
        $this->assertSame(6.0, $this->formula->discourse(8, 7.0, 1.0));
    }

    /** Không truyền contentFactor → mặc định 1.0, giữ nguyên hành vi cũ. */
    public function test_discourse_default_content_factor_preserves_behavior(): void
    {
        $this->assertSame(6.0, $this->formula->discourse(8, 7.0));
    }

    /** contentFactor=0 → tự clamp về 0.5, không cho điểm về 0. */
    public function test_discourse_content_factor_clamped_below_minimum(): void
    {
        $this->assertSame(3.0, $this->formula->discourse(8, 7.0, 0.0));
    }

    /** contentFactor > 1 → tự clamp về 1.0, không vượt quá điểm gốc. */
    public function test_discourse_content_factor_clamped_above_maximum(): void
    {
        $this->assertSame(6.0, $this->formula->discourse(8, 7.0, 2.0));
    }

    /* ─── Fluency — edge cases ─── */

    /** wordCount=0 → guard division by zero, không crash. PausesPer100 = 0. */
    public function test_fluency_word_count_zero(): void
    {
        $this->assertSame(5.0, $this->formula->fluency(100.0, 5, 0));
    }

    /* ─── Vocabulary — edge cases ─── */

    /** Metrics rỗng → tất cả bonus = 0, điểm về base=3. */
    public function test_vocabulary_empty_metrics(): void
    {
        $this->assertSame(3.0, $this->formula->vocabulary([]));
    }

    /** Từ vựng lặp hoàn toàn → unique_ratio quá thấp, không có bonus. */
    public function test_vocabulary_all_same_words(): void
    {
        $this->assertSame(3.0, $this->formula->vocabulary(['unique_ratio' => 0.1, 'avg_word_length' => 3.0]));
    }

    /* ─── Grammar — edge cases ─── */

    /** sentenceCount=0 → guard chia 0, errorPenalty = 0. Vẫn tính được structureBand. */
    public function test_grammar_zero_sentences(): void
    {
        $syntax = ['count' => 0, 'types' => [], 'details' => []];
        $this->assertSame(6.0, $this->formula->grammar($syntax, 5, 0));
    }

    /* ─── Pronunciation ───
     * P = clampRound(azurePAscore)
     * Range: [1.0, 10.0], bước 0.5
     */

    /** clampRound: không vượt 1-10, làm tròn 0.5. */
    public function test_pronunciation_clamps(): void
    {
        $this->assertSame(7.5, $this->formula->pronunciation(7.5));
        $this->assertSame(1.0, $this->formula->pronunciation(0.0));
        $this->assertSame(10.0, $this->formula->pronunciation(15.0));
    }
}
