<?php

declare(strict_types=1);

namespace App\Assessment\Strategies;

use App\Ai\Contracts\TaskFulfillmentAssessor;
use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\CriterionScore;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\CriterionKey;
use App\Assessment\Services\AssessmentManager;
use App\DTOs\Grading\Params\TaskFulfillmentParams;
use App\Exceptions\AssessmentFailedException;
use App\Models\AssessmentRubric;
use App\Services\Grading\RubricResolver;
use App\Services\Grading\WritingScoringFormula;
use App\Services\LanguageDetector;
use App\Services\LanguageToolService;
use App\Services\ProfanityDetector;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;

abstract class WritingAssessmentStrategy extends TaskStrategy
{
    public function __construct(
        private readonly LanguageDetector $languageDetector,
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly SyntaxAnalyzer $syntax,
        private readonly AssessmentManager $assessments,
        private readonly TaskFulfillmentAssessor $taskAssessor,
        private readonly WritingFeedbackGenerator $feedbackGenerator,
        private readonly RubricResolver $rubricResolver,
        private readonly CefrVocabularyClassifier $cefrClassifier,
        private readonly ProfanityDetector $profanityDetector,
    ) {}

    private function formula(): WritingScoringFormula
    {
        return $this->assessments->writingFormula();
    }

    public function collectSignals(AssessmentInput $input): SignalBag
    {
        $text = $input->text ?? '';
        if ($text === '') {
            throw new AssessmentFailedException('Writing assessment requires text response.');
        }

        $language = $this->languageDetector->detect($text);
        $tfParams = $this->rubricResolver->active('writing')->taskFulfillmentParams();
        if (! $language['is_english'] && ! $tfParams->isNonAssessable($this->simpleWordCount($text))) {
            throw new AssessmentFailedException('Writing submission is not in English.');
        }

        $grammarErrors = $this->languageTool->check($text);
        $ruleAnalysis = $this->ruleScoring->analyze($text, $grammarErrors);
        $syntax = $this->syntax->analyze($text);
        $ruleAnalysis['syntax'] = $syntax;

        $cefr = $this->cefrClassifier->analyze($text);
        $ruleAnalysis['metrics']['cefr_weighted_avg'] = $cefr['cefr_weighted_avg'];
        $ruleAnalysis['metrics']['cefr_advanced_ratio'] = $cefr['advanced_ratio'];
        $ruleAnalysis['metrics']['cefr_vocab_count'] = $cefr['cefr_vocab_count'];

        $profanity = $this->profanityDetector->detect($text);

        return new SignalBag(
            grammar: ['errors' => $grammarErrors, 'annotations' => $this->languageTool->toAnnotations($text, $grammarErrors)],
            vocabulary: $ruleAnalysis['metrics'],
            syntax: $syntax,
            coherence: [
                'linking_word_count' => $ruleAnalysis['metrics']['linking_word_count'],
                'sentence_variety' => $ruleAnalysis['metrics']['sentence_variety'] ?? 0.0,
            ],
            writingFormat: [
                'has_salutation' => $ruleAnalysis['metrics']['has_salutation'] ?? false,
                'has_closing' => $ruleAnalysis['metrics']['has_closing'] ?? false,
            ],
            raw: ['rule_analysis' => $ruleAnalysis, 'cefr' => $cefr, 'profanity' => $profanity],
        );
    }

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag
    {
        if ($input->requirements === []) {
            throw new AssessmentFailedException('Writing assessment requires task requirements.');
        }

        $text = $input->text ?? '';
        $wordCount = $this->effectiveWordCount($input, $signals);
        $tfParams = $this->rubricResolver->active('writing')->taskFulfillmentParams();
        $copiedPrompt = $this->isPromptCopy($text, (string) ($input->prompt['prompt'] ?? ''));

        if ($tfParams->isNonAssessable($wordCount) || $copiedPrompt) {
            $evidence = [
                'points_covered' => 0,
                'points_required' => max(1, count($input->requirements)),
                'requirements_met' => array_fill(0, max(1, count($input->requirements)), false),
                'depth_factor' => 0.0,
                'has_examples' => false,
                'has_clear_position' => false,
                'has_irrelevant_content' => true,
                'word_count' => $wordCount,
                'copied_prompt' => $copiedPrompt,
                'tone_informal_count' => (int) (($signals->vocabulary['tone_signals']['informal_count'] ?? 0)),
            ];

            return new EvidenceBag(task: $evidence, raw: $evidence);
        }

        $evidence = $this->taskAssessor->assess(
            $text,
            (string) ($input->prompt['prompt'] ?? ''),
            $input->requirements,
            $signals->grammar['errors'],
            $signals->raw['rule_analysis'],
            $this->part($input),
        );

        $evidence['word_count'] = $wordCount;
        $evidence['copied_prompt'] = false;
        $evidence['tone_informal_count'] = (int) (($signals->vocabulary['tone_signals']['informal_count'] ?? 0));

        return new EvidenceBag(task: $evidence, raw: $evidence);
    }

    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult
    {
        $requiredKeys = [
            'points_covered',
            'points_required',
            'requirements_met',
            'depth_factor',
            'has_examples',
            'has_clear_position',
            'has_irrelevant_content',
        ];

        foreach ($requiredKeys as $key) {
            if (! array_key_exists($key, $evidence->task)) {
                return new EvidenceValidationResult(false, ["Missing writing evidence: {$key}"]);
            }
        }

        return new EvidenceValidationResult(true);
    }

    public function score(EvidenceBag $evidence, SignalBag $signals, AssessmentRubric $rubric): ScoreBag
    {
        $part = (int) ($rubric->task_type->value === 'writing_task_1_letter' ? 1 : 2);
        $metrics = $signals->vocabulary;
        $scoringRubric = $this->rubricResolver->active('writing');
        $formula = $this->formula();

        $scores = [
            'grammar' => $formula->grammar(
                $signals->syntax,
                (int) $metrics['grammar_error_count'],
                (int) $metrics['sentence_count'],
                (int) ($metrics['punctuation_error_count'] ?? 0),
            ),
            'vocabulary' => $formula->vocabulary($metrics),
            'task_fulfillment' => $formula->taskFulfillment($evidence->task, $part),
            'organization' => $formula->organization(
                (int) $metrics['paragraph_count'],
                (int) $metrics['linking_word_count'],
                (int) $metrics['sentence_count'],
                (float) ($metrics['sentence_variety'] ?? 0),
                $part,
                (bool) $signals->writingFormat['has_salutation'],
                (bool) $signals->writingFormat['has_closing'],
            ),
        ];

        $capped = $formula->applyTfCap($scores, $scoringRubric);
        $scores = $capped['rubricScores'];
        $capsApplied = [];

        $wordCount = (int) ($evidence->task['word_count'] ?? $metrics['word_count'] ?? 0);

        $failedRequirements = $this->failedAssessmentRequirements(
            $evidence->task,
            $wordCount,
            $part,
            $scoringRubric->taskFulfillmentParams(),
        );
        if ($failedRequirements !== []) {
            $scores = array_map(fn (): float => 1.0, $scores);
            $capsApplied['type'] = 'assessment_requirements_not_met';
            $capsApplied['failed_requirements'] = $failedRequirements;
            $capsApplied['word_count'] = $wordCount;
            $capsApplied['minimum_word_count'] = $part === 1
                ? $scoringRubric->taskFulfillmentParams()->wordMinimumTask1
                : $scoringRubric->taskFulfillmentParams()->wordMinimumTask2;
            $capsApplied['severe_minimum_word_count'] = $scoringRubric->taskFulfillmentParams()->severeMinimumWords($part);
            $capsApplied['points_covered'] = (int) ($evidence->task['points_covered'] ?? 0);
            $capsApplied['points_required'] = (int) ($evidence->task['points_required'] ?? 0);
            $capsApplied['copied_prompt'] = ($evidence->task['copied_prompt'] ?? false) === true;

            return new ScoreBag(
                criterionScores: $this->criterionScores($scores, $rubric),
                overallBand: 1.0,
                capsApplied: $capsApplied,
                calculationTrace: ['formula' => 'vstep_writing', 'rubric_id' => $scoringRubric->id],
            );
        }

        $shortResponseCap = $formula->applyShortResponseCap($scores, $wordCount, $scoringRubric);
        $scores = $shortResponseCap['rubricScores'];
        if ($shortResponseCap['capApplied'] !== null) {
            $capsApplied['short_response_word_count'] = $shortResponseCap['capApplied'];
        }

        return new ScoreBag(
            criterionScores: $this->criterionScores($scores, $rubric),
            overallBand: $this->overallBand($scores, $rubric),
            capsApplied: $capsApplied,
            calculationTrace: ['formula' => 'vstep_writing', 'rubric_id' => $scoringRubric->id],
        );
    }

    public function buildFeedback(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag
    {
        return new FeedbackBag(evidenceNotes: $this->formula()->insights(
            $signals->syntax,
            $signals->vocabulary,
            $evidence->task,
            (int) $signals->vocabulary['paragraph_count'],
            $this->taskType()->value === 'writing_task_1_letter' ? 1 : 2,
        ));
    }

    /** @param array<string,float> $scores @return list<CriterionScore> */
    private function criterionScores(array $scores, AssessmentRubric $rubric): array
    {
        $weights = $this->weights($rubric);

        return [
            new CriterionScore(CriterionKey::TaskFulfillment, $scores['task_fulfillment'], $weights['task_fulfillment']),
            new CriterionScore(CriterionKey::Organization, $scores['organization'], $weights['organization']),
            new CriterionScore(CriterionKey::Grammar, $scores['grammar'], $weights['grammar']),
            new CriterionScore(CriterionKey::Vocabulary, $scores['vocabulary'], $weights['vocabulary']),
        ];
    }

    /** @param array<string,float> $scores */
    private function overallBand(array $scores, AssessmentRubric $rubric): float
    {
        $weights = $this->weights($rubric);
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

    /** @return array<string,float> */
    private function weights(AssessmentRubric $rubric): array
    {
        $weights = collect($rubric->criteria)->mapWithKeys(fn (array $criterion): array => [
            (string) $criterion['key'] => (float) $criterion['weight'],
        ])->all();

        foreach (['task_fulfillment', 'organization', 'grammar', 'vocabulary'] as $key) {
            if (! isset($weights[$key])) {
                throw new AssessmentFailedException("Assessment rubric missing criterion weight: {$key}");
            }
        }

        return $weights;
    }

    private function part(AssessmentInput $input): int
    {
        return (int) ($input->prompt['part'] ?? ($this->taskType()->value === 'writing_task_1_letter' ? 1 : 2));
    }

    private function effectiveWordCount(AssessmentInput $input, SignalBag $signals): int
    {
        $signalWordCount = max(0, (int) ($signals->vocabulary['word_count'] ?? 0));
        if ($signalWordCount > 0) {
            return $signalWordCount;
        }

        $metadataWordCount = array_key_exists('word_count', $input->metadata)
            ? max(0, (int) $input->metadata['word_count'])
            : null;

        return $metadataWordCount ?? 0;
    }

    private function simpleWordCount(string $text): int
    {
        $trimmed = trim(preg_replace('/\s+/', ' ', $text) ?? '');
        if ($trimmed === '') {
            return 0;
        }

        return count(explode(' ', $trimmed));
    }

    private function isPromptCopy(string $text, string $prompt): bool
    {
        $normalizedText = $this->normalizeForCopyCheck($text);
        $normalizedPrompt = $this->normalizeForCopyCheck($prompt);

        if ($normalizedText === '' || $normalizedPrompt === '') {
            return false;
        }

        if ($normalizedText === $normalizedPrompt) {
            return true;
        }

        return str_contains($normalizedPrompt, $normalizedText)
            && $this->simpleWordCount($normalizedText) >= 8;
    }

    private function normalizeForCopyCheck(string $value): string
    {
        $value = mb_strtolower($value);
        $value = preg_replace('/[^a-z0-9\s]+/u', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    /**
     * @param  array<string,mixed>  $taskEvidence
     * @return list<string>
     */
    private function failedAssessmentRequirements(
        array $taskEvidence,
        int $wordCount,
        int $part,
        TaskFulfillmentParams $params,
    ): array {
        $failed = [];
        if ($wordCount < $params->severeMinimumWords($part)) {
            $failed[] = 'severe_minimum_word_count';
        }

        if ($this->hasInsufficientTaskCoverage($taskEvidence, $params->minimumCoveredPoints)) {
            $failed[] = 'task_coverage';
        }

        return $failed;
    }

    /** @param array<string,mixed> $taskEvidence */
    private function hasInsufficientTaskCoverage(array $taskEvidence, int $minimumCoveredPoints): bool
    {
        $covered = (float) ($taskEvidence['points_covered'] ?? 0);
        if ($covered >= $minimumCoveredPoints) {
            return false;
        }

        $requirementsMet = $taskEvidence['requirements_met'] ?? [];
        if (! is_array($requirementsMet) || $requirementsMet === []) {
            return true;
        }

        return count(array_filter($requirementsMet, fn (mixed $met): bool => $met === true)) === 0;
    }
}
