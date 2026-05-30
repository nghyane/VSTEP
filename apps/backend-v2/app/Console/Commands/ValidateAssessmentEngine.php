<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Assessment\Validation\AssessmentEngineValidator;
use Illuminate\Console\Command;

final class ValidateAssessmentEngine extends Command
{
    protected $signature = 'validate:assessment-engine
        {--suite=benchmark : Validation suite: benchmark, guardrail, or all}
        {--min-alignment=0.85 : Minimum CEFR alignment rate required}
        {--technical : Show technical task type and band details}';

    protected $description = 'Validate the new Assessment Engine scoring core against deterministic golden samples';

    public function handle(AssessmentEngineValidator $validator): int
    {
        $suite = (string) $this->option('suite');
        $validation = $validator->validate($suite);
        $results = $validation['results'];
        $summary = $validation['summary'];

        $this->info(match ($suite) {
            'benchmark' => 'Kiểm chứng chấm điểm tự động — benchmark có nguồn',
            'guardrail' => 'Kiểm chứng chấm điểm tự động — guardrail rủi ro',
            'all' => 'Kiểm chứng chấm điểm tự động — tất cả bộ mẫu',
            default => "Kiểm chứng chấm điểm tự động — {$suite}",
        });
        $this->newLine();

        foreach ($results as $result) {
            $status = $result['level_match'] ? '✓' : '△';
            $cap = $result['caps_applied'] === [] ? '' : ' cap='.($result['caps_applied']['type'] ?? 'applied');

            if ($result['sample_type'] === 'guardrail' && ! $this->option('technical')) {
                $this->line(sprintf(
                    '%s %s: rủi ro %s, chuẩn %s → hệ thống %s %.1f',
                    $status,
                    $result['label'],
                    $result['risk_type'],
                    $result['reference_id'] ?? 'nội bộ',
                    $result['actual_level'],
                    $result['actual_band'],
                ));

                continue;
            }

            if (! $this->option('technical')) {
                $this->line(sprintf(
                    '%s %s: nguồn %s → hệ thống %s',
                    $status,
                    $result['label'],
                    $result['source_grade'],
                    $result['actual_level'],
                ));

                continue;
            }

            $this->line(sprintf(
                '%s %s [%s]: điểm nguồn %s, kỳ vọng %s %.1f → hệ thống %s %.1f%s',
                $status,
                $result['label'],
                $result['task_type'],
                $result['source_grade'],
                $result['expected_level'],
                $result['expected_band'],
                $result['actual_level'],
                $result['actual_band'],
                $cap,
            ));
        }

        $this->newLine();
        if ($suite === 'guardrail') {
            $this->info(sprintf(
                'Guardrail đạt: %d/%d (%.1f%%)',
                $summary['guardrail_passes'],
                $summary['guardrail_total'],
                $summary['guardrail_pass_rate'] * 100,
            ));
        } elseif ($suite === 'all') {
            $this->info(sprintf(
                'Benchmark khớp CEFR: %d/%d (%.1f%%)',
                $summary['level_matches'],
                $summary['benchmark_total'],
                $summary['level_alignment'] * 100,
            ));
            $this->info(sprintf(
                'Guardrail đạt: %d/%d (%.1f%%)',
                $summary['guardrail_passes'],
                $summary['guardrail_total'],
                $summary['guardrail_pass_rate'] * 100,
            ));
        } else {
            $this->info(sprintf(
                'Khớp CEFR: %d/%d (%.1f%%)',
                $summary['level_matches'],
                $summary['benchmark_total'],
                $summary['level_alignment'] * 100,
            ));
            $this->info(sprintf(
                'Nằm trong ±0.5 band: %d/%d (%.1f%%)',
                $summary['within_half_band'],
                $summary['benchmark_total'],
                $summary['within_half_band_rate'] * 100,
            ));
        }

        $minAlignment = (float) $this->option('min-alignment');
        if ($suite !== 'guardrail' && $summary['level_alignment'] < $minAlignment) {
            $this->error(sprintf('KHÔNG ĐẠT: tỷ lệ khớp %.1f%% thấp hơn ngưỡng yêu cầu %.1f%%.', $summary['level_alignment'] * 100, $minAlignment * 100));

            return self::FAILURE;
        }

        if (in_array($suite, ['guardrail', 'all'], true) && $summary['guardrail_passes'] !== $summary['guardrail_total']) {
            $this->error('KHÔNG ĐẠT: có guardrail chưa được xử lý đúng.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
