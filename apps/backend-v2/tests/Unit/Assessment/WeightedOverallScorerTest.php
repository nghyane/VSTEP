<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Data\CriterionScore;
use App\Assessment\Enums\CriterionKey;
use App\Assessment\Scoring\WeightedOverallScorer;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class WeightedOverallScorerTest extends TestCase
{
    public function test_calculates_weighted_half_band_score(): void
    {
        $scores = (new WeightedOverallScorer)->score([
            new CriterionScore(CriterionKey::TaskFulfillment, 7.0, 0.4),
            new CriterionScore(CriterionKey::Organization, 5.0, 0.2),
            new CriterionScore(CriterionKey::Grammar, 6.0, 0.2),
            new CriterionScore(CriterionKey::Vocabulary, 5.0, 0.2),
        ]);

        $this->assertSame(6.0, $scores->overallBand);
        $this->assertSame('weighted_average', $scores->calculationTrace['method']);
        $this->assertSame(1.0, $scores->calculationTrace['total_weight']);
    }

    public function test_normalizes_scores_and_weights(): void
    {
        $scores = (new WeightedOverallScorer)->score([
            new CriterionScore(CriterionKey::TaskFulfillment, 12.0, 2.0),
            new CriterionScore(CriterionKey::Grammar, -1.0, 1.0),
        ]);

        $this->assertSame(6.5, $scores->overallBand);
    }

    public function test_applies_content_cap_policy(): void
    {
        $scores = (new WeightedOverallScorer)->score([
            new CriterionScore(CriterionKey::TaskFulfillment, 2.0, 0.2),
            new CriterionScore(CriterionKey::Organization, 8.0, 0.2),
            new CriterionScore(CriterionKey::Grammar, 8.0, 0.3),
            new CriterionScore(CriterionKey::Vocabulary, 8.0, 0.3),
        ], [
            'content_caps' => [
                ['when_content_below' => 3.0, 'max_overall' => 4.0],
            ],
        ]);

        $this->assertSame(4.0, $scores->overallBand);
        $this->assertSame('content_cap', $scores->capsApplied['type']);
    }

    public function test_rejects_empty_criteria(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new WeightedOverallScorer)->score([]);
    }
}
