<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\VstepBand;
use App\Support\VstepScoring;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class VstepScoringTest extends TestCase
{
    #[Test]
    #[DataProvider('roundProvider')]
    public function it_rounds_using_vstep_rules(float $input, float $expected): void
    {
        $this->assertSame($expected, VstepScoring::round($input));
    }

    public static function roundProvider(): array
    {
        return [
            'exact integer' => [7.0, 7.0],
            'below 0.25 floors' => [7.1, 7.0],
            'below 0.25 floors edge' => [7.24, 7.0],
            'at 0.25 rounds to 0.5' => [7.25, 7.5],
            'between 0.25-0.75 rounds to 0.5' => [7.5, 7.5],
            'at 0.74 rounds to 0.5' => [7.74, 7.5],
            'at 0.75 rounds to ceil' => [7.75, 8.0],
            'above 0.75 rounds to ceil' => [7.9, 8.0],
            'zero' => [0.0, 0.0],
            'ten' => [10.0, 10.0],
            'small decimal' => [0.1, 0.0],
            'near half' => [0.4, 0.5],
            'near one' => [0.8, 1.0],
        ];
    }

    #[Test]
    #[DataProvider('scoreProvider')]
    public function it_converts_ratio_to_vstep_scale(float $ratio, float $expected): void
    {
        $this->assertSame($expected, VstepScoring::score($ratio));
    }

    public static function scoreProvider(): array
    {
        return [
            'perfect' => [1.0, 10.0],
            'zero' => [0.0, 0.0],
            'half' => [0.5, 5.0],
            '70%' => [0.7, 7.0],
            '73%' => [0.73, 7.5],
            '78%' => [0.78, 8.0],
            '33%' => [0.33, 3.5],
        ];
    }

    #[Test]
    #[DataProvider('writingOverallProvider')]
    public function it_calculates_writing_overall(float $task1, float $task2, float $expected): void
    {
        $this->assertSame($expected, VstepScoring::writingOverall($task1, $task2));
    }

    public static function writingOverallProvider(): array
    {
        // Formula: (Task1 + Task2 × 2) / 3
        return [
            'equal scores' => [6.0, 6.0, 6.0],
            'task2 weighs double' => [6.0, 9.0, 8.0],
            'low task1 high task2' => [3.0, 9.0, 7.0],
            'high task1 low task2' => [9.0, 3.0, 5.0],
            'both perfect' => [10.0, 10.0, 10.0],
            'both zero' => [0.0, 0.0, 0.0],
        ];
    }

    #[Test]
    #[DataProvider('speakingOverallProvider')]
    public function it_calculates_speaking_overall(array $parts, float $expected): void
    {
        $this->assertSame($expected, VstepScoring::speakingOverall(...$parts));
    }

    public static function speakingOverallProvider(): array
    {
        return [
            'single part' => [[7.0], 7.0],
            'two parts average' => [[6.0, 8.0], 7.0],
            'three parts average' => [[6.0, 7.0, 8.0], 7.0],
            'three parts with rounding' => [[6.0, 7.0, 7.0], 6.5],
            'empty' => [[], 0.0],
        ];
    }

    #[Test]
    #[DataProvider('bandProvider')]
    public function it_resolves_band_from_score(float $score, ?VstepBand $expected): void
    {
        $this->assertSame($expected, VstepScoring::band($score));
    }

    public static function bandProvider(): array
    {
        return [
            'C1 threshold' => [8.5, VstepBand::C1],
            'C1 perfect' => [10.0, VstepBand::C1],
            'B2 threshold' => [6.0, VstepBand::B2],
            'B2 high' => [8.0, VstepBand::B2],
            'B1 threshold' => [4.0, VstepBand::B1],
            'B1 mid' => [5.5, VstepBand::B1],
            'below B1' => [3.5, null],
            'zero' => [0.0, null],
        ];
    }
}
