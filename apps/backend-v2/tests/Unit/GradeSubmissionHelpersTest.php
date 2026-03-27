<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Jobs\GradeSubmission;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class GradeSubmissionHelpersTest extends TestCase
{
    private GradeSubmission $job;

    protected function setUp(): void
    {
        parent::setUp();
        $this->job = new GradeSubmission('fake-id');
    }

    #[Test]
    #[DataProvider('normalizeScoresProvider')]
    public function it_normalizes_scores_to_half_increments(array $input, array $expected): void
    {
        $this->assertSame($expected, $this->invoke('normalizeScores', $input));
    }

    public static function normalizeScoresProvider(): array
    {
        return [
            'exact values unchanged' => [
                ['grammar' => 7.0, 'vocab' => 8.5],
                ['grammar' => 7.0, 'vocab' => 8.5],
            ],
            'rounds to nearest 0.5' => [
                ['grammar' => 7.3, 'vocab' => 8.7],
                ['grammar' => 7.5, 'vocab' => 8.5],
            ],
            'edge cases' => [
                ['a' => 7.25, 'b' => 7.74, 'c' => 7.75],
                ['a' => 7.5, 'b' => 7.5, 'c' => 8.0],
            ],
        ];
    }

    #[Test]
    #[DataProvider('parseConfidenceProvider')]
    public function it_parses_confidence_levels(string $input, string $expected): void
    {
        $this->assertSame($expected, $this->invoke('parseConfidence', $input));
    }

    public static function parseConfidenceProvider(): array
    {
        return [
            'high' => ['high', 'high'],
            'medium' => ['medium', 'medium'],
            'low' => ['low', 'low'],
            'uppercase' => ['HIGH', 'high'],
            'mixed case' => ['Medium', 'medium'],
            'with spaces' => [' low ', 'low'],
            'unknown defaults medium' => ['unknown', 'medium'],
            'empty defaults medium' => ['', 'medium'],
        ];
    }

    private function invoke(string $method, mixed ...$args): mixed
    {
        $ref = new ReflectionMethod(GradeSubmission::class, $method);

        return $ref->invoke($this->job, ...$args);
    }
}
