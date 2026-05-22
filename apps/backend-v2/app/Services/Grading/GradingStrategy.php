<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\GradingResultData;
use App\Models\GradingJob;
use Illuminate\Database\Eloquent\Model;

/**
 * Grading strategy contract.
 *
 * Implementations grade a specific skill (writing, speaking, ...).
 * Service layer resolves the strategy by submission_type, calls grade(),
 * then persists via the strategy's persistResult().
 *
 * Crucially: grade() must be a pure compute step — no DB writes.
 * DB writes happen in persistResult() under a transaction with row locks
 * (versioning safety).
 */
interface GradingStrategy
{
    /**
     * Submission types this strategy handles.
     *
     * @return list<string>
     */
    public function supports(): array;

    /**
     * Load the submission entity for this job, or null if not found.
     */
    public function loadSubmission(GradingJob $job): ?Model;

    /**
     * Grade the submission. Pure compute — calls external APIs (LLM, STT)
     * but does NOT write to DB. Throws GradingFailedException on hard failures.
     */
    public function grade(Model $submission): GradingResultData;

    /**
     * Persist the result with versioning + active toggle, all inside a
     * transaction with row lock to prevent concurrent grading races.
     */
    public function persistResult(GradingJob $job, GradingResultData $data): void;
}
