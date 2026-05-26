<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;
use RuntimeException;

/**
 * Deterministic scoring formulas driven by rubric params.
 *
 * All thresholds and weights are read from the active grading rubric's `params` field.
 * Changing the rubric (via seeder) changes scoring behavior — no code change needed.
 *
 * Rubric is the single source of truth for scoring parameters.
 * Architecture follows Laravel convention: rubric is injected, not queried internally.
 */
final class WritingScoringFormula
{
    /** @var array<string, array> Cached criterion params keyed by criterion key. */
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

    public function vocabulary(array $metrics): float
    {
        $p = $this->params['vocabulary'];
        $uniqueRatio = (float) ($metrics['unique_ratio'] ?? 0);
        $avgWordLength = (float) ($metrics['avg_word_length'] ?? 4);

        $uniqueBonus = $this->resolveThreshold($uniqueRatio, $p['unique_thresholds']);
        $lengthBonus = $this->resolveThreshold($avgWordLength, $p['length_thresholds']);

        $base = (int) $p['base'];
        $cap = (float) $p['cap'];

        return min($cap, $this->clampRound($base + $uniqueBonus + $lengthBonus));
    }

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

    public function organization(int $paragraphCount, int $linkingWordCount, int $sentenceCount, float $sentenceVariety = 0): float
    {
        $p = $this->params['organization'];
        $paraBonus = (int) ($p['para_bonus'][$paragraphCount] ?? $p['para_bonus'][1]);
        $linkingBonus = min((float) $p['linking_cap'], $linkingWordCount * (float) $p['linking_factor']);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p['variety_thresholds']);
        $compactPenalty = ($sentenceCount > (int) $p['compact_threshold'] && $paragraphCount === 1)
            ? (float) $p['compact_penalty'] : 0;

        return $this->clampRound((float) $p['base'] + $paraBonus + $linkingBonus + $varietyBonus - $compactPenalty);
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
