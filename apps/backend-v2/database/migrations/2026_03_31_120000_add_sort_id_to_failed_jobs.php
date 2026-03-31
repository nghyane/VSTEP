<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('failed_jobs') || Schema::hasColumn('failed_jobs', 'id')) {
            return;
        }

        DB::statement('ALTER TABLE failed_jobs ADD COLUMN id BIGSERIAL');
        DB::statement('CREATE INDEX failed_jobs_id_index ON failed_jobs (id DESC)');
    }

    public function down(): void
    {
        if (! Schema::hasTable('failed_jobs') || ! Schema::hasColumn('failed_jobs', 'id')) {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS failed_jobs_id_index');
        DB::statement('ALTER TABLE failed_jobs DROP COLUMN id');
    }
};
