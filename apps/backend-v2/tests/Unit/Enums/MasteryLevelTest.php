<?php

declare(strict_types=1);

namespace Tests\Unit\Enums;

use App\Enums\MasteryLevel;
use PHPUnit\Framework\TestCase;

class MasteryLevelTest extends TestCase
{
    public function test_zero_attempts_is_new(): void
    {
        $this->assertSame(MasteryLevel::New, MasteryLevel::compute(0, 0));
    }

    public function test_few_attempts_low_accuracy_is_learning(): void
    {
        $this->assertSame(MasteryLevel::Learning, MasteryLevel::compute(2, 1));
    }

    public function test_three_plus_with_60_percent_is_practicing(): void
    {
        $this->assertSame(MasteryLevel::Practicing, MasteryLevel::compute(3, 2));
        $this->assertSame(MasteryLevel::Practicing, MasteryLevel::compute(4, 3));
    }

    public function test_five_plus_with_85_percent_is_mastered(): void
    {
        $this->assertSame(MasteryLevel::Mastered, MasteryLevel::compute(5, 5));
        $this->assertSame(MasteryLevel::Mastered, MasteryLevel::compute(10, 9));
    }

    public function test_high_attempts_low_accuracy_downgrades(): void
    {
        // 10 attempts 5 correct = 50% → learning (below practicing threshold)
        $this->assertSame(MasteryLevel::Learning, MasteryLevel::compute(10, 5));
    }

    public function test_five_attempts_below_85_stays_practicing(): void
    {
        // 5 attempts 4 correct = 80% → practicing, not mastered
        $this->assertSame(MasteryLevel::Practicing, MasteryLevel::compute(5, 4));
    }
}
