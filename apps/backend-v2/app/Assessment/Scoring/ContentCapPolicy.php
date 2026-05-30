<?php

declare(strict_types=1);

namespace App\Assessment\Scoring;

use App\Assessment\Data\CriterionScore;
use App\Assessment\Enums\CriterionKey;

final readonly class ContentCapPolicy
{
    public function __construct(
        private ScoreNormalizer $normalizer = new ScoreNormalizer,
    ) {}

    /**
     * @param  list<CriterionScore>  $criterionScores
     * @param  array<string,mixed>  $policy
     * @return array{score: float, caps: array<string,mixed>}
     */
    public function apply(float $score, array $criterionScores, array $policy): array
    {
        $caps = $policy['content_caps'] ?? [];
        if (! is_array($caps) || $caps === []) {
            return ['score' => $score, 'caps' => []];
        }

        $contentScore = $this->contentScore($criterionScores);
        if ($contentScore === null) {
            return ['score' => $score, 'caps' => []];
        }

        foreach ($caps as $cap) {
            if (! is_array($cap)) {
                continue;
            }

            $threshold = $cap['when_content_below'] ?? null;
            $maxOverall = $cap['max_overall'] ?? null;

            if (! is_numeric($threshold) || ! is_numeric($maxOverall)) {
                continue;
            }

            if ($contentScore < (float) $threshold && $score > (float) $maxOverall) {
                return [
                    'score' => $this->normalizer->halfBand((float) $maxOverall),
                    'caps' => [
                        'type' => 'content_cap',
                        'content_score' => $contentScore,
                        'threshold' => (float) $threshold,
                        'max_overall' => (float) $maxOverall,
                    ],
                ];
            }
        }

        return ['score' => $score, 'caps' => []];
    }

    /** @param list<CriterionScore> $criterionScores */
    private function contentScore(array $criterionScores): ?float
    {
        foreach ($criterionScores as $criterionScore) {
            if ($criterionScore->key === CriterionKey::TaskFulfillment || $criterionScore->key === CriterionKey::ContentRelevance) {
                return $criterionScore->score;
            }
        }

        return null;
    }
}
