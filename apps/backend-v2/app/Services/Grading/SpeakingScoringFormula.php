<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;

/**
 * Deterministic speaking scoring formulas driven by rubric params.
 *
 * Grammar, vocabulary, fluency, pronunciation: fully deterministic.
 * Discourse: structural score modulated by LLM content factor.
 * All thresholds from rubric params — configurable without code change.
 */
final class SpeakingScoringFormula
{
    public function __construct(
        private readonly GradingRubric $rubric,
    ) {}

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

    public function fluency(float $speakingRate, int $pauseCount, int $wordCount): float
    {
        $p = $this->rubric->fluencyParams();
        $rateBonus = $this->resolveThreshold($speakingRate, $p->wpmThresholds);

        $pausesPer100 = $wordCount > 0 ? ($pauseCount / $wordCount) * 100 : 0;
        $pausePenalty = $pausesPer100 > 15 ? 2 : ($pausesPer100 > 8 ? 1 : 0);

        return $this->clampRound($p->base + $rateBonus - $pausePenalty);
    }

    public function discourse(int $linkingWordCount, float $sentenceVariety, float $contentFactor = 1.0): float
    {
        $p = $this->rubric->discourseParams();
        $linkingBonus = min($p->linkingCap, $linkingWordCount * $p->linkingFactor);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p->varietyThresholds);

        $structuralScore = $this->clampRound($p->base + $linkingBonus + $varietyBonus);
        $factor = max(0.7, min(1.0, $contentFactor));

        return $this->clampRound($structuralScore * $factor);
    }

    public function pronunciation(float $azureScore): float
    {
        return $this->clampRound($azureScore);
    }

    /* ─── Helpers ─── */

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
