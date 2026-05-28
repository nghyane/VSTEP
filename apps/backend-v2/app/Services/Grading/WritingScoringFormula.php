<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\Params\GrammarParams;
use App\DTOs\Grading\Params\OrganizationParams;
use App\DTOs\Grading\Params\TaskFulfillmentParams;
use App\DTOs\Grading\Params\VocabularyParams;
use App\Models\GradingRubric;

final class WritingScoringFormula
{
    public function __construct(
        private readonly GradingRubric $rubric,
    ) {}

    public function taskFulfillmentParams(): TaskFulfillmentParams
    {
        return $this->rubric->taskFulfillmentParams();
    }

    public function grammar(array $syntax, int $languageToolErrors, int $sentenceCount): float
    {
        $p = $this->rubric->grammarParams();
        $typeCount = $syntax['count'] ?? 0;
        $gRange = $this->resolveBand($typeCount, $p->bandThresholds);

        $errorPenalty = $sentenceCount > 0 ? min(10.0, ($languageToolErrors / $sentenceCount) * $p->accuracyFactor) : 0;
        $maxAcc = $this->resolveMaxAccuracy($typeCount, $p->maxAccuracy);
        $gAccuracy = min($maxAcc, max(0.0, 10.0 - $errorPenalty));

        return $this->clampRound(($gRange + $gAccuracy) / 2);
    }

    public function vocabulary(array $metrics): float
    {
        $p = $this->rubric->vocabularyParams();

        $uniqueBonus = $this->resolveThreshold((float) ($metrics['unique_ratio'] ?? 0), $p->uniqueThresholds);
        $lengthBonus = $this->resolveThreshold((float) ($metrics['avg_word_length'] ?? 4), $p->lengthThresholds);
        $readabilityBonus = $this->resolveThreshold((float) ($metrics['readability_grade'] ?? 0), $p->readabilityThresholds);
        $complexBonus = $this->resolveThreshold((float) ($metrics['complex_vocab_count'] ?? 0), $p->complexThresholds);

        return min($p->cap, $this->clampRound($p->base + $uniqueBonus + $lengthBonus + $readabilityBonus + $complexBonus));
    }

    public function taskFulfillment(array $evidence): float
    {
        $p = $this->rubric->taskFulfillmentParams();
        $covered = max(0.0, (float) ($evidence['points_covered'] ?? 0));
        $required = max(1.0, (float) ($evidence['points_required'] ?? $p->defaultPointsRequired));
        $hasPosition = (bool) ($evidence['has_clear_position'] ?? false);
        $irrelevant = (bool) ($evidence['has_irrelevant_content'] ?? false);

        return $this->clampRound(
            ($covered / $required) * $p->coverageMultiplier
            + ($hasPosition ? $p->positionBonus : 0)
            - ($irrelevant ? $p->irrelevantPenalty : 0)
        );
    }

    public function organization(int $paragraphCount, int $linkingWordCount, int $sentenceCount, float $sentenceVariety = 0): float
    {
        $p = $this->rubric->organizationParams();
        $paraBonus = (int) ($p->paraBonus[$paragraphCount] ?? $p->paraBonus[1]);
        $linkingDensity = $sentenceCount > 0 ? $linkingWordCount / $sentenceCount : 0;
        $linkingBonus = min($p->linkingCap, $linkingDensity * $p->linkingDensityFactor);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p->varietyThresholds);
        $compactPenalty = ($sentenceCount > $p->compactThreshold && $paragraphCount === 1) ? $p->compactPenalty : 0;

        return $this->clampRound($p->base + $paraBonus + $linkingBonus + $varietyBonus - $compactPenalty);
    }

    private function resolveBand(int $value, array $thresholds): int
    {
        ksort($thresholds);
        $band = 5;
        foreach ($thresholds as $threshold => $b) {
            if ($value >= (int) $threshold) {
                $band = (int) $b;
            }
        }

        return $band;
    }

    /** @param list<array{threshold: float, bonus: int}> $thresholds */
    private function resolveThreshold(float $value, array $thresholds): int
    {
        $bonus = 0;
        foreach ($thresholds as $entry) {
            if ($value >= (float) ($entry['threshold'] ?? 0)) {
                $bonus = (int) ($entry['bonus'] ?? 0);
            }
        }

        return $bonus;
    }

    private function resolveMaxAccuracy(int $typeCount, array $maxAccuracy): float
    {
        foreach ($maxAccuracy as $range => $cap) {
            $parts = explode('-', (string) $range);
            $min = (int) $parts[0];
            $max = isset($parts[1]) ? (int) $parts[1] : 99;
            if ($typeCount >= $min && $typeCount <= $max) {
                return (float) $cap;
            }
        }

        return $typeCount >= 5 ? 10.0 : ($typeCount >= 3 ? 9.0 : 7.0);
    }

    private function clampRound(float $value): float
    {
        return round(max(1.0, min(10.0, $value)) * 2) / 2;
    }
}
