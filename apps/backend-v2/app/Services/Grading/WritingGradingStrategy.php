<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\GradingResultData;
use App\DTOs\Grading\WritingGradingData;
use App\Enums\GradingJobStatus;
use App\Exceptions\GradingFailedException;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeWritingSubmission;
use App\Models\WritingGradingResult;
use App\Services\LanguageToolService;
use App\Services\RuleBasedScoringService;
use App\Services\SyntaxAnalyzer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class WritingGradingStrategy implements GradingStrategy
{
    public function __construct(
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly SyntaxAnalyzer $syntax,
        private readonly WritingScoringFormula $formula,
        private readonly LlmGrader $llm,
        private readonly RubricResolver $rubricResolver,
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

    public function grade(Model $submission): GradingResultData
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

        // Layer 1: LanguageTool grammar detection.
        $ltAvailable = $this->languageTool->isAvailable();
        if (! $ltAvailable) {
            \Log::warning('WritingGradingStrategy: LanguageTool unavailable — grading without grammar annotations');
        }
        $ltMatches = $ltAvailable ? $this->languageTool->check($text) : [];
        $annotations = $ltAvailable ? $this->languageTool->toAnnotations($text, $ltMatches) : [];

        // Layer 2: Pre-computed metrics + syntax analysis for LLM context.
        $ruleAnalysis = $this->ruleScoring->analyze($text, $ltMatches);
        $syntaxAnalysis = $this->syntax->analyze($text);
        $ruleAnalysis['syntax'] = $syntaxAnalysis;

        // Layer 3: LLM extracts task-specific evidence (checks each requirement).
        $requirements = $this->extractRequirements($submission);
        $llmResult = $this->llm->extractEvidence($text, $promptText, $requirements, $ltMatches, $ruleAnalysis);
        $evidence = $llmResult['evidence'];

        // Layer 4: Deterministic formula computes scores from objective features.
        // Only task_fulfillment uses LLM evidence (semantic understanding).
        // Grammar → SyntaxAnalyzer + LanguageTool
        // Vocabulary → unique ratio + word length from metrics
        // Organization → paragraph count + linking words from metrics
        $sentenceCount = $ruleAnalysis['metrics']['sentence_count'];
        $rubricScores = [
            'grammar' => $this->formula->grammar($syntaxAnalysis, count($ltMatches), $sentenceCount),
            'vocabulary' => $this->formula->vocabulary($ruleAnalysis['metrics']),
            'task_fulfillment' => $this->formula->taskFulfillment($evidence['task_fulfillment'] ?? []),
            'organization' => $this->formula->organization(
                $ruleAnalysis['metrics']['paragraph_count'],
                $ruleAnalysis['metrics']['linking_word_count'],
                $sentenceCount,
                (float) ($ruleAnalysis['metrics']['sentence_variety'] ?? 0),
            ),
        ];

        $overallBand = $rubric->computeOverallBand($rubricScores);

        // Layer 5: Sanity penalty for short texts.
        $overallBand = $this->applySanityCap($text, $overallBand);

        return new WritingGradingData(
            rubricScores: $rubricScores,
            overallBand: $overallBand,
            strengths: $llmResult['strengths'],
            improvements: $llmResult['improvements'],
            rewrites: $llmResult['rewrites'],
            annotations: $annotations,
            rubricId: $rubric->id,
        );
    }

    /**
     * Apply linear word-count penalty based on VSTEP Task 1 minimum.
     *
     * Formula: W' = W × min(1, w / θ)
     *   w = word count
     *   θ = 120 (VSTEP Task 1 minimum per Thông tư 23/2017/TT-BGDĐT)
     *
     * Properties:
     *   - w = 0 → W' = 0 (no text = band 0 per rubric)
     *   - w = 60 → W' = 0.5W (50% of minimum = 50% penalty)
     *   - w ≥ θ → W' = W (no penalty)
     *
     * Result rounded to nearest 0.5 per VSTEP convention.
     */
    /**
     * Extract scoring requirements from submission's task model.
     *
     * Exam tasks: `requirements` array configured by admin per task (e.g. ["State opinion", "Give 2 reasons"]).
     * Practice tasks: no requirements yet (fallback to empty, LLM infers from prompt).
     *
     * @return list<string>
     */
    private function extractRequirements(Model $submission): array
    {
        // Exam tasks: `requirements` array configured by admin
        if ($submission instanceof ExamWritingSubmission) {
            $reqs = $submission->task?->requirements;

            return is_array($reqs) ? array_values(array_filter($reqs, fn ($v) => is_string($v) && $v !== '')) : [];
        }

        // Practice tasks: `required_points` array configured by admin
        if ($submission instanceof PracticeWritingSubmission) {
            $reqs = $submission->prompt?->required_points;

            return is_array($reqs) ? array_values(array_filter($reqs, fn ($v) => is_string($v) && $v !== '')) : [];
        }

        return [];
    }

    private function applySanityCap(string $text, float $band): float
    {
        $wordCount = str_word_count(trim($text));

        // Edge case: no text → band 0 per rubric (Thông tư 23/2017: "Không viết bài")
        if ($wordCount === 0) {
            return 0.0;
        }

        // Linear penalty based on VSTEP Task 1 minimum word count (120 words)
        $penalty = min(1.0, $wordCount / 120.0);

        return round($band * $penalty * 2) / 2;
    }

    public function persistResult(GradingJob $job, GradingResultData $data): void
    {
        DB::transaction(function () use ($job, $data) {
            // Serialize concurrent grading for same submission via advisory lock
            // keyed by submission id hash. Cheaper than locking submission row.
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
