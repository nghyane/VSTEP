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
    private ?GradingRubric $rubric = null;

    public function __construct(
        private readonly RubricResolver $rubricResolver,
    ) {}

    public function grammar(array $syntax, int $languageToolErrors, int $sentenceCount): float
    {
        $p = $this->rubric()->grammarParams();
        $typeCount = $syntax['count'] ?? 0;
        $gRange = $this->resolveBand($typeCount, $p->bandThresholds);

        $errorPenalty = $sentenceCount > 0 ? min(10.0, ($languageToolErrors / $sentenceCount) * $p->accuracyFactor) : 0;
        $maxAcc = $this->resolveMaxAccuracy($typeCount, $p->maxAccuracy);
        $gAccuracy = min($maxAcc, max(0.0, 10.0 - $errorPenalty));

        return $this->clampRound(($gRange + $gAccuracy) / 2);
    }

    public function vocabulary(array $metrics): float
    {
        $p = $this->rubric()->vocabularyParams();

        $uniqueBonus = $this->resolveThreshold((float) ($metrics['unique_ratio'] ?? 0), $p->uniqueThresholds);
        $lengthBonus = $this->resolveThreshold((float) ($metrics['avg_word_length'] ?? 4), $p->lengthThresholds);
        $readabilityBonus = $this->resolveThreshold((float) ($metrics['readability_grade'] ?? 0), $p->readabilityThresholds);

        $cefrAvg = (float) ($metrics['cefr_weighted_avg'] ?? 0);
        $cefrAdvanced = (float) ($metrics['cefr_advanced_ratio'] ?? 0);

        $cefrBonus = $this->resolveThreshold($cefrAvg, $p->cefrThresholds);
        $advancedBonus = $this->resolveThreshold($cefrAdvanced, $p->advancedThresholds);

        $complexCount = (int) ($metrics['complex_vocab_count'] ?? 0);
        $complexBonus = $this->resolveThreshold((float) $complexCount, $p->complexThresholds);

        $vocabDepth = max($cefrBonus + $advancedBonus, $complexBonus);

        return min($p->cap, $this->clampRound($p->base + $uniqueBonus + $lengthBonus + $readabilityBonus + $vocabDepth));
    }

    public function fluency(float $speakingRate, int $pauseCount, int $wordCount): float
    {
        $p = $this->rubric()->fluencyParams();
        $rateBonus = $this->resolveThreshold($speakingRate, $p->wpmThresholds);

        $pausesPer100 = $wordCount > 0 ? ($pauseCount / $wordCount) * 100 : 0;
        $pausePenalty = $pausesPer100 > 15 ? 2 : ($pausesPer100 > 8 ? 1 : 0);

        return $this->clampRound($p->base + $rateBonus - $pausePenalty);
    }

    public function discourse(int $linkingWordCount, float $sentenceVariety, float $contentFactor = 1.0): float
    {
        $p = $this->rubric()->discourseParams();
        $linkingBonus = min($p->linkingCap, $linkingWordCount * $p->linkingFactor);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p->varietyThresholds);

        $structuralScore = $this->clampRound($p->base + $linkingBonus + $varietyBonus);
        $factor = max(0.7, min(1.0, $contentFactor));

        return $this->clampRound($structuralScore * $factor);
    }

    /** @param array<string,mixed>|float $signals */
    public function pronunciation(array|float $signals): float
    {
        if (is_float($signals)) {
            return $this->clampRound($signals);
        }

        $accuracy = (float) ($signals['accuracy'] ?? $signals['overall'] ?? 0.0);
        $fluency = (float) ($signals['fluency'] ?? $signals['overall'] ?? 0.0);
        $prosody = (float) ($signals['prosody'] ?? $signals['overall'] ?? 0.0);
        $completeness = (float) ($signals['completeness'] ?? $signals['overall'] ?? 0.0);

        $base = ($accuracy * 0.45)
            + ($fluency * 0.20)
            + ($prosody * 0.20)
            + ($completeness * 0.15);

        return $this->clampRound($base - $this->pronunciationPenalty($signals));
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

    /**
     * Generate deterministic insights explaining how each score was derived.
     * Used for fallback feedback and score transparency.
     *
     * @param  array<string,mixed>  $pronunciation
     * @return array<string, array{label: string, detail: string}>
     */
    public function insights(
        array $syntax,
        array $metrics,
        float $speakingRate,
        int $pauseCount,
        int $sttWordCount,
        float $sentenceVariety,
        float $contentFactor,
        float|array $pronunciation,
    ): array {
        $typeCount = $syntax['count'] ?? 0;
        $pausesPer100 = $sttWordCount > 0 ? round(($pauseCount / $sttWordCount) * 100, 1) : 0;
        $linkingCount = (int) ($metrics['linking_word_count'] ?? 0);
        $pronunciationSignals = is_array($pronunciation) ? $pronunciation : ['overall' => $pronunciation];

        return [
            'grammar' => [
                'label' => 'Ngữ pháp',
                'detail' => "Sử dụng $typeCount kiểu cấu trúc ngữ pháp khác nhau.",
            ],
            'vocabulary' => [
                'label' => 'Từ vựng',
                'detail' => 'Độ đa dạng từ: '.round((float) ($metrics['unique_ratio'] ?? 0) * 100).'%, '
                    .'độ dài từ trung bình: '.round((float) ($metrics['avg_word_length'] ?? 0), 1).' ký tự.',
            ],
            'fluency' => [
                'label' => 'Độ trôi chảy',
                'detail' => 'Tốc độ nói: '.round($speakingRate).' từ/phút, '
                    ."ngập ngừng: $pauseCount lần ($pausesPer100 lần/100 từ).",
            ],
            'discourse_management' => [
                'label' => 'Tổ chức ý',
                'detail' => "Từ nối: $linkingCount, độ đa dạng câu: ".round($sentenceVariety, 2)
                    .($contentFactor < 1.0 ? ' (nội dung chưa bám sát yêu cầu đề)' : ''),
            ],
            'pronunciation' => [
                'label' => 'Phát âm',
                'detail' => $this->pronunciationInsight($pronunciationSignals),
            ],
        ];
    }

    /** @param array<string,mixed> $pronunciation */
    private function pronunciationInsight(array $pronunciation): string
    {
        $formulaScore = $this->pronunciation($pronunciation);
        $detail = 'Azure pronunciation: overall '.round((float) ($pronunciation['overall'] ?? 0), 1).'/10'
            .', accuracy '.round((float) ($pronunciation['accuracy'] ?? 0), 1)
            .', fluency '.round((float) ($pronunciation['fluency'] ?? 0), 1)
            .', prosody '.round((float) ($pronunciation['prosody'] ?? 0), 1);

        if (isset($pronunciation['completeness'])) {
            $detail .= ', completeness '.round((float) $pronunciation['completeness'], 1);
        }

        $mispronunciations = (int) ($pronunciation['mispronunciation_count'] ?? 0);
        $unexpectedBreaks = (int) ($pronunciation['unexpected_break_count'] ?? 0);
        $missingBreaks = (int) ($pronunciation['missing_break_count'] ?? 0);
        $monotone = (int) ($pronunciation['monotone_count'] ?? 0);

        return $detail.'. Transparent score: '.round($formulaScore, 1).'/10 after rubric penalties.'
            ." Word-level evidence: {$mispronunciations} mispronunciation(s), "
            ."{$unexpectedBreaks} unexpected break(s), {$missingBreaks} missing break(s), {$monotone} monotone marker(s).";
    }

    /** @param array<string,mixed> $signals */
    private function pronunciationPenalty(array $signals): float
    {
        $wordCount = max(1, (int) ($signals['word_count'] ?? 100));
        $mispronunciations = (int) ($signals['mispronunciation_count'] ?? 0);
        $breakErrors = (int) ($signals['unexpected_break_count'] ?? 0) + (int) ($signals['missing_break_count'] ?? 0);
        $monotoneMarkers = (int) ($signals['monotone_count'] ?? 0);

        return min(1.0, ($mispronunciations / $wordCount) * 20)
            + min(0.5, ($breakErrors / $wordCount) * 10)
            + min(0.5, ($monotoneMarkers / $wordCount) * 10);
    }

    private function rubric(): GradingRubric
    {
        return $this->rubric ??= $this->rubricResolver->active('speaking');
    }
}
