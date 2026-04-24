<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\GradingCompleted;
use App\Events\GradingFailed;
use App\Models\GradingJob;
use App\Services\WritingGradingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Queue job xử lý grading cho writing submission.
 * Retry tối đa 3 lần (config grading.max_retries).
 *
 * Event dispatch trong DB::afterCommit() để đảm bảo transaction đã commit.
 */
class GradeWritingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $maxAttempts = 3;

    public function __construct(
        public readonly string $gradingJobId,
    ) {}

    public function handle(WritingGradingService $gradingService): void
    {
        $job = GradingJob::query()->find($this->gradingJobId);
        if ($job === null) {
            Log::error('GradeWritingJob: grading job not found', ['id' => $this->gradingJobId]);

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
                'status' => 'failed',
                'last_error' => $exception->getMessage(),
            ]);

            GradingFailed::dispatch($job, $exception->getMessage());
        }

        Log::error('GradeWritingJob failed', [
            'grading_job_id' => $this->gradingJobId,
            'error' => $exception->getMessage(),
        ]);
    }
}
