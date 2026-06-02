<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\GradingRubric;
use App\Services\Grading\WritingScoringFormula;

final class RubricSimulatorService
{
    public function __construct(
        private readonly WritingScoringFormula $formula,
    ) {}

    /** @return array<string,mixed> */
    public function simulate(GradingRubric $rubric, array $input): array
    {
        if ($rubric->skill !== 'writing') {
            return [
                'assessable' => null,
                'error' => 'Simulation is only available for Writing rubrics.',
            ];
        }

        $params = $rubric->taskFulfillmentParams();
        $part = (int) ($input['part'] ?? 2);
        $wordCount = (int) ($input['word_count'] ?? 0);
        $coveredPoints = (int) ($input['covered_points'] ?? 0);
        $severeMin = $params->severeMinimumWords($part);
        $officialMin = $part === 1 ? $params->wordMinimumTask1 : $params->wordMinimumTask2;

        // ── Gate checks ──────────────────────────────────────────
        $wordCheck = [
            'passed' => $wordCount >= $severeMin,
            'actual' => $wordCount,
            'required' => $severeMin,
        ];
        $coverageCheck = [
            'passed' => $coveredPoints >= $params->minimumCoveredPoints,
            'actual' => $coveredPoints,
            'required' => $params->minimumCoveredPoints,
        ];

        // System-level gates (not admin configurable, shown for transparency)
        $systemGates = [
            'non_english' => [
                'enabled' => true,
                'description' => 'Hệ thống từ chối bài viết không phải tiếng Anh.',
            ],
            'copied_prompt' => [
                'enabled' => true,
                'description' => 'Hệ thống phát hiện bài làm sao chép lại đề bài.',
            ],
            'empty_text' => [
                'enabled' => true,
                'description' => 'Hệ thống từ chối bài nộp rỗng.',
            ],
            'profanity' => [
                'enabled' => true,
                'description' => 'Cảnh báo nếu bài có từ ngữ không phù hợp (không chặn điểm).',
            ],
        ];

        $assessable = $wordCheck['passed'] && $coverageCheck['passed'];

        $failedRequirements = [];
        if (! $wordCheck['passed']) {
            $failedRequirements[] = 'severe_minimum_word_count';
        }
        if (! $coverageCheck['passed']) {
            $failedRequirements[] = 'task_coverage';
        }

        $details = [
            'word_check' => $wordCheck,
            'coverage_check' => $coverageCheck,
            'below_official_minimum' => $wordCount < $officialMin,
            'official_minimum' => $officialMin,
            'part' => $part,
            'short_response_caps' => $params->shortResponseCaps,
            'task_fulfillment_word_caps' => $params->taskFulfillmentWordCaps,
            'system_gates' => $systemGates,
        ];

        if (! $assessable) {
            return [
                'assessable' => false,
                'overall_band' => null,
                'criterion_scores' => null,
                'caps_applied' => [
                    'type' => 'assessment_requirements_not_met',
                    'failed_requirements' => $failedRequirements,
                ],
                'details' => $details,
            ];
        }

        // ── Score calculation (only if scores provided) ──────────
        $rawScores = [
            'task_fulfillment' => (float) ($input['scores']['task_fulfillment'] ?? $input['scores']['Task Fulfillment'] ?? 0),
            'organization' => (float) ($input['scores']['organization'] ?? $input['scores']['Organization'] ?? 0),
            'grammar' => (float) ($input['scores']['grammar'] ?? $input['scores']['Grammar'] ?? 0),
            'vocabulary' => (float) ($input['scores']['vocabulary'] ?? $input['scores']['Vocabulary'] ?? 0),
        ];

        $hasScores = array_filter($rawScores, fn (float $v): bool => $v > 0) !== [];

        $criterionScores = null;
        $overallBand = null;
        $capsApplied = [];

        if ($hasScores) {
            $scores = $rawScores;

            // Apply short response cap (shared with production)
            $shortResult = $this->formula->applyShortResponseCap($scores, $wordCount, $rubric);
            $scores = $shortResult['rubricScores'];
            if ($shortResult['capApplied'] !== null) {
                $capsApplied['short_response'] = $shortResult['capApplied'];
            }

            // Apply TF cap (shared with production)
            $tfResult = $this->formula->applyTfCap($scores, $rubric);
            $scores = $tfResult['rubricScores'];

            // Overall band (shared with production)
            $overallBand = $rubric->computeOverallBand($scores);

            // Build criterion breakdown
            $weights = [];
            foreach ($rubric->criteria as $criterion) {
                $weights[(string) ($criterion['key'] ?? '')] = (float) ($criterion['weight'] ?? 0);
            }

            $criterionScores = [];
            foreach ($rawScores as $key => $raw) {
                $criterionScores[$key] = [
                    'raw' => $raw,
                    'capped' => $scores[$key] ?? $raw,
                    'weight' => $weights[$key] ?? 0,
                ];
            }
        }

        return [
            'assessable' => true,
            'overall_band' => $overallBand,
            'criterion_scores' => $criterionScores,
            'caps_applied' => $capsApplied,
            'details' => $details,
        ];
    }
}
