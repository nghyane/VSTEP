<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\GradingJobStatus;
use App\Events\GradingCompleted;
use App\Events\GradingFailed;
use App\Models\GradingJob;
use App\Services\Grading\GradingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Unified grading queue job. Replaces GradeWritingJob + GradeSpeakingJob.
 *
 * Strategy resolution happens inside GradingService::process() based on
 * the GradingJob's submission_type. Retry/fail behavior governed by
 * Laravel's queue worker — max 3 attempts.
 */
final class GradeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $maxAttempts = 3;

    public function __construct(public readonly string $gradingJobId) {}

    public function handle(GradingService $gradingService): void
    {
        $job = GradingJob::query()->find($this->gradingJobId);
        if ($job === null) {
            Log::error('GradeJob: grading job not found', ['id' => $this->gradingJobId]);

            return;
        }

        $gradingService->process($job);

        DB::afterCommit(fn () => GradingCompleted::dispatch($job->refresh()));
    }

    public function failed(\Throwable $exception): void
    {
        $job = GradingJob::query()->find($this->gradingJobId);
        if ($job !== null) {
            $job->update([
                'status' => GradingJobStatus::Failed,
                'last_error' => $exception->getMessage(),
            ]);

            GradingFailed::dispatch($job, $exception->getMessage());
        }

        Log::error('GradeJob failed after max attempts', [
            'grading_job_id' => $this->gradingJobId,
            'error' => $exception->getMessage(),
        ]);
    }
}
