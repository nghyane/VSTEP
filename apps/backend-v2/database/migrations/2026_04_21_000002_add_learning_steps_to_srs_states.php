<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add learning step columns back for Anki-style scheduling with FSRS.
 * FSRS handles memory (difficulty, stability).
 * Learning steps handle intraday scheduling (kind, remaining_steps).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_vocab_srs_states', function (Blueprint $table) {
            $table->string('state_kind', 15)->default('new')->after('word_id');
            $table->smallInteger('remaining_steps')->default(0)->after('lapses');
        });

        // Existing rows with difficulty > 0 are graduated reviews
        DB::table('profile_vocab_srs_states')
            ->where('difficulty', '>', 0)
            ->update(['state_kind' => 'review']);
    }

    public function down(): void
    {
        Schema::table('profile_vocab_srs_states', function (Blueprint $table) {
            $table->dropColumn(['state_kind', 'remaining_steps']);
        });
    }
};
