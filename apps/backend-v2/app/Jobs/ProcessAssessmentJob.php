<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Assessment\Services\AssessmentProcessingService;
use App\Models\AssessmentJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

final class ProcessAssessmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(
        public readonly string $assessmentJobId,
    ) {}

    public function handle(AssessmentProcessingService $service): void
    {
        $job = AssessmentJob::query()->find($this->assessmentJobId)
            ?? throw new \RuntimeException('Assessment job not found.');

        $service->process($job);
    }
}
