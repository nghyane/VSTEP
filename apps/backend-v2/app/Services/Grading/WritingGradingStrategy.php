<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Ai\Contracts\TaskFulfillmentAssessor;
use App\Ai\Contracts\WritingFeedbackGenerator;
use App\DTOs\Grading\GradingResultData;
use App\DTOs\Grading\WritingGradingData;
use App\Enums\GradingJobStatus;
use App\Exceptions\GradingFailedException;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\WritingGradingResult;
use App\Services\LanguageDetector;
use App\Services\LanguageToolService;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class WritingGradingStrategy implements GradingStrategy
{
    public function __construct(
        private readonly LanguageDetector $languageDetector,
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly SyntaxAnalyzer $syntax,
        private readonly WritingScoringFormula $formula,
        private readonly TaskFulfillmentAssessor $taskAssessor,
        private readonly WritingFeedbackGenerator $feedbackGenerator,
        private readonly RubricResolver $rubricResolver,
        private readonly CefrVocabularyClassifier $cefrClassifier,
    ) {}

    public function supports(): array
    {
        return ['practice_writing', 'exam_writing'];
    }

    public function loadSubmission(GradingJob $job): ?Model
    {
        return match ($job->submission_type) {
            'practice_writing' => PracticeWritingSubmission::query()->with('prompt')->find($job->submission_id),
            'exam_writing' => ExamWritingSubmission::query()->with('task')->find($job->submission_id),
            default => null,
        };
    }

    public function grade(Model $submission, GradingJob $job): GradingResultData
    {
        $text = (string) ($submission->text ?? '');
        if ($text === '') {
            throw new GradingFailedException('Writing submission has no text');
        }

        // Language detection: reject non-English submissions before pipeline
        $lang = $this->languageDetector->detect($text);
        if (! $lang['is_english']) {
            throw new GradingFailedException(
                'Writing submission is not in English. '
                .'confidence='.$lang['confidence']
                .' non_ascii_letter_ratio='.$lang['non_ascii_letter_ratio'],
            );
        }

        $rubric = $this->rubricResolver->active('writing');

        $promptText = match (true) {
            $submission instanceof PracticeWritingSubmission => (string) ($submission->prompt?->prompt ?? ''),
            $submission instanceof ExamWritingSubmission => (string) ($submission->task?->prompt ?? ''),
            default => '',
        };

        // Phase 1: LanguageTool grammar check (external API)
        $t = microtime(true);
        $ltMatches = $this->languageTool->check($text);
        $annotations = $this->languageTool->toAnnotations($text, $ltMatches);
        $job->addProgress('grammar_check', ['duration_ms' => (int) ((microtime(true) - $t) * 1000), 'errors' => count($ltMatches)]);

        // Phase 2: Rule-based metrics + syntax (local, fast)
        $t = microtime(true);
        $ruleAnalysis = $this->ruleScoring->analyze($text, $ltMatches);
        $syntaxAnalysis = $this->syntax->analyze($text);
        $ruleAnalysis['syntax'] = $syntaxAnalysis;

        // CEFR vocabulary classification (replaces hardcoded complex_vocab_count)
        $cefr = $this->cefrClassifier->analyze($text);
        $ruleAnalysis['metrics']['cefr_weighted_avg'] = $cefr['cefr_weighted_avg'];
        $ruleAnalysis['metrics']['cefr_advanced_ratio'] = $cefr['advanced_ratio'];
        $ruleAnalysis['metrics']['cefr_vocab_count'] = $cefr['cefr_vocab_count'];

        $job->addProgress('metrics', ['duration_ms' => (int) ((microtime(true) - $t) * 1000)]);

        // Safety net: if all English-specific signals are zero, refuse to grade
        $this->guardEnglishSignals($syntaxAnalysis, $ruleAnalysis['metrics'], $cefr);

        $part = $this->extractPart($submission);

        // Phase 3: LLM check — requirement YES/NO (both modes, <1s)
        $t = microtime(true);
        $requirements = $this->extractRequirements($submission);
        $evidence = $this->taskAssessor->assess($text, $promptText, $requirements, $ltMatches, $ruleAnalysis, $part);
        $job->addProgress('llm_evidence', ['duration_ms' => (int) ((microtime(true) - $t) * 1000)]);

        // Phase 5: LLM feedback — exam only (auto), practice on-demand (separate API)
        $strengths = [];
        $improvements = [];
        $rewrites = [];

        if ($submission instanceof ExamWritingSubmission) {
            $t = microtime(true);
            $bandContext = null;
            $feedback = $this->feedbackGenerator->generate($text, $promptText, $ruleAnalysis['metrics'], $ltMatches, $bandContext, $part);
            $job->addProgress('llm_feedback', ['duration_ms' => (int) ((microtime(true) - $t) * 1000)]);

            $strengths = $feedback['strengths'];
            $improvements = $this->normalizeFeedback($feedback['improvements']);
            $rewrites = $feedback['rewrites'];
        }

        // Phase 4: Formula scoring (deterministic, instant)
        $t = microtime(true);
        $sentenceCount = $ruleAnalysis['metrics']['sentence_count'];
        $wordCount = $ruleAnalysis['metrics']['word_count'];
        $paragraphCount = $ruleAnalysis['metrics']['paragraph_count'];

        $tfScore = $this->formula->taskFulfillment($evidence, $part);

        // Inject tone signals into evidence for sub-signal scoring
        $toneSignals = $ruleAnalysis['metrics']['tone_signals'] ?? [];
        $evidence['tone_informal_count'] = $toneSignals['informal_count'] ?? 0;

        $rubricScores = [
            'grammar' => $this->formula->grammar(
                $syntaxAnalysis,
                $ruleAnalysis['metrics']['grammar_error_count'],
                $sentenceCount,
                (int) ($ruleAnalysis['metrics']['punctuation_error_count'] ?? 0),
            ),
            'vocabulary' => $this->formula->vocabulary($ruleAnalysis['metrics']),
            'task_fulfillment' => $tfScore,
            'organization' => $this->formula->organization(
                $paragraphCount,
                $ruleAnalysis['metrics']['linking_word_count'],
                $sentenceCount,
                (float) ($ruleAnalysis['metrics']['sentence_variety'] ?? 0),
                $part,
                (bool) ($ruleAnalysis['metrics']['has_salutation'] ?? false),
                (bool) ($ruleAnalysis['metrics']['has_closing'] ?? false),
            ),
        ];
        $overallBand = $rubric->computeOverallBand($rubricScores);

        // TF ratio cap (prevents TF from dominating when other criteria are weak)
        $capped = $this->formula->applyTfCap($rubricScores, $rubric);
        $rubricScores = $capped['rubricScores'];
        $overallBand = $capped['overallBand'];

        $job->addProgress('scores', [
            'duration_ms' => (int) ((microtime(true) - $t) * 1000),
            'rubric_scores' => $rubricScores,
            'overall_band' => $overallBand,
        ]);

        // Deterministic insights: always available, zero-cost
        $insights = $this->formula->insights($syntaxAnalysis, $ruleAnalysis['metrics'], $evidence, $paragraphCount, $part);
        $annotations['_insights'] = $insights;

        return new WritingGradingData(
            rubricScores: $rubricScores,
            overallBand: $overallBand,
            strengths: $strengths,
            improvements: $improvements,
            rewrites: $rewrites,
            annotations: $annotations,
            rubricId: $rubric->id,
        );
    }

    /** @return list<string> */
    private function extractRequirements(Model $submission): array
    {
        if ($submission instanceof ExamWritingSubmission) {
            $reqs = $submission->task?->requirements;

            return is_array($reqs) ? array_values(array_filter($reqs, fn ($v) => is_string($v) && $v !== '')) : [];
        }

        if ($submission instanceof PracticeWritingSubmission) {
            $reqs = $submission->prompt?->required_points;

            return is_array($reqs) ? array_values(array_filter($reqs, fn ($v) => is_string($v) && $v !== '')) : [];
        }

        return [];
    }

    private function extractPart(Model $submission): int
    {
        if ($submission instanceof ExamWritingSubmission) {
            return (int) ($submission->task?->part ?? 2);
        }

        if ($submission instanceof PracticeWritingSubmission) {
            return (int) ($submission->prompt?->part ?? 2);
        }

        return 2;
    }

    /** @return array{current: string, target: string}|null */
    private function resolveBandContext(PracticeWritingSubmission $submission): ?array
    {
        $profile = Profile::query()->find($submission->profile_id);
        if ($profile === null || $profile->entry_level === null) {
            return null;
        }

        return [
            'current' => $profile->entry_level,
            'target' => $profile->target_level ?? $profile->entry_level,
        ];
    }

    /**
     * Guard: if all English-specific linguistic signals are zero,
     * the text is either not English or too short to grade.
     *
     * Skip for very short texts (< 30 words) — legitimate short
     * submissions may not trigger any signal.
     *
     * @param  array{count: int}  $syntax
     * @param  array<string,mixed>  $metrics
     * @param  array{cefr_vocab_count: int}  $cefr
     */
    private function guardEnglishSignals(array $syntax, array $metrics, array $cefr): void
    {
        $wordCount = (int) ($metrics['word_count'] ?? 0);
        if ($wordCount < 30) {
            return;
        }

        $structureCount = $syntax['count'] ?? -1;
        $linkingCount = (int) ($metrics['linking_word_count'] ?? 0);
        $complexVocab = (int) ($metrics['complex_vocab_count'] ?? 0);
        $cefrVocab = (int) ($cefr['cefr_vocab_count'] ?? 0);

        if ($structureCount === 0 && $linkingCount === 0 && $complexVocab === 0 && $cefrVocab === 0) {
            throw new GradingFailedException(
                'No English linguistic features detected: '
                ."syntax_types={$structureCount} linking_words={$linkingCount} "
                ."complex_vocab={$complexVocab} cefr_vocab={$cefrVocab}",
            );
        }
    }

    /** @param  list<string>  $items
     *  @return list<array{message: string, explanation: string}> */
    private function normalizeFeedback(array $items): array
    {
        return array_map(fn (string $s) => ['message' => $s, 'explanation' => ''], $items);
    }

    public function persistResult(GradingJob $job, GradingResultData $data): void
    {
        DB::transaction(function () use ($job, $data) {
            DB::statement('SELECT pg_advisory_xact_lock(?)', [crc32($job->submission_type.':'.$job->submission_id)]);

            $version = WritingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->max('version') ?? 0;

            WritingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            WritingGradingResult::create([
                ...$data->toModelAttributes(),
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
            ]);

            $job->update([
                'status' => GradingJobStatus::Ready,
                'completed_at' => now(),
            ]);
        });
    }
}
