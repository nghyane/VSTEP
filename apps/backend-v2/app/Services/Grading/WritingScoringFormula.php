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

        // CEFR-level vocabulary scoring (replaces hardcoded complex_vocab_count)
        $cefrAvg = (float) ($metrics['cefr_weighted_avg'] ?? 0);
        $cefrAdvanced = (float) ($metrics['cefr_advanced_ratio'] ?? 0);

        $cefrBonus = match (true) {
            $cefrAvg >= 4.0 => 5,
            $cefrAvg >= 3.5 => 4,
            $cefrAvg >= 3.0 => 3,
            $cefrAvg >= 2.5 => 2,
            $cefrAvg >= 2.0 => 1,
            default => 0,
        };

        $advancedBonus = match (true) {
            $cefrAdvanced >= 0.3 => 2,
            $cefrAdvanced >= 0.15 => 1,
            default => 0,
        };

        // Fallback: use complex_vocab_count if CEFR data insufficient
        $complexCount = (int) ($metrics['complex_vocab_count'] ?? 0);
        $complexBonus = $this->resolveThreshold((float) $complexCount, $p->complexThresholds);

        $vocabDepth = max($cefrBonus + $advancedBonus, $complexBonus);

        return min($p->cap, $this->clampRound($p->base + $uniqueBonus + $lengthBonus + $readabilityBonus + $vocabDepth));
    }

    public function taskFulfillment(array $evidence, int $part = 2): float
    {
        $p = $this->rubric->taskFulfillmentParams();
        $covered = max(0.0, (float) ($evidence['points_covered'] ?? 0));
        $required = max(1.0, (float) ($evidence['points_required'] ?? $p->defaultPointsRequired));
        $depthFactor = (float) ($evidence['depth_factor'] ?? 0);
        $hasExamples = (bool) ($evidence['has_examples'] ?? false);
        $hasPosition = (bool) ($evidence['has_clear_position'] ?? false);
        $irrelevant = (bool) ($evidence['has_irrelevant_content'] ?? false);

        // Task 1 letters: shorter, fewer requirements → lower coverage weight
        $multiplier = $part === 1 ? 6 : $p->coverageMultiplier;

        // Short essays: cap TF to prevent over-scoring empty content
        $wordCount = (int) ($evidence['word_count'] ?? 0);
        if ($wordCount > 0 && $wordCount < 80) {
            $multiplier = min($multiplier, 4);
        } elseif ($wordCount > 0 && $wordCount < 120) {
            $multiplier = min($multiplier, 6);
        }

        // Minimum depth when any requirement is covered (implicit development)
        if ($depthFactor < 0.25 && $covered > 0) {
            $depthFactor = 0.25;
        }

        return $this->clampRound(
            ($covered / $required) * $multiplier
            + $depthFactor * 3
            + ($hasExamples ? $p->positionBonus : 0)
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
