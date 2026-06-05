<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Linguistics\LinguisticProbeRunner;
use App\Services\Linguistics\SpeakingProbeRunner;
use Illuminate\Console\Command;

final class ProbeLinguisticReferences extends Command
{
    protected $signature = 'linguistics:probe {--domain=writing : Probe domain: writing, speaking, all}';

    protected $description = 'Run VSTEP golden probes against linguistic reference data';

    public function handle(LinguisticProbeRunner $runner, SpeakingProbeRunner $speakingRunner): int
    {
        $domain = (string) $this->option('domain');
        if (! in_array($domain, ['writing', 'speaking', 'all'], true)) {
            $this->error('Invalid domain. Use writing, speaking, or all.');

            return self::FAILURE;
        }

        $passed = true;

        if ($domain === 'writing' || $domain === 'all') {
            $passed = $this->printWritingProbe($runner->run()) && $passed;
        }

        if ($domain === 'speaking' || $domain === 'all') {
            $passed = $this->printSpeakingProbe($speakingRunner->run()) && $passed;
        }

        if (! $passed) {
            $this->error('Linguistic probe failed.');

            return self::FAILURE;
        }

        $this->info('Linguistic probe passed.');

        return self::SUCCESS;
    }

    /** @param array{results:list<array<string,mixed>>,passed:bool} $probe */
    private function printWritingProbe(array $probe): bool
    {
        $this->line('Writing probes');

        foreach ($probe['results'] as $result) {
            $this->line(sprintf(
                '%s %s: expected %.1f → actual %.1f | vocab %.1f grammar %.1f org %.1f | link %d colloc %d grammar-types %d',
                $result['passed'] ? '✓' : '△',
                $result['id'],
                $result['expected_band'],
                $result['actual_band'],
                $result['scores']['vocabulary'],
                $result['scores']['grammar'],
                $result['scores']['organization'],
                $result['metrics']['linking_word_count'],
                $result['metrics']['complex_vocab_count'],
                $result['metrics']['grammar_type_count'],
            ));

            foreach ($result['signal_checks'] as $signal => $passed) {
                if (! $passed) {
                    $this->warn("  missing signal: {$signal}");
                }
            }
        }

        return $probe['passed'];
    }

    /** @param array{results:list<array<string,mixed>>,passed:bool} $probe */
    private function printSpeakingProbe(array $probe): bool
    {
        $this->line('Speaking probes');

        foreach ($probe['results'] as $result) {
            $this->line(sprintf(
                '%s %s: expected %.1f → actual %.1f | grammar %.1f vocab %.1f discourse %.1f fluency %s pron %s | descriptors %d discourse %d topic %d lexis %d grammar-types %d rate %.1f pauses %d',
                $result['passed'] ? '✓' : '△',
                $result['id'],
                $result['expected_band'],
                $result['actual_band'],
                $result['scores']['grammar'],
                $result['scores']['vocabulary'],
                $result['scores']['discourse_management'],
                $result['scores']['fluency'] === null ? 'n/a' : number_format((float) $result['scores']['fluency'], 1),
                $result['scores']['pronunciation'] === null ? 'n/a' : number_format((float) $result['scores']['pronunciation'], 1),
                $result['metrics']['descriptor_met'],
                $result['metrics']['discourse_marker'],
                $result['metrics']['topic_development'],
                $result['metrics']['topic_lexis'],
                $result['metrics']['grammar_type_count'],
                $result['metrics']['speaking_rate'],
                $result['metrics']['pause_count'],
            ));

            foreach ($result['signal_checks'] as $signal => $passed) {
                if (! $passed) {
                    $this->warn("  missing signal: {$signal}");
                }
            }
        }

        return $probe['passed'];
    }
}
