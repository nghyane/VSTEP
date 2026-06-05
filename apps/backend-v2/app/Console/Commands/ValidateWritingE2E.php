<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Assessment\Validation\WritingE2EValidator;
use Illuminate\Console\Command;

final class ValidateWritingE2E extends Command
{
    protected $signature = 'validate:writing-e2e
        {--max-drift=1.0 : Maximum allowed absolute band drift per sample}
        {--technical : Show criterion and signal details}';

    protected $description = 'Validate deterministic end-to-end Writing scoring against VSTEP golden text probes';

    public function handle(WritingE2EValidator $validator): int
    {
        $maxDrift = (float) $this->option('max-drift');
        $validation = $validator->validate($maxDrift);
        $summary = $validation['summary'];

        $this->info('Kiểm chứng Writing E2E — raw text → signals → scores');
        $this->newLine();

        foreach ($validation['results'] as $result) {
            $status = $result['abs_error'] <= $maxDrift && $this->signalsPassed($result) ? '✓' : '△';
            $this->line(sprintf(
                '%s %s: expected %.1f → actual %.1f (%+.1f)',
                $status,
                $result['id'],
                $result['expected_band'],
                $result['actual_band'],
                $result['signed_error'],
            ));

            if ($this->option('technical')) {
                $this->line(sprintf(
                    '  TF %.1f | Org %.1f | Grammar %.1f | Vocab %.1f | link %d colloc %d grammar-types %d',
                    $result['scores']['task_fulfillment'],
                    $result['scores']['organization'],
                    $result['scores']['grammar'],
                    $result['scores']['vocabulary'],
                    $result['metrics']['linking_word_count'],
                    $result['metrics']['complex_vocab_count'],
                    $result['metrics']['grammar_type_count'],
                ));
            }
        }

        $this->newLine();
        $this->info(sprintf('Exact band: %d/%d (%.1f%%)', $summary['exact_band'], $summary['total'], $summary['exact_band_rate'] * 100));
        $this->info(sprintf('Within ±0.5 band: %d/%d (%.1f%%)', $summary['within_half_band'], $summary['total'], $summary['within_half_band_rate'] * 100));
        $this->info(sprintf('Within ±1.0 band: %d/%d (%.1f%%)', $summary['within_one_band'], $summary['total'], $summary['within_one_band_rate'] * 100));
        $this->info(sprintf('Signal checks: %d/%d (%.1f%%)', $summary['signal_passes'], $summary['total'], $summary['signal_pass_rate'] * 100));
        $this->info(sprintf('Mean signed error: %+.2f band | MAE: %.2f band', $summary['mean_signed_error'], $summary['mean_absolute_error']));
        $this->info(sprintf('Over-score: %d | Under-score: %d', $summary['over_scored'], $summary['under_scored']));

        if (! $validation['passed']) {
            $this->error(sprintf('KHÔNG ĐẠT: có mẫu vượt quá ngưỡng drift %.1f hoặc thiếu signal bắt buộc.', $maxDrift));

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    /** @param array<string,mixed> $result */
    private function signalsPassed(array $result): bool
    {
        return collect($result['signal_checks'])->every(fn (bool $passed): bool => $passed);
    }
}
