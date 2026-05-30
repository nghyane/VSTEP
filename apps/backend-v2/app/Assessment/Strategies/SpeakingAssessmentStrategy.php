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
use App\Services\RuleBasedScoringService;
use App\Services\SpeechToText;
use App\Services\SyntaxAnalyzer;

abstract class SpeakingAssessmentStrategy extends TaskStrategy
{
    public function __construct(
        private readonly SpeechToText $stt,
        private readonly AudioStorageService $audio,
        private readonly SyntaxAnalyzer $syntax,
        private readonly RuleBasedScoringService $metrics,
        private readonly SpeakingScoringFormula $formula,
        private readonly ContentRelevanceAssessor $relevance,
    ) {}

    public function collectSignals(AssessmentInput $input): SignalBag
    {
        $audioUrl = $input->audioUrl ?? '';
        if ($audioUrl === '') {
            throw new AssessmentFailedException('Speaking assessment requires audio_url.');
        }

        $stt = $this->transcribe($audioUrl);
        $transcript = (string) $stt['text'];
        if ($transcript === '') {
            throw new AssessmentFailedException('Speech-to-text returned empty transcript.');
        }

        $syntax = $this->syntax->analyze($transcript);
        $metricResult = $this->metrics->analyze($transcript, []);

        return new SignalBag(
            vocabulary: $metricResult['metrics'],
            syntax: $syntax,
            coherence: [
                'linking_word_count' => $metricResult['metrics']['linking_word_count'],
                'sentence_variety' => $metricResult['metrics']['sentence_variety'] ?? 0.0,
            ],
            speech: [
                'transcript' => $transcript,
                'confidence' => (float) $stt['confidence'],
                'speaking_rate' => (float) ($stt['speaking_rate'] ?? 0),
                'pause_count' => (int) ($stt['pause_count'] ?? 0),
                'word_count' => (int) ($stt['word_count'] ?? 0),
            ],
            pronunciation: $this->pronunciation($stt),
            raw: ['stt' => $stt],
        );
    }

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag
    {
        $prompt = $this->promptText($input->prompt);
        $contentFactor = 1.0;

        if ($input->sourceType === AssessmentSourceType::Exam) {
            if ($prompt === '' && $input->requirements === []) {
                throw new AssessmentFailedException('Speaking exam assessment requires prompt or requirements.');
            }

            $contentFactor = $this->relevance->assess((string) $signals->speech['transcript'], $prompt, $input->requirements);
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
            'grammar' => $this->formula->grammar($signals->syntax, 0, (int) $signals->vocabulary['sentence_count']),
            'vocabulary' => $this->formula->vocabulary($signals->vocabulary),
            'fluency' => $this->formula->fluency((float) $signals->speech['speaking_rate'], (int) $signals->speech['pause_count'], (int) $signals->speech['word_count']),
            'discourse_management' => $this->formula->discourse((int) $signals->coherence['linking_word_count'], (float) $signals->coherence['sentence_variety'], (float) $evidence->content['content_factor']),
            'pronunciation' => $this->formula->pronunciation((float) $signals->pronunciation['overall']),
        ];

        $overall = round((array_sum($scores) / count($scores)) * 2) / 2;

        return new ScoreBag(
            criterionScores: $this->criterionScores($scores, $rubric),
            overallBand: $overall,
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
            (float) $signals->pronunciation['overall'],
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

    /** @return array<string,mixed> */
    private function transcribe(string $audioUrl): array
    {
        $result = $this->stt->transcribeFromStorage($audioUrl, $this->audio);

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
