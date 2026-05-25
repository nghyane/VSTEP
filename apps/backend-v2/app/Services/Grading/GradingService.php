<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Enums\GradingJobStatus;
use App\Exceptions\GradingFailedException;
use App\Jobs\GradeJob;
use App\Models\GradingJob;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Unified grading orchestrator. Delegates skill-specific logic to strategies.
 *
 * Flow:
 *   enqueue → create job (pending) → dispatch queue
 *   GradeJob::handle → process()
 *     → status=processing
 *     → strategy->grade() (pure compute, no DB)
 *     → strategy->persistResult() (status=ready inside transaction)
 *
 * Failure handling:
 *   - strategy->grade() throws → GradeJob::failed() runs after retries exhausted
 *     → status=failed + event
 */
final class GradingService
{
    public function __construct(
        private readonly GradingStrategyResolver $resolver,
    ) {}

    /**
     * Create job + dispatch. Idempotent via partial unique index on
     * (submission_type, submission_id) WHERE status IN (pending, processing).
     *
     * If called inside an active DB transaction, dispatch is deferred until
     * commit (DB::afterCommit). This ensures the queued job can find the
     * grading_jobs row regardless of caller's transaction boundary.
     */
    public function enqueue(string $submissionType, string $submissionId): GradingJob
    {
        // Fail fast if submission_type is unknown.
        $this->resolver->for($submissionType);

        try {
            $job = GradingJob::create([
                'submission_type' => $submissionType,
                'submission_id' => $submissionId,
                'status' => GradingJobStatus::Pending,
            ]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'submission' => ['A grading job is already pending or processing for this submission.'],
            ]);
        }

        // Defer dispatch when inside a transaction — guarantees grading_jobs
        // row is committed before the queue worker tries to load it.
        $jobId = $job->id;
        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => GradeJob::dispatch($jobId));
        } else {
            GradeJob::dispatch($jobId);
        }

        return $job->refresh();
    }

    public function process(GradingJob $job): void
    {
        $strategy = $this->resolver->for($job->submission_type);
        $submission = $strategy->loadSubmission($job);

        if ($submission === null) {
            throw new GradingFailedException(
                "Submission not found: {$job->submission_type}:{$job->submission_id}",
            );
        }

        // Mark processing — small transaction.
        DB::transaction(fn () => $job->update([
            'status' => GradingJobStatus::Processing,
            'started_at' => now(),
            'attempts' => $job->attempts + 1,
        ]));

        // Heavy work — LLM, STT, etc. NO transaction (would hold connection 30s+).
        $resultData = $strategy->grade($submission);

        // Persist result + mark ready — strategy controls transaction internally.
        $strategy->persistResult($job, $resultData);
    }
}
