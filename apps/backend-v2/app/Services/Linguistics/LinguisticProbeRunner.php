<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

use App\Models\GradingRubric;
use App\Services\Grading\WritingScoringFormula;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;

final class LinguisticProbeRunner
{
    public function __construct(
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly CefrVocabularyClassifier $cefrClassifier,
        private readonly SyntaxAnalyzer $syntaxAnalyzer,
    ) {}

    /** @return array{results: list<array<string, mixed>>, passed: bool} */
    public function run(): array
    {
        $results = [];
        foreach ($this->samples() as $sample) {
            $results[] = $this->evaluate($sample);
        }

        return [
            'results' => $results,
            'passed' => collect($results)->every(fn (array $result): bool => $result['passed']),
        ];
    }

    /** @param array<string, mixed> $sample @return array<string, mixed> */
    private function evaluate(array $sample): array
    {
        $text = (string) $sample['text'];
        $rule = $this->ruleScoring->analyze($text, []);
        $cefr = $this->cefrClassifier->analyze($text);
        $metrics = [
            ...$rule['metrics'],
            'cefr_weighted_avg' => $cefr['cefr_weighted_avg'],
            'cefr_advanced_ratio' => $cefr['advanced_ratio'],
            'cefr_vocab_count' => $cefr['cefr_vocab_count'],
        ];
        $syntax = $this->syntaxAnalyzer->analyze($text);
        $part = $sample['task_type'] === 'writing_task_1_letter' ? 1 : 2;
        $rubric = GradingRubric::query()->where('skill', 'writing')->firstOrFail();
        $formula = new WritingScoringFormula($rubric);

        $scores = [
            'grammar' => $formula->grammar($syntax, (int) $metrics['grammar_error_count'], (int) $metrics['sentence_count'], (int) $metrics['punctuation_error_count']),
            'vocabulary' => $formula->vocabulary($metrics),
            'task_fulfillment' => $formula->taskFulfillment($this->taskEvidence($sample, $metrics, $part), $part),
            'organization' => $formula->organization(
                (int) $metrics['paragraph_count'],
                (int) $metrics['linking_word_count'],
                (int) $metrics['sentence_count'],
                (float) $metrics['sentence_variety'],
                $part,
                (bool) $metrics['has_salutation'],
                (bool) $metrics['has_closing'],
            ),
        ];
        $capped = $formula->applyTfCap($scores, $rubric);
        $actualBand = $capped['overallBand'];

        $signalChecks = $this->signalChecks($sample, $metrics, $syntax);

        return [
            'id' => $sample['id'],
            'expected_band' => (float) $sample['expected_band'],
            'actual_band' => $actualBand,
            'scores' => $capped['rubricScores'],
            'metrics' => [
                'word_count' => $metrics['word_count'],
                'linking_word_count' => $metrics['linking_word_count'],
                'complex_vocab_count' => $metrics['complex_vocab_count'],
                'grammar_type_count' => $syntax['count'],
                'cefr_weighted_avg' => $metrics['cefr_weighted_avg'],
                'cefr_advanced_ratio' => $metrics['cefr_advanced_ratio'],
            ],
            'signal_checks' => $signalChecks,
            'passed' => abs($actualBand - (float) $sample['expected_band']) <= 1.0
                && collect($signalChecks)->every(fn (bool $passed): bool => $passed),
        ];
    }

    /** @param array<string, mixed> $sample @param array<string, mixed> $metrics @return array<string, mixed> */
    private function taskEvidence(array $sample, array $metrics, int $part): array
    {
        return [
            'points_covered' => count((array) $sample['requirements']),
            'points_required' => count((array) $sample['requirements']),
            'depth_factor' => 0.7,
            'has_examples' => $part === 2,
            'has_clear_position' => true,
            'has_irrelevant_content' => false,
            'word_count' => $metrics['word_count'],
            'tone_informal_count' => $metrics['tone_signals']['informal_count'] ?? 0,
        ];
    }

    /** @param array<string, mixed> $sample @param array<string, mixed> $metrics @param array<string, mixed> $syntax @return array<string, bool> */
    private function signalChecks(array $sample, array $metrics, array $syntax): array
    {
        $expected = (array) $sample['expected_signals'];

        return [
            'linking_min' => (int) $metrics['linking_word_count'] >= (int) $expected['linking_min'],
            'collocation_min' => (int) $metrics['complex_vocab_count'] >= (int) $expected['collocation_min'],
            'grammar_types_min' => (int) $syntax['count'] >= (int) $expected['grammar_types_min'],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function samples(): array
    {
        $samples = [];
        foreach (glob(database_path('reference/linguistics/golden/writing-*.json')) ?: [] as $path) {
            $decoded = json_decode((string) file_get_contents($path), true);
            if (is_array($decoded)) {
                $samples[] = $decoded;
            }
        }

        return $samples;
    }
}
