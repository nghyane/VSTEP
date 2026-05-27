<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;

/**
 * Deterministic speaking scoring formulas driven by rubric params.
 *
 * 4/5 criteria are deterministic (grammar, vocabulary, fluency, discourse).
 * Pronunciation uses LLM scoring (the only subjective criterion).
 * All thresholds from rubric params — configurable without code change.
 */
final class SpeakingScoringFormula
{
    /** @var array<string, array> */
    private array $params = [];

    public function __construct(
        private readonly GradingRubric $rubric,
    ) {
        foreach ($rubric->criteria as $criterion) {
            $key = $criterion['key'] ?? '';
            if ($key !== '') {
                $this->params[$key] = $criterion['params'] ?? [];
            }
        }
    }

    /** Grammar: same formula as writing — structure range + accuracy. */
    public function grammar(array $syntax, int $languageToolErrors, int $sentenceCount): float
    {
        $p = $this->params['grammar'];
        $typeCount = $syntax['count'] ?? 0;
        $gRange = $this->resolveBand($typeCount, $p['band_thresholds']);

        $factor = (float) $p['accuracy_factor'];
        $errorPenalty = $sentenceCount > 0 ? min(10.0, ($languageToolErrors / $sentenceCount) * $factor) : 0;

        $maxAcc = $this->resolveMaxAccuracy($typeCount, $p['max_accuracy']);
        $gAccuracy = min($maxAcc, max(0.0, 10.0 - $errorPenalty));

        return $this->clampRound(($gRange + $gAccuracy) / 2);
    }

    /** Vocabulary: unique ratio + word length + readability + complex words. */
    public function vocabulary(array $metrics): float
    {
        $p = $this->params['vocabulary'];
        $uniqueRatio = (float) ($metrics['unique_ratio'] ?? 0);
        $avgWordLength = (float) ($metrics['avg_word_length'] ?? 4);

        $uniqueBonus = $this->resolveThreshold($uniqueRatio, $p['unique_thresholds']);
        $lengthBonus = $this->resolveThreshold($avgWordLength, $p['length_thresholds']);

        $readability = (float) ($metrics['readability_grade'] ?? 0);
        $readabilityBonus = $readability > 10 ? 2 : ($readability > 8 ? 1 : 0);

        $complexCount = (int) ($metrics['complex_vocab_count'] ?? 0);
        $complexBonus = $complexCount > 5 ? 2 : ($complexCount > 2 ? 1 : 0);

        return min((float) $p['cap'], $this->clampRound((int) $p['base'] + $uniqueBonus + $lengthBonus + $readabilityBonus + $complexBonus));
    }

    /** Fluency: speaking rate + pause frequency from STT word-level timing. */
    public function fluency(float $speakingRate, int $pauseCount, int $wordCount): float
    {
        $p = $this->params['fluency'];
        $rateBonus = $this->resolveThreshold($speakingRate, $p['wpm_thresholds']);

        // Pause penalty: pauses per 100 words
        $pausesPer100 = $wordCount > 0 ? ($pauseCount / $wordCount) * 100 : 0;
        $pausePenalty = $pausesPer100 > 15 ? 2 : ($pausesPer100 > 8 ? 1 : 0);

        return $this->clampRound((int) $p['base'] + $rateBonus - $pausePenalty);
    }

    /** Discourse: linking words + sentence variety × content relevance. */
    public function discourse(int $linkingWordCount, float $sentenceVariety, float $contentFactor = 1.0): float
    {
        $p = $this->params['discourse_management'];
        $linkingBonus = min((float) $p['linking_cap'], $linkingWordCount * (float) $p['linking_factor']);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p['variety_thresholds']);

        $structuralScore = $this->clampRound((int) $p['base'] + $linkingBonus + $varietyBonus);

        // Content factor modulates structural score by 0.5-1.0
        $factor = max(0.5, min(1.0, $contentFactor));

        return $this->clampRound($structuralScore * $factor);
    }

    /** Task Fulfillment: LLM evidence (same formula as writing). */
    public function taskFulfillment(array $evidence): float
    {
        $p = $this->params['task_fulfillment'];
        $covered = max(0, (int) ($evidence['points_covered'] ?? 0));
        $required = max(1, (int) ($evidence['points_required'] ?? $p['default_points_required']));
        $hasPosition = (bool) ($evidence['has_clear_position'] ?? false);
        $irrelevant = (bool) ($evidence['has_irrelevant_content'] ?? false);

        return $this->clampRound(
            ($covered / $required) * $p['coverage_multiplier']
            + ($hasPosition ? $p['position_bonus'] : 0)
            - ($irrelevant ? $p['irrelevant_penalty'] : 0)
        );
    }

    /** Pronunciation: Azure PA score or STT confidence fallback. */
    public function pronunciation(float $llmScore): float
    {
        return $this->clampRound($llmScore);
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
