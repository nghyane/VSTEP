<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Grading\SpeakingScoringFormula;
use App\Services\LanguageToolService;
use App\Services\Linguistics\SpeakingFeatureExtractor;
use App\Services\Linguistics\VstepSpeakingDescriptorEvaluator;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;
use Illuminate\Console\Command;

final class ExplainSpeakingReference extends Command
{
    protected $signature = 'linguistics:explain-speaking {path : Path to speaking golden JSON sample}';

    protected $description = 'Explain transparent speaking scoring evidence for one golden sample';

    public function __construct(
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly CefrVocabularyClassifier $cefrClassifier,
        private readonly SyntaxAnalyzer $syntaxAnalyzer,
        private readonly SpeakingFeatureExtractor $featureExtractor,
        private readonly VstepSpeakingDescriptorEvaluator $descriptorEvaluator,
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

        $sample = json_decode((string) file_get_contents($path), true);
        if (! is_array($sample) || ! isset($sample['transcript'])) {
            $this->error('Invalid speaking sample. Expected JSON with transcript.');

            return self::FAILURE;
        }

        $explanation = $this->explain($sample);
        $this->line(json_encode($explanation, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        return self::SUCCESS;
    }

    /** @param array<string,mixed> $sample @return array<string,mixed> */
    private function explain(array $sample): array
    {
        $transcript = (string) $sample['transcript'];
        $taskType = (string) $sample['task_type'];
        $speech = (array) ($sample['audio_metrics'] ?? []);
        $grammarErrors = $this->languageTool->checkSpeakingTranscript($transcript);
        $rule = $this->ruleScoring->analyze($transcript, $grammarErrors);
        $cefr = $this->cefrClassifier->analyze($transcript);
        $syntax = $this->syntaxAnalyzer->analyze($transcript);
        $features = $this->featureExtractor->extract($transcript);
        $descriptor = $this->descriptorEvaluator->evaluate($taskType, $features);
        $metrics = [
            ...$rule['metrics'],
            'cefr_weighted_avg' => $cefr['cefr_weighted_avg'],
            'cefr_advanced_ratio' => $cefr['advanced_ratio'],
        ];
        $pronunciationSignals = [
            ...(array) ($speech['pronunciation'] ?? []),
            'word_count' => (int) ($speech['word_count'] ?? $metrics['word_count']),
        ];

        return [
            'id' => $sample['id'] ?? basename((string) $this->argument('path')),
            'task_type' => $taskType,
            'scores' => [
                'grammar' => $this->formula->grammar($syntax, (int) $metrics['grammar_error_count'], (int) $metrics['sentence_count']),
                'vocabulary' => $this->formula->vocabulary($metrics),
                'discourse_management' => $descriptor['score'],
                'fluency' => $speech === [] ? null : $this->formula->fluency((float) ($speech['speaking_rate'] ?? 0), (int) ($speech['pause_count'] ?? 0), (int) ($speech['word_count'] ?? $metrics['word_count'])),
                'pronunciation' => isset($speech['pronunciation']) ? $this->formula->pronunciation($pronunciationSignals) : null,
            ],
            'evidence' => [
                'language_tool' => [
                    'filtered_error_count' => count($grammarErrors),
                    'errors' => array_slice($grammarErrors, 0, 10),
                ],
                'syntax' => [
                    'grammar_type_count' => $syntax['count'],
                    'types' => $syntax['types'] ?? [],
                ],
                'cefr_vocabulary' => $cefr,
                'speaking_features' => array_diff_key($features, ['matches' => true]),
                'descriptors' => $descriptor['descriptors'],
                'pronunciation_formula' => isset($speech['pronunciation']) ? [
                    'inputs' => $pronunciationSignals,
                    'formula' => '0.45*accuracy + 0.20*fluency + 0.20*prosody + 0.15*completeness - word_level_penalties',
                ] : null,
            ],
        ];
    }
}
