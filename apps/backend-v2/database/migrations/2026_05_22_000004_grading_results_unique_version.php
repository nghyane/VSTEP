<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Defense in depth — unique versioning at DB level.
 *
 * App layer uses pg_advisory_xact_lock keyed by submission to serialize
 * concurrent grading. This constraint is the last-resort guard if locking
 * fails or is misconfigured.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Dedupe defensively — keep newest row per (submission, version).
        DB::statement('
            DELETE FROM writing_grading_results a
            USING writing_grading_results b
            WHERE a.id < b.id
              AND a.submission_type = b.submission_type
              AND a.submission_id = b.submission_id
              AND a.version = b.version
        ');

        DB::statement('
            DELETE FROM speaking_grading_results a
            USING speaking_grading_results b
            WHERE a.id < b.id
              AND a.submission_type = b.submission_type
              AND a.submission_id = b.submission_id
              AND a.version = b.version
        ');

        DB::statement('ALTER TABLE writing_grading_results
            ADD CONSTRAINT uq_writing_result_version
            UNIQUE (submission_type, submission_id, version)');

        DB::statement('ALTER TABLE speaking_grading_results
            ADD CONSTRAINT uq_speaking_result_version
            UNIQUE (submission_type, submission_id, version)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE writing_grading_results DROP CONSTRAINT IF EXISTS uq_writing_result_version');
        DB::statement('ALTER TABLE speaking_grading_results DROP CONSTRAINT IF EXISTS uq_speaking_result_version');
    }
};
