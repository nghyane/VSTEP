<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Refresh tokens: bcrypt → SHA-256 indexed lookup.
 *
 * Refresh token có entropy cao (Str::random(64)) nên không cần bcrypt slow-hash.
 * SHA-256 deterministic → index column → O(1) lookup thay vì O(N) bcrypt scan.
 *
 * Existing rows orphan → users phải re-login (acceptable: TTL chỉ 30 ngày).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Wipe trước khi đổi schema: bcrypt hashes không convert được sang
        // SHA-256, và cột mới `token_hash` NOT NULL — không truncate sẽ vi phạm
        // NOT NULL trên bất kỳ DB nào có session hiện hành (CI fresh thì không
        // gặp, dev/prod với data thật thì migration FAIL).
        DB::table('refresh_tokens')->truncate();

        Schema::table('refresh_tokens', function (Blueprint $table) {
            $table->dropColumn('token');
        });

        Schema::table('refresh_tokens', function (Blueprint $table) {
            // SHA-256 hex = 64 chars.
            $table->string('token_hash', 64)->after('user_id')->unique();
        });
    }

    public function down(): void
    {
        Schema::table('refresh_tokens', function (Blueprint $table) {
            $table->dropUnique(['token_hash']);
            $table->dropColumn('token_hash');
        });

        Schema::table('refresh_tokens', function (Blueprint $table) {
            $table->string('token')->after('user_id');
        });
    }
};
