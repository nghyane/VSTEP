<?php

declare(strict_types=1);

namespace Tests\Unit\Srs;

use App\Enums\SrsStateKind;
use App\Srs\SrsCardState;
use App\Srs\SrsConfig;
use App\Srs\SrsScheduler;
use PHPUnit\Framework\TestCase;

class SrsSchedulerTest extends TestCase
{
    private const NOW_MS = 1_700_000_000_000;

    private const MIN_MS = 60_000;

    private const DAY_MS = 86_400_000;

    private SrsScheduler $scheduler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->scheduler = new SrsScheduler(SrsConfig::default());
    }

    public function test_new_card_again_stays_in_learning(): void
    {
        $state = $this->scheduler->nextState(SrsCardState::new(), 1, self::NOW_MS);

        $this->assertSame(SrsStateKind::Learning, $state->kind);
        $this->assertSame(2, $state->remainingSteps);
        $this->assertSame(self::NOW_MS + 1 * self::MIN_MS, $state->dueAtMs);
    }

    public function test_new_card_good_advances_one_step(): void
    {
        $state = $this->scheduler->nextState(SrsCardState::new(), 3, self::NOW_MS);

        $this->assertSame(SrsStateKind::Learning, $state->kind);
        $this->assertSame(1, $state->remainingSteps);
        $this->assertSame(self::NOW_MS + 10 * self::MIN_MS, $state->dueAtMs);
    }

    public function test_new_card_easy_graduates_to_review(): void
    {
        $state = $this->scheduler->nextState(SrsCardState::new(), 4, self::NOW_MS);

        $this->assertSame(SrsStateKind::Review, $state->kind);
        $this->assertSame(4, $state->intervalDays);
        $this->assertSame(2.5, $state->easeFactor);
        $this->assertSame(self::NOW_MS + 4 * self::DAY_MS, $state->dueAtMs);
    }

    public function test_learning_good_at_last_step_graduates(): void
    {
        $state = SrsCardState::learning(remainingSteps: 1, dueAtMs: self::NOW_MS);

        $next = $this->scheduler->nextState($state, 3, self::NOW_MS);

        $this->assertSame(SrsStateKind::Review, $next->kind);
        $this->assertSame(1, $next->intervalDays);
    }

    public function test_review_good_increases_interval_by_ease(): void
    {
        $state = SrsCardState::review(
            intervalDays: 10,
            easeFactor: 2.5,
            lapses: 0,
            dueAtMs: self::NOW_MS,
        );

        $next = $this->scheduler->nextState($state, 3, self::NOW_MS);

        $this->assertSame(SrsStateKind::Review, $next->kind);
        // current(10) * 2.5 = 25, clamped to min hard*1.2+1 = 13, final = 25
        $this->assertSame(25, $next->intervalDays);
    }

    public function test_review_hard_applies_hard_multiplier(): void
    {
        $state = SrsCardState::review(
            intervalDays: 10,
            easeFactor: 2.5,
            lapses: 0,
            dueAtMs: self::NOW_MS,
        );

        $next = $this->scheduler->nextState($state, 2, self::NOW_MS);

        $this->assertSame(SrsStateKind::Review, $next->kind);
        // 10 * 1.2 = 12, min current+1 = 11 → 12
        $this->assertSame(12, $next->intervalDays);
        $this->assertEqualsWithDelta(2.35, $next->easeFactor, 0.001);
    }

    public function test_review_again_enters_relearning(): void
    {
        $state = SrsCardState::review(
            intervalDays: 10,
            easeFactor: 2.5,
            lapses: 0,
            dueAtMs: self::NOW_MS,
        );

        $next = $this->scheduler->nextState($state, 1, self::NOW_MS);

        $this->assertSame(SrsStateKind::Relearning, $next->kind);
        $this->assertSame(1, $next->lapses);
        $this->assertEqualsWithDelta(2.3, $next->easeFactor ?? $next->reviewEaseFactor, 0.001);
        // relearning steps = [10] → first step 10 min
        $this->assertSame(self::NOW_MS + 10 * self::MIN_MS, $next->dueAtMs);
    }

    public function test_relearning_good_returns_to_review(): void
    {
        $state = SrsCardState::relearning(
            remainingSteps: 1,
            dueAtMs: self::NOW_MS,
            reviewIntervalDays: 5,
            reviewEaseFactor: 2.3,
            lapses: 1,
        );

        $next = $this->scheduler->nextState($state, 3, self::NOW_MS);

        $this->assertSame(SrsStateKind::Review, $next->kind);
        $this->assertSame(5, $next->intervalDays);
        $this->assertSame(1, $next->lapses);
    }

    public function test_invalid_rating_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->scheduler->nextState(SrsCardState::new(), 5, self::NOW_MS);
    }

    public function test_state_round_trip_through_array(): void
    {
        $state = SrsCardState::review(42, 2.1, 3, self::NOW_MS);
        $roundTrip = SrsCardState::fromArray($state->toArray());

        $this->assertSame($state->kind, $roundTrip->kind);
        $this->assertSame($state->intervalDays, $roundTrip->intervalDays);
        $this->assertSame($state->easeFactor, $roundTrip->easeFactor);
        $this->assertSame($state->lapses, $roundTrip->lapses);
        $this->assertSame($state->dueAtMs, $roundTrip->dueAtMs);
    }
}
