<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\GradingResultData;
use App\Models\GradingJob;
use Illuminate\Database\Eloquent\Model;

interface GradingStrategy
{
    /** @return list<string> */
    public function supports(): array;

    public function loadSubmission(GradingJob $job): ?Model;

    public function grade(Model $submission, GradingJob $job): GradingResultData;

    public function persistResult(GradingJob $job, GradingResultData $data): void;
}
