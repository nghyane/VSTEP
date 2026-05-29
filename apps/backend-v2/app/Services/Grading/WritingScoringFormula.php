<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\Params\TaskFulfillmentParams;
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

        $cefrAvg = (float) ($metrics['cefr_weighted_avg'] ?? 0);
        $cefrAdvanced = (float) ($metrics['cefr_advanced_ratio'] ?? 0);

        $cefrBonus = $this->resolveThreshold($cefrAvg, $p->cefrThresholds);
        $advancedBonus = $this->resolveThreshold($cefrAdvanced, $p->advancedThresholds);

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

        $multiplier = $part === 1 ? $p->task1Multiplier : $p->coverageMultiplier;

        // Short essay caps from rubric params
        $wordCount = (int) ($evidence['word_count'] ?? 0);
        foreach ($p->shortEssayCaps as $cap) {
            if ($wordCount > 0 && $wordCount < (int) ($cap['max_words'] ?? 0)) {
                $multiplier = min($multiplier, (float) ($cap['cap'] ?? $multiplier));
                break;
            }
        }

        if ($depthFactor < $p->depthMinimum && $covered > 0) {
            $depthFactor = $p->depthMinimum;
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

    /**
     * Deterministic insights showing how each score was derived.
     */
    public function insights(
        array $syntax,
        array $metrics,
        array $evidence,
        int $paragraphCount,
        int $part = 2,
    ): array {
        $typeCount = $syntax['count'] ?? 0;
        $wordCount = (int) ($metrics['word_count'] ?? 0);
        $sentenceCount = (int) ($metrics['sentence_count'] ?? 0);
        $linkingCount = (int) ($metrics['linking_word_count'] ?? 0);
        $uniqueRatio = round((float) ($metrics['unique_ratio'] ?? 0) * 100);
        $avgWordLen = round((float) ($metrics['avg_word_length'] ?? 0), 1);
        $covered = (int) ($evidence['points_covered'] ?? 0);
        $required = (int) ($evidence['points_required'] ?? 1);

        return [
            'grammar' => [
                'label' => 'Ngữ pháp',
                'detail' => "Sử dụng $typeCount kiểu cấu trúc, $sentenceCount câu, lỗi: {$metrics['grammar_error_count']} lỗi.",
            ],
            'vocabulary' => [
                'label' => 'Từ vựng',
                'detail' => "Độ đa dạng: $uniqueRatio%, độ dài từ TB: $avgWordLen ký tự, từ phức: {$metrics['complex_vocab_count']} từ.",
            ],
            'task_fulfillment' => [
                'label' => 'Hoàn thành yêu cầu',
                'detail' => "Đáp ứng $covered/$required yêu cầu đề bài"
                    .($part === 1 ? ' (Task 1: thư/email)' : ' (Task 2: bài luận)')
                    .'.',
            ],
            'organization' => [
                'label' => 'Tổ chức bài viết',
                'detail' => "$paragraphCount đoạn, $linkingCount từ nối, $sentenceCount câu.",
            ],
        ];
    }
}
