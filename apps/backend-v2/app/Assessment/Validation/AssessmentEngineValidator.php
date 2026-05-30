<?php

declare(strict_types=1);

namespace App\Assessment\Validation;

use App\Assessment\Data\CriterionScore;
use App\Assessment\Enums\CriterionKey;
use App\Assessment\Scoring\WeightedOverallScorer;

final readonly class AssessmentEngineValidator
{
    public function __construct(
        private AssessmentGoldenSampleRepository $samples,
        private WeightedOverallScorer $scorer,
    ) {}

    /** @return array{results: list<array<string,mixed>>, summary: array<string,mixed>} */
    public function validate(string $suite = 'benchmark'): array
    {
        $results = array_map(fn (array $sample): array => $this->scoreSample($sample), $this->samples->all($suite));
        $total = count($results);
        $benchmarkResults = array_values(array_filter($results, fn (array $result): bool => $result['sample_type'] === 'benchmark'));
        $guardrailResults = array_values(array_filter($results, fn (array $result): bool => $result['sample_type'] === 'guardrail'));
        $benchmarkTotal = count($benchmarkResults);
        $guardrailTotal = count($guardrailResults);
        $levelMatches = count(array_filter($benchmarkResults, fn (array $result): bool => $result['level_match'] === true));
        $withinHalfBand = count(array_filter($benchmarkResults, fn (array $result): bool => $result['within_half_band'] === true));
        $guardrailPasses = count(array_filter($guardrailResults, fn (array $result): bool => ($result['guardrail_passed'] ?? false) === true));

        return [
            'results' => $results,
            'summary' => [
                'suite' => $suite,
                'total' => $total,
                'benchmark_total' => $benchmarkTotal,
                'level_matches' => $levelMatches,
                'level_alignment' => $benchmarkTotal > 0 ? $levelMatches / $benchmarkTotal : 0.0,
                'within_half_band' => $withinHalfBand,
                'within_half_band_rate' => $benchmarkTotal > 0 ? $withinHalfBand / $benchmarkTotal : 0.0,
                'guardrail_total' => $guardrailTotal,
                'guardrail_passes' => $guardrailPasses,
                'guardrail_pass_rate' => $guardrailTotal > 0 ? $guardrailPasses / $guardrailTotal : 0.0,
            ],
        ];
    }

    /** @param array<string,mixed> $sample */
    private function scoreSample(array $sample): array
    {
        $scoreBag = $this->scorer->score(
            $this->criterionScores($sample['criterion_scores'], $sample['weights']),
            $sample['policy'] ?? [],
        );
        $actualLevel = $this->bandToLevel($scoreBag->overallBand);
        $expectedBand = (float) ($sample['expected_band'] ?? ($sample['expected_behavior']['max_band'] ?? 0.0));
        $guardrailPassed = $sample['sample_type'] === 'guardrail'
            ? $this->guardrailPassed($sample, $scoreBag->overallBand, $scoreBag->capsApplied)
            : null;

        return [
            'sample_type' => $sample['sample_type'],
            'label' => $sample['label'],
            'source' => $sample['source'] ?? null,
            'source_url' => $sample['source_url'] ?? null,
            'source_scale' => $sample['source_scale'] ?? null,
            'source_grade' => $sample['source_grade'] ?? null,
            'risk_type' => $sample['risk_type'] ?? null,
            'reference_id' => $sample['reference_id'] ?? null,
            'task_type' => $sample['task_type']->value,
            'expected_level' => $sample['expected_level'],
            'actual_level' => $actualLevel,
            'expected_band' => $expectedBand,
            'actual_band' => $scoreBag->overallBand,
            'level_match' => $sample['sample_type'] === 'benchmark'
                ? $this->levelMatches((string) $sample['expected_level_policy'], (string) $sample['expected_level'], $actualLevel)
                : $guardrailPassed,
            'within_half_band' => $sample['sample_type'] === 'benchmark'
                ? abs($scoreBag->overallBand - $expectedBand) <= 0.5
                : $scoreBag->overallBand <= $expectedBand,
            'guardrail_passed' => $guardrailPassed,
            'caps_applied' => $scoreBag->capsApplied,
            'calculation_trace' => $scoreBag->calculationTrace,
        ];
    }

    private function levelMatches(string $policy, string $expectedLevel, string $actualLevel): bool
    {
        if ($actualLevel === $expectedLevel) {
            return true;
        }

        return $policy === 'b1_plus_accept_b1_or_b2' && in_array($actualLevel, ['B1', 'B2'], true);
    }

    /**
     * @param  array<string,float>  $scores
     * @param  array<string,float>  $weights
     * @return list<CriterionScore>
     */
    private function criterionScores(array $scores, array $weights): array
    {
        $criterionScores = [];

        foreach ($scores as $key => $score) {
            $criterionScores[] = new CriterionScore(
                key: CriterionKey::from($key),
                score: (float) $score,
                weight: (float) ($weights[$key] ?? 0.0),
            );
        }

        return $criterionScores;
    }

    private function bandToLevel(float $band): string
    {
        return match (true) {
            $band >= 8.5 => 'C1',
            $band >= 6.0 => 'B2',
            $band >= 4.0 => 'B1',
            default => 'Không đạt',
        };
    }

    /** @param array<string,mixed> $sample */
    private function guardrailPassed(array $sample, float $actualBand, array $capsApplied): bool
    {
        $expected = (array) ($sample['expected_behavior'] ?? []);
        $maxBand = (float) ($expected['max_band'] ?? 0.0);
        if ($actualBand > $maxBand) {
            return false;
        }

        $requiredCaps = (array) ($expected['required_caps'] ?? []);
        if ($requiredCaps === []) {
            return true;
        }

        return in_array($capsApplied['type'] ?? null, $requiredCaps, true);
    }
}
