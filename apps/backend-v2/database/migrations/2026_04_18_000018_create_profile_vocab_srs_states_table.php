<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cache Anki state per (profile, word).
 * state_kind ∈ (new, learning, review, relearning).
 * Non-applicable fields = null theo state.
 *
 * Source of truth: practice_vocab_reviews.
 * Cache miss = derive 'new' state.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_vocab_srs_states', function (Blueprint $table) {
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('word_id')->constrained('vocab_words')->cascadeOnDelete();
            $table->string('state_kind', 15);
            $table->timestamp('due_at');
            $table->integer('interval_days')->nullable();
            $table->decimal('ease_factor', 4, 2)->nullable();
            $table->smallInteger('lapses')->default(0);
            $table->smallInteger('remaining_steps')->nullable();
            $table->integer('review_interval_days')->nullable();
            $table->decimal('review_ease_factor', 4, 2)->nullable();
            $table->timestamp('updated_at')->useCurrent();

            $table->primary(['profile_id', 'word_id']);
            $table->index(['profile_id', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_vocab_srs_states');
    }
};
