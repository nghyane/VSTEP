<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\Params\OrganizationParams;
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

    /**
     * Apply TF ratio cap to prevent task fulfillment from dominating
     * when the other criteria are significantly lower.
     *
     * TF ≤ avg(grammar, vocabulary, organization) × tf_cap_ratio
     *
     * @param  array<string,float>  $rubricScores
     * @return array{overallBand: float, rubricScores: array<string,float>}
     */
    public function applyTfCap(array $rubricScores, GradingRubric $rubric): array
    {
        $tfParams = $rubric->taskFulfillmentParams();
        $ratio = $tfParams->tfCapRatio;

        if ($ratio <= 0) {
            return [
                'overallBand' => $rubric->computeOverallBand($rubricScores),
                'rubricScores' => $rubricScores,
            ];
        }

        $avgOther = ($rubricScores['grammar'] + $rubricScores['vocabulary'] + $rubricScores['organization']) / 3;
        $capped = $avgOther * $ratio;

        if ($rubricScores['task_fulfillment'] > $capped) {
            $rubricScores['task_fulfillment'] = round($capped * 2) / 2;
        }

        return [
            'overallBand' => $rubric->computeOverallBand($rubricScores),
            'rubricScores' => $rubricScores,
        ];
    }

    public function grammar(array $syntax, int $grammarErrorCount, int $sentenceCount, int $punctuationErrorCount = 0): float
    {
        $p = $this->rubric->grammarParams();
        $typeCount = $syntax['count'] ?? 0;
        $gRange = $this->resolveBand($typeCount, $p->bandThresholds);

        $errorPenalty = $sentenceCount > 0 ? min(10.0, ($grammarErrorCount / $sentenceCount) * $p->accuracyFactor) : 0;
        $maxAcc = $this->resolveMaxAccuracy($typeCount, $p->maxAccuracy);
        $gAccuracy = min($maxAcc, max(0.0, 10.0 - $errorPenalty));

        $score = $this->clampRound(($gRange + $gAccuracy) / 2);

        // Punctuation sub-signal (from rubric DB)
        $punct = $this->rubric->subSignalParams('grammar', 'punctuation');
        if ($punct !== [] && $score > 0) {
            $score = $this->blendSubSignal($score, $punctuationErrorCount, $punct);
        }

        return $score;
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

        $score = min($p->cap, $this->clampRound($p->base + $uniqueBonus + $lengthBonus + $readabilityBonus + $vocabDepth));

        // Spelling sub-signal (from rubric DB)
        $spelling = $this->rubric->subSignalParams('vocabulary', 'spelling');
        if ($spelling !== [] && $score > 0) {
            $spellingCount = (int) ($metrics['spelling_error_count'] ?? 0);
            $score = $this->blendSubSignal($score, $spellingCount, $spelling);
        }

        return $score;
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

        $wordCount = array_key_exists('word_count', $evidence) ? max(0, (int) $evidence['word_count']) : null;
        $multiplier = $part === 1 ? $p->task1Multiplier : $p->coverageMultiplier;

        if ($depthFactor < $p->depthMinimum && $covered > 0) {
            $depthFactor = $p->depthMinimum;
        }

        $score = $this->clampRound(
            ($covered / $required) * $multiplier
            + $depthFactor * 3
            + ($hasExamples ? $p->positionBonus : 0)
            + ($hasPosition ? $p->positionBonus : 0)
            - ($irrelevant ? $p->irrelevantPenalty : 0)
        );

        $taskFulfillmentCap = $wordCount === null ? null : $p->taskFulfillmentScoreCap($wordCount);
        if ($taskFulfillmentCap !== null) {
            $score = min($score, $taskFulfillmentCap);
        }

        // Tone/register sub-signal (from rubric DB)
        $tone = $this->rubric->subSignalParams('task_fulfillment', 'tone_register');
        if ($tone !== [] && $score > 0) {
            $informalCount = (int) ($evidence['tone_informal_count'] ?? 0);
            // Part 2: penalize informal signals in academic essay
            if ($part === 2) {
                $score = $this->blendSubSignal($score, $informalCount, $tone['part2'] ?? $tone);
            }
        }

        return $score;
    }

    /**
     * @param  array<string,float>  $rubricScores
     * @return array{rubricScores: array<string,float>, capApplied: null|array<string,mixed>}
     */
    public function applyShortResponseCap(array $rubricScores, int $wordCount, GradingRubric $rubric): array
    {
        $cap = $rubric->taskFulfillmentParams()->shortResponseScoreCap($wordCount);

        if ($cap === null) {
            return ['rubricScores' => $rubricScores, 'capApplied' => null];
        }

        return [
            'rubricScores' => array_map(fn (float $score): float => min($score, $cap), $rubricScores),
            'capApplied' => ['word_count' => $wordCount, 'cap' => $cap],
        ];
    }

    public function organization(int $paragraphCount, int $linkingWordCount, int $sentenceCount, float $sentenceVariety = 0, int $part = 2, bool $hasSalutation = false, bool $hasClosing = false): float
    {
        $p = $this->rubric->organizationParams();

        if ($part === 1) {
            return $this->organizationLetter($paragraphCount, $linkingWordCount, $sentenceCount, $sentenceVariety, $hasSalutation, $hasClosing, $p);
        }

        return $this->organizationEssay($paragraphCount, $linkingWordCount, $sentenceCount, $sentenceVariety, $p);
    }

    private function organizationLetter(int $paragraphCount, int $linkingWordCount, int $sentenceCount, float $sentenceVariety, bool $hasSalutation, bool $hasClosing, OrganizationParams $p): float
    {
        $paraBonus = match (true) {
            $paragraphCount >= 2 => 3,
            $paragraphCount === 1 => 2,
            default => (int) ($p->paraBonus[1] ?? 1),
        };

        $linkingDensity = $sentenceCount > 0 ? $linkingWordCount / $sentenceCount : 0;
        $letterLinkingCap = min($p->linkingCap, 2);
        $linkingBonus = min($letterLinkingCap, $linkingDensity * $p->linkingDensityFactor);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p->varietyThresholds);

        // Letter format bonus: salutation + closing
        $formatBonus = ($hasSalutation ? 1 : 0) + ($hasClosing ? 1 : 0);

        // No compact penalty for letters
        return $this->clampRound($p->base + $paraBonus + $linkingBonus + $varietyBonus + $formatBonus);
    }

    private function organizationEssay(int $paragraphCount, int $linkingWordCount, int $sentenceCount, float $sentenceVariety, OrganizationParams $p): float
    {
        $paraBonus = (int) ($p->paraBonus[$paragraphCount] ?? $p->paraBonus[1]);

        $linkingDensity = $sentenceCount > 0 ? $linkingWordCount / $sentenceCount : 0;
        $linkingBonus = min($p->linkingCap, $linkingDensity * $p->linkingDensityFactor);
        $varietyBonus = $this->resolveThreshold($sentenceVariety, $p->varietyThresholds);
        $compactPenalty = ($sentenceCount > $p->compactThreshold && $paragraphCount === 1) ? $p->compactPenalty : 0;

        return $this->clampRound($p->base + $paraBonus + $linkingBonus + $varietyBonus - $compactPenalty);
    }

    private function resolveBand(int $value, array $thresholds): float
    {
        ksort($thresholds);
        $band = 5.0;
        foreach ($thresholds as $threshold => $b) {
            if ($value >= (int) $threshold) {
                $band = (float) $b;
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

    /**
     * Apply sub-signal penalty from rubric config.
     *
     * Config must have: weight, max_penalty, thresholds (from seeder — no fallbacks).
     *
     * @param  array{weight: float, max_penalty: float, thresholds: list<array{max_errors: int, penalty: float}>}  $config
     */
    private function blendSubSignal(float $mainScore, int $errorCount, array $config): float
    {
        if ($errorCount === 0 || $config === []) {
            return $mainScore;
        }

        $weight = (float) $config['weight'];
        $maxPenalty = (float) $config['max_penalty'];
        $thresholds = $config['thresholds'];

        $penalty = 0.0;
        foreach ($thresholds as $t) {
            if ($errorCount > (int) $t['max_errors']) {
                $penalty = (float) $t['penalty'];
            }
        }
        $penalty = min($maxPenalty, $penalty);

        return $this->clampRound($mainScore - $penalty * $weight);
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
                'detail' => "$paragraphCount đoạn, $linkingCount từ nối, $sentenceCount câu"
                    .($part === 1
                        ? (($metrics['has_salutation'] ?? false ? '; có lời chào' : '; thiếu lời chào')
                           .($metrics['has_closing'] ?? false ? ', có lời kết' : ', thiếu lời kết'))
                        : '')
                    .'.',
            ],
        ];
    }
}
