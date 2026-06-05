<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Grading\SpeakingScoringFormula;
use App\Services\LanguageToolService;
use App\Services\Linguistics\SpeakingFeatureExtractor;
use App\Services\Linguistics\SpeakingTranscriptAnalyzer;
use App\Services\Linguistics\VstepSpeakingDescriptorEvaluator;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;
use Illuminate\Console\Command;

final class CalibrateSpeakingReferences extends Command
{
    protected $signature = 'linguistics:calibrate-speaking
        {path : Path to an EvalYaks Part*.csv file}
        {--limit=50 : Maximum rows to evaluate}
        {--task-type= : VSTEP task type override: speaking_part_1, speaking_part_2, speaking_part_3}';

    protected $description = 'Run transcript-only speaking calibration against local research CSV samples';

    public function __construct(
        private readonly SpeakingTranscriptAnalyzer $speakingAnalyzer,
        private readonly SpeakingFeatureExtractor $featureExtractor,
        private readonly VstepSpeakingDescriptorEvaluator $descriptorEvaluator,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly LanguageToolService $languageTool,
        private readonly CefrVocabularyClassifier $cefrClassifier,
        private readonly SyntaxAnalyzer $syntaxAnalyzer,
        private readonly SpeakingScoringFormula $formula,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $path = (string) $this->argument('path');
        if (! is_file($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        $limit = max(1, (int) $this->option('limit'));
        $rows = $this->readCsv($path, $limit);
        if ($rows === []) {
            $this->error('No usable rows found.');

            return self::FAILURE;
        }

        $taskType = (string) ($this->option('task-type') ?: $this->inferTaskTypeFromPath($path));
        $results = array_map(fn (array $row): array => $this->evaluate($row, $taskType), $rows);

        foreach (array_slice($results, 0, 5) as $result) {
            $this->line(sprintf(
                '%s: GV expected %.1f → %.1f | DM expected %.1f → %.1f | words %d discourse %d grammar-types %d',
                $result['id'],
                $result['expected_gv'],
                $result['actual_gv'],
                $result['expected_dm'],
                $result['actual_dm'],
                $result['word_count'],
                $result['discourse_marker'],
                $result['grammar_type_count'],
            ));
        }

        $this->info('Calibration summary');
        $this->line('  samples: '.count($results));
        $this->line('  grammar+vocabulary MAE: '.number_format($this->mae($results, 'expected_gv', 'actual_gv'), 2));
        $this->line('  discourse MAE: '.number_format($this->mae($results, 'expected_dm', 'actual_dm'), 2));
        $this->line('  grammar+vocabulary within ±1.0: '.number_format($this->within($results, 'expected_gv', 'actual_gv', 1.0) * 100, 1).'%');
        $this->line('  discourse within ±1.0: '.number_format($this->within($results, 'expected_dm', 'actual_dm', 1.0) * 100, 1).'%');
        $this->printDiagnostics($results, 'grammar+vocabulary', 'expected_gv', 'actual_gv');
        $this->printDiagnostics($results, 'discourse', 'expected_dm', 'actual_dm');

        return self::SUCCESS;
    }

    /** @return list<array{id:string,transcript:string,grammar_and_vocabulary:int,discourse_management:int}> */
    private function readCsv(string $path, int $limit): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return [];
        }

        $header = fgetcsv($handle);
        $promptIndex = array_search('PROMPT', $header ?: [], true);
        if ($promptIndex === false) {
            fclose($handle);

            return [];
        }

        $rows = [];
        while (($data = fgetcsv($handle)) !== false && count($rows) < $limit) {
            $parsed = $this->parsePrompt((string) ($data[$promptIndex] ?? ''), count($rows) + 1);
            if ($parsed !== null) {
                $rows[] = $parsed;
            }
        }
        fclose($handle);

        return $rows;
    }

    /** @return array{id:string,transcript:string,grammar_and_vocabulary:int,discourse_management:int}|null */
    private function parsePrompt(string $prompt, int $index): ?array
    {
        if (! preg_match('/Conversation:\s*(\[.*?\])\s*\[\/INST\]/s', $prompt, $conversationMatch)) {
            return null;
        }

        $conversationJson = preg_replace('/},\s*,\s*"Examiner"/', '}, {"Examiner"', $conversationMatch[1]) ?? $conversationMatch[1];
        $conversation = json_decode($conversationJson, true);
        if (! is_array($conversation)) {
            return null;
        }

        if (! preg_match("/\{'GRAMMAR_AND_VOCABULARY':\s*(\d+),\s*'DISCOURSE_MANAGEMENT':\s*(\d+)\}/", $prompt, $scoreMatch)) {
            return null;
        }

        $candidateTurns = [];
        foreach ($conversation as $turn) {
            if (is_array($turn) && isset($turn['Candidate'])) {
                $candidateTurns[] = trim((string) $turn['Candidate']);
            }
        }

        $transcript = trim(implode(' ', array_filter($candidateTurns)));
        if ($transcript === '') {
            return null;
        }

        return [
            'id' => 'evalyaks-'.str_pad((string) $index, 4, '0', STR_PAD_LEFT),
            'transcript' => $transcript,
            'grammar_and_vocabulary' => (int) $scoreMatch[1],
            'discourse_management' => (int) $scoreMatch[2],
        ];
    }

    /** @param array{id:string,transcript:string,grammar_and_vocabulary:int,discourse_management:int} $row @return array<string,mixed> */
    private function evaluate(array $row, string $taskType): array
    {
        $grammarErrors = $this->languageTool->checkSpeakingTranscript($row['transcript']);
        $rule = $this->ruleScoring->analyze($row['transcript'], $grammarErrors);
        $cefr = $this->cefrClassifier->analyze($row['transcript']);
        $syntax = $this->syntaxAnalyzer->analyze($row['transcript']);
        $speaking = $this->speakingAnalyzer->analyze($row['transcript']);
        $features = $this->featureExtractor->extract($row['transcript']);
        $metrics = [
            ...$rule['metrics'],
            'cefr_weighted_avg' => $cefr['cefr_weighted_avg'],
            'cefr_advanced_ratio' => $cefr['advanced_ratio'],
        ];

        return [
            'id' => $row['id'],
            'expected_gv' => $this->mapEvalYaksScore($row['grammar_and_vocabulary']),
            'actual_gv' => $this->descriptorEvaluator->grammarVocabularyScore(
                $this->formula->grammar($syntax, (int) $metrics['grammar_error_count'], (int) $metrics['sentence_count']),
                $this->formula->vocabulary($metrics),
                $features,
                $syntax,
                $metrics,
                $taskType,
            ),
            'expected_dm' => $this->mapEvalYaksScore($row['discourse_management']),
            'actual_dm' => $this->descriptorEvaluator->evaluate($taskType, $features)['score'],
            'word_count' => $metrics['word_count'],
            'discourse_marker' => $speaking['discourse_marker'],
            'grammar_type_count' => $syntax['count'],
        ];
    }

    private function inferTaskTypeFromPath(string $path): string
    {
        $lower = strtolower($path);

        return str_contains($lower, 'part1') ? 'speaking_part_1' : 'speaking_part_2';
    }

    private function mapEvalYaksScore(int $score): float
    {
        return match ($score) {
            1 => 4.0,
            2 => 5.0,
            3 => 6.0,
            4 => 7.0,
            5 => 8.0,
            default => 0.0,
        };
    }

    /** @param list<array<string,mixed>> $results */
    private function mae(array $results, string $expectedKey, string $actualKey): float
    {
        return array_sum(array_map(
            fn (array $row): float => abs((float) $row[$expectedKey] - (float) $row[$actualKey]),
            $results,
        )) / max(1, count($results));
    }

    /** @param list<array<string,mixed>> $results */
    private function within(array $results, string $expectedKey, string $actualKey, float $tolerance): float
    {
        $hits = count(array_filter(
            $results,
            fn (array $row): bool => abs((float) $row[$expectedKey] - (float) $row[$actualKey]) <= $tolerance,
        ));

        return $hits / max(1, count($results));
    }

    /** @param list<array<string,mixed>> $results */
    private function printDiagnostics(array $results, string $label, string $expectedKey, string $actualKey): void
    {
        $over = count(array_filter($results, fn (array $row): bool => (float) $row[$actualKey] - (float) $row[$expectedKey] > 1.0));
        $under = count(array_filter($results, fn (array $row): bool => (float) $row[$expectedKey] - (float) $row[$actualKey] > 1.0));

        $this->line("  {$label} over-score >1.0: {$over}/".count($results));
        $this->line("  {$label} under-score >1.0: {$under}/".count($results));

        foreach ($this->groupByExpected($results, $expectedKey) as $expected => $rows) {
            $this->line("    {$label} expected {$expected}: MAE ".number_format($this->mae($rows, $expectedKey, $actualKey), 2).' n='.count($rows));
        }
    }

    /** @param list<array<string,mixed>> $results @return array<string,list<array<string,mixed>>> */
    private function groupByExpected(array $results, string $expectedKey): array
    {
        $groups = [];
        foreach ($results as $row) {
            $groups[number_format((float) $row[$expectedKey], 1)][] = $row;
        }
        ksort($groups);

        return $groups;
    }
}
