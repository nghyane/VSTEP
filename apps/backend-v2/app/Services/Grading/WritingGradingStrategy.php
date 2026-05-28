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
use App\Services\LanguageToolService;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use App\Services\Vocab\CefrVocabularyClassifier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class WritingGradingStrategy implements GradingStrategy
{
    public function __construct(
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

        $part = $this->extractPart($submission);
        $isExam = $submission instanceof ExamWritingSubmission;

        // Phase 3: LLM (exam only) — evidence + feedback
        $strengths = [];
        $improvements = [];
        $rewrites = [];

        if ($isExam) {
            $t = microtime(true);
            $requirements = $this->extractRequirements($submission);
            $evidence = $this->taskAssessor->assess($text, $promptText, $requirements, $ltMatches, $ruleAnalysis, $part);
            $job->addProgress('llm_evidence', ['duration_ms' => (int) ((microtime(true) - $t) * 1000)]);

            // Phase 5: LLM feedback (exam only)
            $t = microtime(true);
            $bandContext = $submission instanceof PracticeWritingSubmission
                ? $this->resolveBandContext($submission)
                : null;
            $feedback = $this->feedbackGenerator->generate($text, $promptText, $ruleAnalysis['metrics'], $ltMatches, $bandContext);
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

        if ($isExam && isset($evidence)) {
            $tfScore = $this->formula->taskFulfillment($evidence, $part);
        } else {
            $tfScore = $this->formula->taskFulfillment([
                'points_covered' => min($paragraphCount, $part === 1 ? 3 : 4),
                'points_required' => $part === 1 ? 3 : 4,
                'depth_factor' => min(1.0, $wordCount / ($part === 1 ? 120 : 250)),
                'has_examples' => str_contains(strtolower($text), 'for example') || str_contains(strtolower($text), 'for instance'),
                'has_clear_position' => str_contains(strtolower($text), 'i believe') || str_contains(strtolower($text), 'i think') || str_contains(strtolower($text), 'in my opinion') || str_contains(strtolower($text), 'in conclusion'),
                'has_irrelevant_content' => false,
            ], $part);
        }

        $rubricScores = [
            'grammar' => $this->formula->grammar($syntaxAnalysis, $ruleAnalysis['metrics']['grammar_error_count'], $sentenceCount),
            'vocabulary' => $this->formula->vocabulary($ruleAnalysis['metrics']),
            'task_fulfillment' => $tfScore,
            'organization' => $this->formula->organization(
                $paragraphCount,
                $ruleAnalysis['metrics']['linking_word_count'],
                $sentenceCount,
                (float) ($ruleAnalysis['metrics']['sentence_variety'] ?? 0),
            ),
        ];
        $overallBand = $rubric->computeOverallBand($rubricScores);
        $overallBand = $this->applySanityCap($text, $overallBand, $part);
        $job->addProgress('scores', [
            'duration_ms' => (int) ((microtime(true) - $t) * 1000),
            'rubric_scores' => $rubricScores,
            'overall_band' => $overallBand,
        ]);

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
     * Apply word-count penalty per VSTEP task minimum (from rubric DB params).
     *
     * Task 1: word_minimum_task1 (default 120 per Thông tư 23/2017).
     * Task 2: word_minimum_task2 (default 250 per Thông tư 23/2017).
     *
     * Formula: W' = W × min(1, w / θ)
     * Result rounded to nearest 0.5 per VSTEP convention.
     */
    private function applySanityCap(string $text, float $band, int $part = 2): float
    {
        $wordCount = str_word_count(trim($text));

        if ($wordCount === 0) {
            return 0.0;
        }

        $tf = $this->formula->taskFulfillmentParams();
        $minimum = $part === 1 ? $tf->wordMinimumTask1 : $tf->wordMinimumTask2;
        $penalty = min(1.0, $wordCount / $minimum);

        return round($band * $penalty * 2) / 2;
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
