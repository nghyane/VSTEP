<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

use App\Services\Grading\SpeakingScoringFormula;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;

final class SpeakingProbeRunner
{
    public function __construct(
        private readonly SpeakingTranscriptAnalyzer $speakingAnalyzer,
        private readonly SpeakingFeatureExtractor $featureExtractor,
        private readonly VstepSpeakingDescriptorEvaluator $descriptorEvaluator,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly CefrVocabularyClassifier $cefrClassifier,
        private readonly SyntaxAnalyzer $syntaxAnalyzer,
        private readonly SpeakingScoringFormula $formula,
    ) {}

    /** @return array{results:list<array<string,mixed>>,passed:bool} */
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

    /** @param array<string,mixed> $sample @return array<string,mixed> */
    private function evaluate(array $sample): array
    {
        $transcript = (string) $sample['transcript'];
        $speech = (array) ($sample['audio_metrics'] ?? []);
        $rule = $this->ruleScoring->analyze($transcript, []);
        $cefr = $this->cefrClassifier->analyze($transcript);
        $syntax = $this->syntaxAnalyzer->analyze($transcript);
        $speaking = $this->speakingAnalyzer->analyze($transcript);
        $features = $this->featureExtractor->extract($transcript);
        $descriptor = $this->descriptorEvaluator->evaluate((string) $sample['task_type'], $features);
        $metrics = [
            ...$rule['metrics'],
            'cefr_weighted_avg' => $cefr['cefr_weighted_avg'],
            'cefr_advanced_ratio' => $cefr['advanced_ratio'],
        ];
        $hasAudioMetrics = $speech !== [];
        $pronunciationSignals = [
            ...(array) ($speech['pronunciation'] ?? []),
            'word_count' => (int) ($speech['word_count'] ?? $metrics['word_count']),
        ];

        $scores = [
            'grammar' => $this->formula->grammar($syntax, 0, (int) $metrics['sentence_count']),
            'vocabulary' => $this->formula->vocabulary($metrics),
            'fluency' => $hasAudioMetrics ? $this->formula->fluency((float) ($speech['speaking_rate'] ?? 0), (int) ($speech['pause_count'] ?? 0), (int) ($speech['word_count'] ?? $metrics['word_count'])) : null,
            'discourse_management' => $descriptor['score'],
            'pronunciation' => isset($speech['pronunciation']) ? $this->formula->pronunciation($pronunciationSignals) : null,
        ];
        $actualBand = $this->availableAverage($scores);
        $signalChecks = $this->signalChecks($sample, $speaking, $syntax);

        return [
            'id' => $sample['id'],
            'expected_band' => (float) $sample['expected_band'],
            'actual_band' => $actualBand,
            'scores' => $scores,
            'metrics' => [
                ...$speaking,
                'grammar_type_count' => $syntax['count'],
                'speaking_rate' => (float) ($speech['speaking_rate'] ?? 0),
                'pause_count' => (int) ($speech['pause_count'] ?? 0),
                'descriptor_met' => count(array_filter($descriptor['descriptors'])),
            ],
            'signal_checks' => $signalChecks,
            'passed' => abs($actualBand - (float) $sample['expected_band']) <= 1.0
                && collect($signalChecks)->every(fn (bool $passed): bool => $passed),
        ];
    }

    /** @param array<string,float|null> $scores */
    private function availableAverage(array $scores): float
    {
        $available = array_values(array_filter($scores, fn (?float $score): bool => $score !== null));

        return round((array_sum($available) / max(1, count($available))) * 2) / 2;
    }

    /** @param array<string,mixed> $sample @param array<string,mixed> $speaking @param array<string,mixed> $syntax @return array<string,bool> */
    private function signalChecks(array $sample, array $speaking, array $syntax): array
    {
        $expected = (array) $sample['expected_signals'];

        return [
            'discourse_marker_min' => (int) $speaking['discourse_marker'] >= (int) $expected['discourse_marker_min'],
            'topic_development_min' => (int) $speaking['topic_development'] >= (int) $expected['topic_development_min'],
            'topic_lexis_min' => (int) $speaking['topic_lexis'] >= (int) $expected['topic_lexis_min'],
            'grammar_types_min' => (int) $syntax['count'] >= (int) $expected['grammar_types_min'],
        ];
    }

    /** @return list<array<string,mixed>> */
    private function samples(): array
    {
        $samples = [];
        foreach (glob(database_path('reference/linguistics/golden/speaking-*.json')) ?: [] as $path) {
            $decoded = json_decode((string) file_get_contents($path), true);
            if (is_array($decoded)) {
                $samples[] = $decoded;
            }
        }

        return $samples;
    }
}
