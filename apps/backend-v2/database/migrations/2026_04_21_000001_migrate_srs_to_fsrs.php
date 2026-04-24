<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * RFC 0012: Migrate SRS from SM-2 to FSRS.
 * Replace SM-2 columns with FSRS state (difficulty, stability, last_review_at).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_vocab_srs_states', function (Blueprint $table) {
            $table->dropColumn([
                'state_kind',
                'remaining_steps',
                'interval_days',
                'ease_factor',
                'review_interval_days',
                'review_ease_factor',
            ]);

            $table->float('difficulty')->default(0);
            $table->float('stability')->default(0);
            $table->timestamp('last_review_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('profile_vocab_srs_states', function (Blueprint $table) {
            $table->dropColumn(['difficulty', 'stability', 'last_review_at']);

            $table->string('state_kind', 15)->after('word_id');
            $table->integer('interval_days')->nullable();
            $table->decimal('ease_factor', 4, 2)->nullable();
            $table->smallInteger('remaining_steps')->nullable();
            $table->integer('review_interval_days')->nullable();
            $table->decimal('review_ease_factor', 4, 2)->nullable();
        });
    }
};
