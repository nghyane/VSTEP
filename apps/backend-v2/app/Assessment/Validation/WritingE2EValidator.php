<?php

declare(strict_types=1);

namespace App\Assessment\Validation;

use App\Services\Linguistics\LinguisticProbeRunner;

final readonly class WritingE2EValidator
{
    public function __construct(
        private LinguisticProbeRunner $runner,
    ) {}

    /** @return array{results:list<array<string,mixed>>,summary:array<string,mixed>,passed:bool} */
    public function validate(float $maxBandDrift = 1.0): array
    {
        $probe = $this->runner->run();
        $results = array_map(fn (array $result): array => $this->withError($result), $probe['results']);
        $total = count($results);
        $exact = count(array_filter($results, fn (array $result): bool => $result['abs_error'] === 0.0));
        $withinHalf = count(array_filter($results, fn (array $result): bool => $result['abs_error'] <= 0.5));
        $withinOne = count(array_filter($results, fn (array $result): bool => $result['abs_error'] <= 1.0));
        $overScored = count(array_filter($results, fn (array $result): bool => $result['signed_error'] > 0.0));
        $underScored = count(array_filter($results, fn (array $result): bool => $result['signed_error'] < 0.0));
        $signedError = array_sum(array_column($results, 'signed_error'));
        $absoluteError = array_sum(array_column($results, 'abs_error'));
        $signalPasses = count(array_filter($results, fn (array $result): bool => $this->signalsPassed($result)));

        $passed = $total > 0 && $signalPasses === $total
            && count(array_filter($results, fn (array $result): bool => $result['abs_error'] <= $maxBandDrift)) === $total;

        return [
            'results' => $results,
            'summary' => [
                'total' => $total,
                'exact_band' => $exact,
                'exact_band_rate' => $this->rate($exact, $total),
                'within_half_band' => $withinHalf,
                'within_half_band_rate' => $this->rate($withinHalf, $total),
                'within_one_band' => $withinOne,
                'within_one_band_rate' => $this->rate($withinOne, $total),
                'over_scored' => $overScored,
                'under_scored' => $underScored,
                'mean_signed_error' => $total > 0 ? round($signedError / $total, 2) : 0.0,
                'mean_absolute_error' => $total > 0 ? round($absoluteError / $total, 2) : 0.0,
                'signal_passes' => $signalPasses,
                'signal_pass_rate' => $this->rate($signalPasses, $total),
                'max_band_drift' => $maxBandDrift,
            ],
            'passed' => $passed,
        ];
    }

    /** @param array<string,mixed> $result @return array<string,mixed> */
    private function withError(array $result): array
    {
        $signedError = round((float) $result['actual_band'] - (float) $result['expected_band'], 2);

        return [
            ...$result,
            'signed_error' => $signedError,
            'abs_error' => abs($signedError),
        ];
    }

    /** @param array<string,mixed> $result */
    private function signalsPassed(array $result): bool
    {
        return collect($result['signal_checks'])->every(fn (bool $passed): bool => $passed);
    }

    private function rate(int $count, int $total): float
    {
        return $total > 0 ? round($count / $total, 3) : 0.0;
    }
}
