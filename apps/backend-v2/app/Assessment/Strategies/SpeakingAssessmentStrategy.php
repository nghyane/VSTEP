<?php

declare(strict_types=1);

namespace App\Assessment\Strategies;

use App\Ai\Contracts\ContentRelevanceAssessor;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\CriterionScore;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\CriterionKey;
use App\Exceptions\AssessmentFailedException;
use App\Models\AssessmentRubric;
use App\Services\AudioStorageService;
use App\Services\Grading\SpeakingScoringFormula;
use App\Services\LanguageToolService;
use App\Services\Linguistics\SpeakingFeatureExtractor;
use App\Services\Linguistics\VstepSpeakingDescriptorEvaluator;
use App\Services\RuleBasedScoringService;
use App\Services\SpeechToText;
use App\Services\SyntaxAnalyzer;

abstract class SpeakingAssessmentStrategy extends TaskStrategy
{
    private const MIN_ASSESSABLE_WORDS = 20;

    private const SHORT_RESPONSE_WORDS = 40;

    private const LOW_ASR_CONFIDENCE = 0.65;

    private const LOW_CONTENT_FACTOR = 0.4;

    public function __construct(
        private readonly SpeechToText $stt,
        private readonly AudioStorageService $audio,
        private readonly SyntaxAnalyzer $syntax,
        private readonly RuleBasedScoringService $metrics,
        private readonly SpeakingScoringFormula $formula,
        private readonly ContentRelevanceAssessor $relevance,
        private readonly LanguageToolService $languageTool,
        private readonly SpeakingFeatureExtractor $speakingFeatures,
        private readonly VstepSpeakingDescriptorEvaluator $speakingDescriptors,
    ) {}

    public function collectSignals(AssessmentInput $input): SignalBag
    {
        $audioKey = $input->audioKey ?? '';
        if ($audioKey === '') {
            throw new AssessmentFailedException('Speaking assessment requires audio_key.');
        }

        $stt = $this->transcribe($audioKey);
        $transcript = (string) $stt['text'];
        if ($transcript === '') {
            throw new AssessmentFailedException('Speech-to-text returned empty transcript.');
        }

        $grammarErrors = $this->languageTool->checkSpeakingTranscript($transcript);
        $syntax = $this->syntax->analyze($transcript);
        $metricResult = $this->metrics->analyze($transcript, $grammarErrors);
        $speakingFeatures = $this->speakingFeatures->extract($transcript);
        $descriptor = $this->speakingDescriptors->evaluate($this->taskType()->value, $speakingFeatures);

        return new SignalBag(
            grammar: ['errors' => $grammarErrors, 'annotations' => $this->languageTool->toAnnotations($transcript, $grammarErrors)],
            vocabulary: $metricResult['metrics'],
            syntax: $syntax,
            coherence: [
                'linking_word_count' => $metricResult['metrics']['linking_word_count'],
                'sentence_variety' => $metricResult['metrics']['sentence_variety'] ?? 0.0,
                'speaking_features' => $speakingFeatures,
                'speaking_descriptors' => $descriptor['descriptors'],
                'descriptor_score' => $descriptor['score'],
            ],
            speech: [
                'transcript' => $transcript,
                'confidence' => (float) $stt['confidence'],
                'speaking_rate' => (float) ($stt['speaking_rate'] ?? 0),
                'pause_count' => (int) ($stt['pause_count'] ?? 0),
                'word_count' => (int) ($stt['word_count'] ?? 0),
            ],
            pronunciation: $this->pronunciation($stt),
            raw: ['stt' => $stt, 'language_tool' => ['errors' => $grammarErrors]],
        );
    }

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag
    {
        $prompt = $this->promptText($input->prompt);
        $contentFactor = 1.0;

        if ($prompt !== '' || $input->requirements !== []) {
            $contentFactor = $this->relevance->assess((string) $signals->speech['transcript'], $prompt, $input->requirements);
        } elseif ($input->sourceType === AssessmentSourceType::Exam) {
            throw new AssessmentFailedException('Speaking exam assessment requires prompt or requirements.');
        }

        return new EvidenceBag(content: ['content_factor' => $contentFactor]);
    }

    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult
    {
        return array_key_exists('content_factor', $evidence->content)
            ? new EvidenceValidationResult(true)
            : new EvidenceValidationResult(false, ['Missing speaking content relevance evidence.']);
    }

    public function score(EvidenceBag $evidence, SignalBag $signals, AssessmentRubric $rubric): ScoreBag
    {
        $scores = [
            'grammar' => $this->formula->grammar($signals->syntax, (int) $signals->vocabulary['grammar_error_count'], (int) $signals->vocabulary['sentence_count']),
            'vocabulary' => $this->formula->vocabulary($signals->vocabulary),
            'fluency' => $this->formula->fluency((float) $signals->speech['speaking_rate'], (int) $signals->speech['pause_count'], (int) $signals->speech['word_count']),
            'discourse_management' => $this->descriptorDiscourseScore($signals, $evidence),
            'pronunciation' => $this->formula->pronunciation([
                ...$signals->pronunciation,
                'word_count' => (int) $signals->speech['word_count'],
            ]),
        ];
        $criterionCaps = $this->speakingCriterionCaps($scores, $signals);
        $scores = $criterionCaps['scores'];

        $weights = $this->weights($rubric);
        $overall = $this->overallBand($scores, $weights);
        $capsApplied = $this->speakingCaps($scores, $overall, $signals, $evidence);
        $scores = $capsApplied['scores'];
        $overall = $capsApplied['overall'];
        $caps = [...$criterionCaps['caps'], ...$capsApplied['caps']];

        return new ScoreBag(
            criterionScores: $this->criterionScores($scores, $rubric),
            overallBand: $overall,
            capsApplied: $caps,
            calculationTrace: ['formula' => 'vstep_speaking'],
        );
    }

    public function buildFeedback(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag
    {
        return new FeedbackBag(evidenceNotes: $this->formula->insights(
            $signals->syntax,
            $signals->vocabulary,
            (float) $signals->speech['speaking_rate'],
            (int) $signals->speech['pause_count'],
            (int) $signals->speech['word_count'],
            (float) $signals->coherence['sentence_variety'],
            (float) $evidence->content['content_factor'],
            [...$signals->pronunciation, 'word_count' => (int) $signals->speech['word_count']],
        ));
    }

    /** @param array<string,float> $scores @return list<CriterionScore> */
    private function criterionScores(array $scores, AssessmentRubric $rubric): array
    {
        $weights = $this->weights($rubric);

        return [
            new CriterionScore(CriterionKey::Grammar, $scores['grammar'], $weights['grammar']),
            new CriterionScore(CriterionKey::Vocabulary, $scores['vocabulary'], $weights['vocabulary']),
            new CriterionScore(CriterionKey::Fluency, $scores['fluency'], $weights['fluency']),
            new CriterionScore(CriterionKey::DiscourseManagement, $scores['discourse_management'], $weights['discourse_management']),
            new CriterionScore(CriterionKey::Pronunciation, $scores['pronunciation'], $weights['pronunciation']),
        ];
    }

    /** @return array<string,float> */
    private function weights(AssessmentRubric $rubric): array
    {
        $weights = collect($rubric->criteria)->mapWithKeys(fn (array $criterion): array => [
            (string) $criterion['key'] => (float) $criterion['weight'],
        ])->all();

        foreach (['grammar', 'vocabulary', 'fluency', 'discourse_management', 'pronunciation'] as $key) {
            if (! isset($weights[$key])) {
                throw new AssessmentFailedException("Assessment rubric missing criterion weight: {$key}");
            }
        }

        return $weights;
    }

    /** @param array<string,float> $scores @param array<string,float> $weights */
    private function overallBand(array $scores, array $weights): float
    {
        $totalWeight = array_sum($weights);
        if ($totalWeight <= 0) {
            return 0.0;
        }

        $weightedSum = 0.0;
        foreach ($weights as $key => $weight) {
            $weightedSum += ($scores[$key] ?? 0.0) * $weight;
        }

        return round(($weightedSum / $totalWeight) * 2) / 2;
    }

    private function descriptorDiscourseScore(SignalBag $signals, EvidenceBag $evidence): float
    {
        $descriptorScore = (float) ($signals->coherence['descriptor_score'] ?? 0.0);
        $contentFactor = max(0.7, min(1.0, (float) ($evidence->content['content_factor'] ?? 1.0)));

        return round(($descriptorScore * $contentFactor) * 2) / 2;
    }

    /**
     * @param  array<string,float>  $scores
     * @return array{scores:array<string,float>,caps:array<string,mixed>}
     */
    private function speakingCriterionCaps(array $scores, SignalBag $signals): array
    {
        $caps = [];
        $taskType = $this->normalizedSpeakingTaskType();
        $config = (array) config("grading.speaking.criterion_caps.{$taskType}", []);

        $grammarLowSyntaxCap = (array) ($config['grammar']['low_syntax_cap'] ?? []);
        if ($grammarLowSyntaxCap !== [] && (int) ($signals->syntax['count'] ?? 0) <= (int) ($grammarLowSyntaxCap['syntax_count_lte'] ?? -1)) {
            $scores['grammar'] = min($scores['grammar'], (float) $grammarLowSyntaxCap['cap']);
            $caps['grammar_low_syntax_cap'] = [
                'syntax_count' => (int) ($signals->syntax['count'] ?? 0),
                'cap' => (float) $grammarLowSyntaxCap['cap'],
            ];
        }

        $vocabularyCap = (array) ($config['vocabulary']['low_advanced_topic_cap'] ?? []);
        $features = (array) ($signals->coherence['speaking_features'] ?? []);
        if ($vocabularyCap !== []
            && (float) ($signals->vocabulary['cefr_advanced_ratio'] ?? 0.0) < (float) $vocabularyCap['advanced_ratio_lt']
            && (int) ($features['topic_lexis'] ?? 0) < (int) $vocabularyCap['topic_lexis_lt']) {
            $scores['vocabulary'] = min($scores['vocabulary'], (float) $vocabularyCap['cap']);
            $caps['vocabulary_low_advanced_topic_cap'] = [
                'cefr_advanced_ratio' => (float) ($signals->vocabulary['cefr_advanced_ratio'] ?? 0.0),
                'topic_lexis' => (int) ($features['topic_lexis'] ?? 0),
                'cap' => (float) $vocabularyCap['cap'],
            ];
        }

        return ['scores' => $scores, 'caps' => $caps];
    }

    private function normalizedSpeakingTaskType(): string
    {
        return match ($this->taskType()->value) {
            'speaking_part_1_personal' => 'speaking_part_1',
            'speaking_part_2_solution' => 'speaking_part_2',
            'speaking_part_3_discussion' => 'speaking_part_3',
            default => $this->taskType()->value,
        };
    }

    /**
     * @param  array<string,float>  $scores
     * @return array{scores:array<string,float>,overall:float,caps:array<string,mixed>}
     */
    private function speakingCaps(array $scores, float $overall, SignalBag $signals, EvidenceBag $evidence): array
    {
        $caps = [];
        $wordCount = (int) ($signals->speech['word_count'] ?? $signals->vocabulary['word_count'] ?? 0);
        $asrConfidence = (float) ($signals->speech['confidence'] ?? 1.0);
        $contentFactor = (float) ($evidence->content['content_factor'] ?? 1.0);

        if ($wordCount < self::MIN_ASSESSABLE_WORDS) {
            $scores = array_map(fn (): float => 1.0, $scores);

            return [
                'scores' => $scores,
                'overall' => 1.0,
                'caps' => [
                    'type' => 'speaking_response_too_short',
                    'word_count' => $wordCount,
                    'minimum_word_count' => self::MIN_ASSESSABLE_WORDS,
                ],
            ];
        }

        if ($wordCount < self::SHORT_RESPONSE_WORDS) {
            $scores = array_map(fn (float $score): float => min($score, 4.0), $scores);
            $overall = min($overall, 4.0);
            $caps['short_response_word_count'] = [
                'word_count' => $wordCount,
                'cap' => 4.0,
            ];
        }

        if ($asrConfidence < self::LOW_ASR_CONFIDENCE) {
            $scores['fluency'] = min($scores['fluency'], 4.0);
            $scores['pronunciation'] = min($scores['pronunciation'], 4.0);
            $overall = min($overall, 4.0);
            $caps['low_asr_confidence'] = [
                'confidence' => $asrConfidence,
                'minimum_confidence' => self::LOW_ASR_CONFIDENCE,
                'cap' => 4.0,
            ];
        }

        if ($contentFactor < self::LOW_CONTENT_FACTOR) {
            $scores['discourse_management'] = min($scores['discourse_management'], 4.0);
            $overall = min($overall, 4.0);
            $caps['content_cap'] = [
                'content_factor' => $contentFactor,
                'minimum_content_factor' => self::LOW_CONTENT_FACTOR,
                'cap' => 4.0,
            ];
        }

        return ['scores' => $scores, 'overall' => $overall, 'caps' => $caps];
    }

    /** @return array<string,mixed> */
    private function transcribe(string $audioKey): array
    {
        $result = $this->stt->transcribeFromStorage($audioKey, $this->audio);

        if ($result === null) {
            throw new AssessmentFailedException('Speech-to-text transcription failed.');
        }

        return $result;
    }

    /** @param array<string,mixed> $stt */
    private function pronunciation(array $stt): array
    {
        $pronunciation = $stt['pronunciation'] ?? null;
        if (! is_array($pronunciation) || ! isset($pronunciation['overall'])) {
            throw new AssessmentFailedException('Speaking assessment requires pronunciation score from speech service.');
        }

        return $pronunciation;
    }

    /** @param array<string,mixed> $prompt */
    private function promptText(array $prompt): string
    {
        $content = $prompt['content'] ?? [];
        if (! is_array($content)) {
            return (string) ($prompt['prompt'] ?? '');
        }

        return implode('. ', array_filter(array_map(
            fn (mixed $value): string => is_array($value) ? implode(' ', array_filter($value, 'is_string')) : (is_string($value) ? $value : ''),
            $content,
        )));
    }
}
