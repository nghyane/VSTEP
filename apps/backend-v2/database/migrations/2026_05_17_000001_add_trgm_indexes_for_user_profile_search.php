<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * GIN trigram indexes để ILIKE %q% trên 1M+ rows vẫn nhanh.
     * Admin picker (POST admin/profiles/search) tìm theo email + full_name + nickname.
     * Không index `lower()` vì ILIKE đã case-insensitive và gin_trgm_ops xử lý cả 2 chiều.
     *
     * Skip trên non-PostgreSQL (SQLite test DB) — pg_trgm là PostgreSQL extension.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        DB::statement('CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON users USING gin (email gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON users USING gin (full_name gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS profiles_nickname_trgm_idx ON profiles USING gin (nickname gin_trgm_ops)');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS users_email_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS users_full_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS profiles_nickname_trgm_idx');
    }
};
