<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Append-only review log. Source of truth cho SRS state (derive).
 * previous_state/new_state snapshot JSONB cho audit + replay.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_vocab_reviews', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('word_id')->constrained('vocab_words')->restrictOnDelete();
            $table->foreignUuid('session_id')
                ->nullable()
                ->constrained('practice_sessions')
                ->nullOnDelete();
            $table->tinyInteger('rating');
            $table->json('previous_state');
            $table->json('new_state');
            $table->timestamp('reviewed_at');

            $table->index(['profile_id', 'word_id', 'reviewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_vocab_reviews');
    }
};
