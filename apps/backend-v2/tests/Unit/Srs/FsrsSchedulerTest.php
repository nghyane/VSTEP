<?php

declare(strict_types=1);

namespace Tests\Unit\Srs;

use App\Srs\FsrsConfig;
use App\Srs\FsrsScheduler;
use App\Srs\FsrsState;
use PHPUnit\Framework\TestCase;

class FsrsSchedulerTest extends TestCase
{
    private const NOW_MS = 1_700_000_000_000;

    private const DAY_MS = 86_400_000;

    private FsrsScheduler $scheduler;

    private FsrsConfig $config;

    protected function setUp(): void
    {
        parent::setUp();
        $this->config = FsrsConfig::default();
        $this->scheduler = new FsrsScheduler($this->config);
    }

    public function test_new_card_again_gets_short_stability(): void
    {
        $state = $this->scheduler->schedule(FsrsState::new(), 1, self::NOW_MS);

        // w[0] = 0.212 → stability ~0.212
        $this->assertEqualsWithDelta(0.212, $state->stability, 0.001);
        $this->assertSame(1, $state->lapses);
        $this->assertGreaterThan(self::NOW_MS, $state->dueAtMs);
    }

    public function test_new_card_good_gets_medium_stability(): void
    {
        $state = $this->scheduler->schedule(FsrsState::new(), 3, self::NOW_MS);

        // w[2] = 2.3065 → stability ~2.3065
        $this->assertEqualsWithDelta(2.3065, $state->stability, 0.001);
        $this->assertSame(0, $state->lapses);
        $this->assertFalse($state->isNew());
    }

    public function test_new_card_easy_gets_high_stability(): void
    {
        $state = $this->scheduler->schedule(FsrsState::new(), 4, self::NOW_MS);

        // w[3] = 8.2956 → stability ~8.2956
        $this->assertEqualsWithDelta(8.2956, $state->stability, 0.001);
        $this->assertSame(0, $state->lapses);
    }

    public function test_review_good_increases_stability(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 3, self::NOW_MS);

        $this->assertGreaterThan($state->stability, $next->stability);
        $this->assertSame(0, $next->lapses);
    }

    public function test_review_again_decreases_stability(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 1, self::NOW_MS);

        $this->assertLessThan($state->stability, $next->stability);
        $this->assertSame(1, $next->lapses);
    }

    public function test_review_hard_applies_penalty(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $hard = $this->scheduler->schedule($state, 2, self::NOW_MS);
        $good = $this->scheduler->schedule($state, 3, self::NOW_MS);

        $this->assertLessThan($good->stability, $hard->stability);
    }

    public function test_review_easy_applies_bonus(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $good = $this->scheduler->schedule($state, 3, self::NOW_MS);
        $easy = $this->scheduler->schedule($state, 4, self::NOW_MS);

        $this->assertGreaterThan($good->stability, $easy->stability);
    }

    public function test_difficulty_increases_on_again(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 1, self::NOW_MS);

        $this->assertGreaterThan($state->difficulty, $next->difficulty);
    }

    public function test_difficulty_decreases_on_easy(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 4, self::NOW_MS);

        $this->assertLessThan($state->difficulty, $next->difficulty);
    }

    public function test_difficulty_clamped_1_to_10(): void
    {
        // Very easy card
        $easy = new FsrsState(difficulty: 1.0, stability: 10.0, dueAtMs: self::NOW_MS, lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS);
        $next = $this->scheduler->schedule($easy, 4, self::NOW_MS);
        $this->assertGreaterThanOrEqual(1.0, $next->difficulty);

        // Very hard card
        $hard = new FsrsState(difficulty: 10.0, stability: 10.0, dueAtMs: self::NOW_MS, lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS);
        $next = $this->scheduler->schedule($hard, 1, self::NOW_MS);
        $this->assertLessThanOrEqual(10.0, $next->difficulty);
    }

    public function test_same_day_review_uses_short_term_stability(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lapses: 0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS, // same timestamp = 0 elapsed days
        );

        $next = $this->scheduler->schedule($state, 3, self::NOW_MS);

        // Short-term stability should not decrease for Good rating
        $this->assertGreaterThanOrEqual($state->stability, $next->stability);
    }

    public function test_retrievability_at_due_time(): void
    {
        $state = new FsrsState(
            difficulty: 5.0,
            stability: 10.0,
            lastReviewAtMs: self::NOW_MS,
        );

        // At t=0, retrievability should be ~1.0
        $r = $state->retrievability($this->config, self::NOW_MS);
        $this->assertEqualsWithDelta(1.0, $r, 0.01);

        // At desired_retention interval, should be ~0.9
        $decay = -$this->config->w[20];
        $factor = exp(log(0.9) / $decay) - 1;
        $interval = $state->stability / $factor * (0.9 ** (1.0 / $decay) - 1);
        $atDue = self::NOW_MS + (int) ($interval * self::DAY_MS);
        $r = $state->retrievability($this->config, $atDue);
        $this->assertEqualsWithDelta(0.9, $r, 0.01);
    }

    public function test_new_state_retrievability_is_zero(): void
    {
        $state = FsrsState::new();
        $this->assertSame(0.0, $state->retrievability($this->config));
    }

    public function test_invalid_rating_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->scheduler->schedule(FsrsState::new(), 5, self::NOW_MS);
    }

    public function test_state_round_trip_through_array(): void
    {
        $state = new FsrsState(5.0, 14.3, 2, self::NOW_MS, self::NOW_MS - 10 * self::DAY_MS);
        $roundTrip = FsrsState::fromArray($state->toArray($this->config, self::NOW_MS));

        $this->assertEqualsWithDelta($state->difficulty, $roundTrip->difficulty, 0.001);
        $this->assertEqualsWithDelta($state->stability, $roundTrip->stability, 0.001);
        $this->assertSame($state->lapses, $roundTrip->lapses);
    }

    public function test_interval_clamped_to_max(): void
    {
        // Extremely high stability should still clamp interval
        $state = new FsrsState(
            difficulty: 1.0,
            stability: 100000.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 4, self::NOW_MS);

        $intervalDays = ($next->dueAtMs - self::NOW_MS) / self::DAY_MS;
        $this->assertLessThanOrEqual($this->config->maxInterval, $intervalDays);
    }

    /**
     * Verify against fsrs-rs test_power_forgetting_curve expected values.
     */
    public function test_forgetting_curve_matches_reference(): void
    {
        $decay = -$this->config->w[20];
        $factor = exp(log(0.9) / $decay) - 1;

        // (t=0, s=1) → 1.0
        $r = (0 / 1.0 * $factor + 1) ** $decay;
        $this->assertEqualsWithDelta(1.0, $r, 1e-4);

        // (t=1, s=2) → 0.9403
        $r = (1 / 2.0 * $factor + 1) ** $decay;
        $this->assertEqualsWithDelta(0.9403, $r, 1e-3);

        // (t=4, s=4) → 0.9 (by design: desired_retention)
        $r = (4 / 4.0 * $factor + 1) ** $decay;
        $this->assertEqualsWithDelta(0.9, $r, 1e-3);
    }
}
