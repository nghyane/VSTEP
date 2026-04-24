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

    private const MIN_MS = 60_000;

    private const DAY_MS = 86_400_000;

    private FsrsScheduler $scheduler;

    private FsrsConfig $config;

    protected function setUp(): void
    {
        parent::setUp();
        $this->config = FsrsConfig::default();
        $this->scheduler = new FsrsScheduler($this->config);
    }

    // ── New card ──

    public function test_new_card_again_enters_learning(): void
    {
        $state = $this->scheduler->schedule(FsrsState::new(), 1, self::NOW_MS);

        $this->assertSame('learning', $state->kind);
        $this->assertSame(2, $state->remainingSteps); // [1, 10] steps
        $this->assertSame(self::NOW_MS + 1 * self::MIN_MS, $state->dueAtMs);
        $this->assertSame(1, $state->lapses);
    }

    public function test_new_card_good_enters_learning(): void
    {
        $state = $this->scheduler->schedule(FsrsState::new(), 3, self::NOW_MS);

        $this->assertSame('learning', $state->kind);
        $this->assertSame(1, $state->remainingSteps);
        $this->assertSame(self::NOW_MS + 10 * self::MIN_MS, $state->dueAtMs);
        $this->assertEqualsWithDelta(2.3065, $state->stability, 0.001);
    }

    public function test_new_card_easy_graduates_to_review(): void
    {
        $state = $this->scheduler->schedule(FsrsState::new(), 4, self::NOW_MS);

        $this->assertSame('review', $state->kind);
        $this->assertEqualsWithDelta(8.2956, $state->stability, 0.001);
        $this->assertSame(0, $state->lapses);
    }

    // ── Learning ──

    public function test_learning_good_at_last_step_graduates(): void
    {
        $state = new FsrsState(
            kind: 'learning',
            difficulty: 5.0,
            stability: 2.3,
            remainingSteps: 1,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS,
        );

        $next = $this->scheduler->schedule($state, 3, self::NOW_MS);

        $this->assertSame('review', $next->kind);
        $this->assertSame(0, $next->remainingSteps);
    }

    public function test_learning_again_resets_steps(): void
    {
        $state = new FsrsState(
            kind: 'learning',
            difficulty: 5.0,
            stability: 2.3,
            remainingSteps: 1,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS,
        );

        $next = $this->scheduler->schedule($state, 1, self::NOW_MS);

        $this->assertSame('learning', $next->kind);
        $this->assertSame(2, $next->remainingSteps); // reset to full steps
    }

    // ── Review ──

    public function test_review_good_increases_stability(): void
    {
        $state = new FsrsState(
            kind: 'review',
            difficulty: 5.0,
            stability: 10.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 3, self::NOW_MS);

        $this->assertSame('review', $next->kind);
        $this->assertGreaterThan($state->stability, $next->stability);
    }

    public function test_review_again_enters_relearning(): void
    {
        $state = new FsrsState(
            kind: 'review',
            difficulty: 5.0,
            stability: 10.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 1, self::NOW_MS);

        $this->assertSame('relearning', $next->kind);
        $this->assertSame(1, $next->lapses);
        $this->assertSame(1, $next->remainingSteps); // relearningSteps = [10]
        $this->assertSame(self::NOW_MS + 10 * self::MIN_MS, $next->dueAtMs);
    }

    public function test_review_hard_less_stability_than_good(): void
    {
        $state = new FsrsState(
            kind: 'review',
            difficulty: 5.0,
            stability: 10.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $hard = $this->scheduler->schedule($state, 2, self::NOW_MS);
        $good = $this->scheduler->schedule($state, 3, self::NOW_MS);

        $this->assertLessThan($good->stability, $hard->stability);
    }

    public function test_review_easy_more_stability_than_good(): void
    {
        $state = new FsrsState(
            kind: 'review',
            difficulty: 5.0,
            stability: 10.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $good = $this->scheduler->schedule($state, 3, self::NOW_MS);
        $easy = $this->scheduler->schedule($state, 4, self::NOW_MS);

        $this->assertGreaterThan($good->stability, $easy->stability);
    }

    // ── Difficulty ──

    public function test_difficulty_increases_on_again(): void
    {
        $state = new FsrsState(
            kind: 'review',
            difficulty: 5.0,
            stability: 10.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 1, self::NOW_MS);
        $this->assertGreaterThan($state->difficulty, $next->difficulty);
    }

    public function test_difficulty_decreases_on_easy(): void
    {
        $state = new FsrsState(
            kind: 'review',
            difficulty: 5.0,
            stability: 10.0,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS,
        );

        $next = $this->scheduler->schedule($state, 4, self::NOW_MS);
        $this->assertLessThan($state->difficulty, $next->difficulty);
    }

    public function test_difficulty_clamped_1_to_10(): void
    {
        $easy = new FsrsState(kind: 'review', difficulty: 1.0, stability: 10.0, dueAtMs: self::NOW_MS, lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS);
        $this->assertGreaterThanOrEqual(1.0, $this->scheduler->schedule($easy, 4, self::NOW_MS)->difficulty);

        $hard = new FsrsState(kind: 'review', difficulty: 10.0, stability: 10.0, dueAtMs: self::NOW_MS, lastReviewAtMs: self::NOW_MS - 10 * self::DAY_MS);
        $this->assertLessThanOrEqual(10.0, $this->scheduler->schedule($hard, 1, self::NOW_MS)->difficulty);
    }

    // ── Relearning ──

    public function test_relearning_good_graduates(): void
    {
        $state = new FsrsState(
            kind: 'relearning',
            difficulty: 5.0,
            stability: 1.2,
            lapses: 1,
            remainingSteps: 1,
            dueAtMs: self::NOW_MS,
            lastReviewAtMs: self::NOW_MS,
        );

        $next = $this->scheduler->schedule($state, 3, self::NOW_MS);

        $this->assertSame('review', $next->kind);
        $this->assertSame(1, $next->lapses);
    }

    // ── Retrievability ──

    public function test_retrievability_at_due_time(): void
    {
        $state = new FsrsState(kind: 'review', difficulty: 5.0, stability: 10.0, lastReviewAtMs: self::NOW_MS);

        $r = $state->retrievability($this->config, self::NOW_MS);
        $this->assertEqualsWithDelta(1.0, $r, 0.01);

        $decay = -$this->config->w[20];
        $factor = exp(log(0.9) / $decay) - 1;
        $interval = $state->stability / $factor * (0.9 ** (1.0 / $decay) - 1);
        $atDue = self::NOW_MS + (int) ($interval * self::DAY_MS);
        $r = $state->retrievability($this->config, $atDue);
        $this->assertEqualsWithDelta(0.9, $r, 0.01);
    }

    public function test_new_state_retrievability_is_zero(): void
    {
        $this->assertSame(0.0, FsrsState::new()->retrievability($this->config));
    }

    // ── Edge cases ──

    public function test_invalid_rating_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->scheduler->schedule(FsrsState::new(), 5, self::NOW_MS);
    }

    public function test_state_round_trip_through_array(): void
    {
        $state = new FsrsState('review', 5.0, 14.3, 2, 0, self::NOW_MS, self::NOW_MS - 10 * self::DAY_MS);
        $roundTrip = FsrsState::fromArray($state->toArray($this->config, self::NOW_MS));

        $this->assertSame($state->kind, $roundTrip->kind);
        $this->assertEqualsWithDelta($state->difficulty, $roundTrip->difficulty, 0.001);
        $this->assertEqualsWithDelta($state->stability, $roundTrip->stability, 0.001);
        $this->assertSame($state->lapses, $roundTrip->lapses);
    }

    public function test_forgetting_curve_matches_reference(): void
    {
        $decay = -$this->config->w[20];
        $factor = exp(log(0.9) / $decay) - 1;

        $r = (0 / 1.0 * $factor + 1) ** $decay;
        $this->assertEqualsWithDelta(1.0, $r, 1e-4);

        $r = (1 / 2.0 * $factor + 1) ** $decay;
        $this->assertEqualsWithDelta(0.9403, $r, 1e-3);

        $r = (4 / 4.0 * $factor + 1) ** $decay;
        $this->assertEqualsWithDelta(0.9, $r, 1e-3);
    }
}
