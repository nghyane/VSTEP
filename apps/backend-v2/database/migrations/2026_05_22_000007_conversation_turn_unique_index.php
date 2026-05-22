<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Defense in depth — unique turn_index per conversation session.
 *
 * App layer locks session row + recomputes nextIndex inside transaction.
 * DB constraint guards against race if locking fails (vd advisory lock
 * misconfig in future).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practice_speaking_conversation_turns', function (Blueprint $table) {
            $table->unique(['session_id', 'turn_index'], 'uq_conversation_turn_index');
        });
    }

    public function down(): void
    {
        Schema::table('practice_speaking_conversation_turns', function (Blueprint $table) {
            $table->dropUnique('uq_conversation_turn_index');
        });
    }
};
