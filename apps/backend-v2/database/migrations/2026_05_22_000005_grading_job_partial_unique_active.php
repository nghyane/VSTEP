<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Partial unique index — at most 1 active (pending/processing) grading job
 * per submission. Prevents duplicate enqueue race.
 *
 * Triggers QueryException 23505 → GradingService::enqueue catches and
 * surfaces as ValidationException with FE-friendly message.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("
            CREATE UNIQUE INDEX uq_grading_job_active
            ON grading_jobs (submission_type, submission_id)
            WHERE status IN ('pending', 'processing')
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS uq_grading_job_active');
    }
};
