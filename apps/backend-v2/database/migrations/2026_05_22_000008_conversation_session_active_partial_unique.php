<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Partial unique index — at most 1 active conversation session per
 * (profile, scenario). Prevents duplicate startSession race.
 *
 * Triggers QueryException 23505 → SpeakingConversationService catches
 * and surfaces as ValidationException with FE-friendly message.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("
            CREATE UNIQUE INDEX uq_conversation_session_active
            ON practice_speaking_conversation_sessions (profile_id, scenario_id)
            WHERE status = 'active'
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS uq_conversation_session_active');
    }
};
