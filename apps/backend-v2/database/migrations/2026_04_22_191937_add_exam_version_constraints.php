<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add CHECK constraints to enforce VSTEP exam structure at the database level.
 *
 * These are the last line of defense — no application code can bypass them.
 * If data violates a constraint, the database will reject the insert/update
 * regardless of whether it comes from seeder, API, or direct SQL.
 *
 * Constraints use PostgreSQL-specific syntax (jsonb_typeof, ::jsonb cast).
 * SQLite tests are skipped (SQLite CHECK uses different JSON functions).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! $this->isPostgres()) {
            return;
        }

        // Speaking: content must be non-empty JSON object (not empty string)
        DB::statement("ALTER TABLE exam_version_speaking_parts
            ADD CONSTRAINT speaking_parts_content_not_empty
            CHECK (jsonb_typeof(content::jsonb) = 'object' AND content::text NOT IN ('\"\"', 'null'))");

        // Listening: part must be 1, 2, or 3
        DB::statement('ALTER TABLE exam_version_listening_sections
            ADD CONSTRAINT listening_sections_part_valid
            CHECK (part IN (1, 2, 3))');

        // Reading: part must be 1, 2, 3, or 4
        DB::statement('ALTER TABLE exam_version_reading_passages
            ADD CONSTRAINT reading_passages_part_valid
            CHECK (part IN (1, 2, 3, 4))');

        // Writing: task_type must be 'letter' or 'essay'
        DB::statement("ALTER TABLE exam_version_writing_tasks
            ADD CONSTRAINT writing_tasks_task_type_valid
            CHECK (task_type IN ('letter', 'essay'))");

        // Writing: prompt must not be empty
        DB::statement("ALTER TABLE exam_version_writing_tasks
            ADD CONSTRAINT writing_tasks_prompt_not_empty
            CHECK (trim(prompt) != '')");

        // Listening items: correct_index must be 0-3 (4 options A/B/C/D)
        DB::statement('ALTER TABLE exam_version_listening_items
            ADD CONSTRAINT listening_items_correct_index_valid
            CHECK (correct_index BETWEEN 0 AND 3)');

        // Reading items: correct_index must be 0-3
        DB::statement('ALTER TABLE exam_version_reading_items
            ADD CONSTRAINT reading_items_correct_index_valid
            CHECK (correct_index BETWEEN 0 AND 3)');
    }

    public function down(): void
    {
        if (! $this->isPostgres()) {
            return;
        }

        DB::statement('ALTER TABLE exam_version_speaking_parts DROP CONSTRAINT IF EXISTS speaking_parts_content_not_empty');
        DB::statement('ALTER TABLE exam_version_listening_sections DROP CONSTRAINT IF EXISTS listening_sections_part_valid');
        DB::statement('ALTER TABLE exam_version_reading_passages DROP CONSTRAINT IF EXISTS reading_passages_part_valid');
        DB::statement('ALTER TABLE exam_version_writing_tasks DROP CONSTRAINT IF EXISTS writing_tasks_task_type_valid');
        DB::statement('ALTER TABLE exam_version_writing_tasks DROP CONSTRAINT IF EXISTS writing_tasks_prompt_not_empty');
        DB::statement('ALTER TABLE exam_version_listening_items DROP CONSTRAINT IF EXISTS listening_items_correct_index_valid');
        DB::statement('ALTER TABLE exam_version_reading_items DROP CONSTRAINT IF EXISTS reading_items_correct_index_valid');
    }

    private function isPostgres(): bool
    {
        return Schema::connection($this->getConnection())->getConnection()->getDriverName() === 'pgsql';
    }
};
