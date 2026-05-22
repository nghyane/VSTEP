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
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class WritingGradingStrategy implements GradingStrategy
{
    public function __construct(
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly LlmGrader $llm,
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

        $promptText = match (true) {
            $submission instanceof PracticeWritingSubmission => (string) ($submission->prompt?->prompt ?? ''),
            $submission instanceof ExamWritingSubmission => (string) ($submission->task?->prompt ?? ''),
            default => '',
        };

        // Layer 1: LanguageTool grammar detection.
        $ltMatches = $this->languageTool->check($text);
        $annotations = $this->languageTool->toAnnotations($text, $ltMatches);

        // Layer 2: Rule-based caps.
        $ruleAnalysis = $this->ruleScoring->analyze($text, $ltMatches);

        // Layer 3: LLM grading (throws on failure → job retries).
        $llmResult = $this->llm->gradeWriting($text, $promptText, $ltMatches, $ruleAnalysis);

        // Layer 4: Reconcile — cap LLM with rule-based limits.
        $reconciledScores = $this->ruleScoring->reconcile(
            $llmResult['rubric_scores'],
            $ruleAnalysis['caps'],
        );

        return new WritingGradingData(
            rubricScores: $reconciledScores,
            overallBand: $this->computeOverallBand($reconciledScores),
            strengths: $llmResult['strengths'],
            improvements: $llmResult['improvements'],
            rewrites: $llmResult['rewrites'],
            annotations: array_merge($annotations, $llmResult['annotations']),
        );
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

    /**
     * @param  array<string,float>  $scores
     */
    private function computeOverallBand(array $scores): float
    {
        $count = count($scores);
        if ($count === 0) {
            return 5.0;
        }

        $raw = (array_sum($scores) / ($count * 4)) * 10;

        return round($raw * 2) / 2;
    }
}
